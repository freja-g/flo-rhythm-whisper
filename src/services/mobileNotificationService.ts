import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { addDays, getDaysBetween } from '../utils/dateUtils';

interface NotificationSettings {
  enabled: boolean;
  daysBefore: number;
  snoozeDuration: number; // in hours
}

interface SnoozedNotification {
  type: string;
  snoozeUntil: string;
}

interface PermissionStatus {
  display: 'granted' | 'denied' | 'prompt';
}

export class MobileNotificationService {
  private static instance: MobileNotificationService;
  private settings: NotificationSettings = {
    enabled: false,
    daysBefore: 5,
    snoozeDuration: 24
  };
  
  private constructor() {
    this.loadSettings();
    this.initializeCapacitor();
  }
  
  static getInstance(): MobileNotificationService {
    if (!MobileNotificationService.instance) {
      MobileNotificationService.instance = new MobileNotificationService();
    }
    return MobileNotificationService.instance;
  }

  private async initializeCapacitor() {
    console.log('[NotificationService] Initializing...');
    console.log('[NotificationService] Is native platform:', Capacitor.isNativePlatform());
    console.log('[NotificationService] Platform:', Capacitor.getPlatform());
    
    if (Capacitor.isNativePlatform()) {
      try {
        // Check current permission status first
        const currentStatus = await LocalNotifications.checkPermissions();
        console.log('[NotificationService] Current mobile permissions:', currentStatus);
        
        // Only request if not already granted
        if (currentStatus.display !== 'granted') {
          const permission = await LocalNotifications.requestPermissions();
          console.log('[NotificationService] Mobile permission request result:', permission);
        }
      } catch (error) {
        console.error('[NotificationService] Error with mobile notifications:', error);
      }
    } else {
      // Browser environment
      console.log('[NotificationService] Browser notification support:', 'Notification' in window);
      if ('Notification' in window) {
        console.log('[NotificationService] Current browser permission:', Notification.permission);
      }
    }
  }

  private loadSettings() {
    try {
      const stored = localStorage.getItem('notification-settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
        console.log('[NotificationService] Loaded settings:', this.settings);
      }
    } catch (error) {
      console.error('[NotificationService] Error loading settings:', error);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.settings));
      console.log('[NotificationService] Settings saved:', this.settings);
    } catch (error) {
      console.error('[NotificationService] Error saving settings:', error);
    }
  }

  async requestPermission(): Promise<boolean> {
    console.log('[NotificationService] Requesting permission...');
    
    if (Capacitor.isNativePlatform()) {
      try {
        // Check current status first
        const currentStatus = await LocalNotifications.checkPermissions();
        console.log('[NotificationService] Current mobile status:', currentStatus);
        
        if (currentStatus.display === 'granted') {
          console.log('[NotificationService] Mobile permission already granted');
          return true;
        }
        
        if (currentStatus.display === 'denied') {
          console.log('[NotificationService] Mobile permission denied');
          return false;
        }
        
        // Request permission
        const permission = await LocalNotifications.requestPermissions();
        console.log('[NotificationService] Mobile permission result:', permission);
        
        const granted = permission.display === 'granted';
        console.log('[NotificationService] Mobile permission granted:', granted);
        return granted;
      } catch (error) {
        console.error('[NotificationService] Error requesting mobile permission:', error);
        return false;
      }
    } else {
      // Browser notification logic
      if (!('Notification' in window)) {
        console.log('[NotificationService] Browser does not support notifications');
        return false;
      }

      console.log('[NotificationService] Current browser permission:', Notification.permission);

      if (Notification.permission === 'granted') {
        console.log('[NotificationService] Browser permission already granted');
        return true;
      }

      if (Notification.permission === 'denied') {
        console.log('[NotificationService] Browser permission denied');
        return false;
      }

      try {
        const permission = await Notification.requestPermission();
        console.log('[NotificationService] Browser permission result:', permission);
        const granted = permission === 'granted';
        console.log('[NotificationService] Browser permission granted:', granted);
        return granted;
      } catch (error) {
        console.error('[NotificationService] Error requesting browser permission:', error);
        return false;
      }
    }
  }

  async checkPermissionStatus(): Promise<{ hasPermission: boolean; canRequest: boolean; platform: string }> {
    const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web';
    console.log('[NotificationService] Checking permission status for platform:', platform);
    
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.checkPermissions();
        console.log('[NotificationService] Mobile permission status:', status);
        
        return {
          hasPermission: status.display === 'granted',
          canRequest: status.display === 'prompt',
          platform
        };
      } catch (error) {
        console.error('[NotificationService] Error checking mobile permissions:', error);
        return { hasPermission: false, canRequest: false, platform };
      }
    } else {
      if (!('Notification' in window)) {
        console.log('[NotificationService] Browser does not support notifications');
        return { hasPermission: false, canRequest: false, platform };
      }
      
      const permission = Notification.permission;
      console.log('[NotificationService] Browser permission status:', permission);
      
      return {
        hasPermission: permission === 'granted',
        canRequest: permission === 'default',
        platform
      };
    }
  }

  enableNotifications(daysBefore: number = 5): boolean {
    console.log('[NotificationService] Enabling notifications with daysBefore:', daysBefore);
    this.settings.enabled = true;
    this.settings.daysBefore = daysBefore;
    this.saveSettings();
    return true;
  }

  disableNotifications(): void {
    console.log('[NotificationService] Disabling notifications');
    this.settings.enabled = false;
    this.saveSettings();
    
    // Cancel all scheduled notifications
    if (Capacitor.isNativePlatform()) {
      try {
        LocalNotifications.cancel({ notifications: [
          { id: 1 },
          { id: 2 },
          { id: 3 }
        ]});
        console.log('[NotificationService] Cancelled mobile notifications');
      } catch (error) {
        console.error('[NotificationService] Error cancelling mobile notifications:', error);
      }
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    console.log('[NotificationService] Updating settings:', newSettings);
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  private isNotificationSnoozed(type: string): boolean {
    try {
      const snoozed = localStorage.getItem('snoozed-notifications');
      if (!snoozed) return false;
      
      const snoozedData: SnoozedNotification[] = JSON.parse(snoozed);
      const notification = snoozedData.find(n => n.type === type);
      
      if (!notification) return false;
      
      const snoozeUntil = new Date(notification.snoozeUntil);
      const now = new Date();
      
      if (now > snoozeUntil) {
        // Snooze period expired, remove it
        this.removeSnoozedNotification(type);
        return false;
      }
      
      console.log('[NotificationService] Notification snoozed:', type, 'until', snoozeUntil);
      return true;
    } catch (error) {
      console.error('[NotificationService] Error checking snooze status:', error);
      return false;
    }
  }

  private addSnoozedNotification(type: string): void {
    try {
      const snoozed = localStorage.getItem('snoozed-notifications');
      let snoozedData: SnoozedNotification[] = [];
      
      if (snoozed) {
        try {
          snoozedData = JSON.parse(snoozed);
        } catch {
          snoozedData = [];
        }
      }
      
      const snoozeUntil = new Date();
      snoozeUntil.setHours(snoozeUntil.getHours() + this.settings.snoozeDuration);
      
      // Remove existing snooze for this type
      snoozedData = snoozedData.filter(n => n.type !== type);
      
      // Add new snooze
      snoozedData.push({
        type,
        snoozeUntil: snoozeUntil.toISOString()
      });
      
      localStorage.setItem('snoozed-notifications', JSON.stringify(snoozedData));
      console.log('[NotificationService] Added snooze for:', type, 'until', snoozeUntil);
    } catch (error) {
      console.error('[NotificationService] Error adding snooze:', error);
    }
  }

  private removeSnoozedNotification(type: string): void {
    try {
      const snoozed = localStorage.getItem('snoozed-notifications');
      if (!snoozed) return;
      
      let snoozedData: SnoozedNotification[] = JSON.parse(snoozed);
      snoozedData = snoozedData.filter(n => n.type !== type);
      localStorage.setItem('snoozed-notifications', JSON.stringify(snoozedData));
      console.log('[NotificationService] Removed snooze for:', type);
    } catch (error) {
      console.error('[NotificationService] Error removing snooze:', error);
    }
  }

  private async sendMobileNotification(id: number, title: string, body: string, schedule?: Date): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      console.log('[NotificationService] Scheduling mobile notification:', { id, title, body, schedule });
      
      const options: ScheduleOptions = {
        notifications: [{
          id: id,
          title,
          body,
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#EC4899',
          schedule: schedule ? { at: schedule } : undefined,
        }]
      };

      await LocalNotifications.schedule(options);
      console.log('[NotificationService] Mobile notification scheduled successfully');
    } catch (error) {
      console.error('[NotificationService] Error scheduling mobile notification:', error);
    }
  }

  private sendBrowserNotification(title: string, options?: NotificationOptions & { canSnooze?: boolean }): void {
    if (Capacitor.isNativePlatform()) return;
    
    console.log('[NotificationService] Sending browser notification:', { title, options });
    
    if (!this.settings.enabled) {
      console.log('[NotificationService] Notifications disabled in settings');
      return;
    }
    
    if (Notification.permission !== 'granted') {
      console.log('[NotificationService] Browser permission not granted:', Notification.permission);
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        ...options
      });

      // Add click handler for snoozing
      if (options?.canSnooze) {
        notification.onclick = () => {
          this.snoozeNotification(options.tag || 'period-reminder');
          notification.close();
        };
      }
      
      console.log('[NotificationService] Browser notification sent successfully');
    } catch (error) {
      console.error('[NotificationService] Error sending browser notification:', error);
    }
  }

  async sendNotification(title: string, body: string, options?: { canSnooze?: boolean; tag?: string; schedule?: Date; id?: number }): Promise<void> {
    console.log('[NotificationService] Sending notification:', { title, body, options });
    
    if (!this.settings.enabled) {
      console.log('[NotificationService] Notifications disabled in settings');
      return;
    }

    // Check permission status first
    const permissionStatus = await this.checkPermissionStatus();
    console.log('[NotificationService] Permission status:', permissionStatus);
    
    if (!permissionStatus.hasPermission) {
      console.log('[NotificationService] No permission to send notification');
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await this.sendMobileNotification(options?.id || Math.floor(Math.random() * 1000), title, body, options?.schedule);
    } else {
      this.sendBrowserNotification(title, {
        body,
        tag: options?.tag,
        canSnooze: options?.canSnooze
      });
    }
  }

  snoozeNotification(type: string): void {
    console.log('[NotificationService] Snoozing notification:', type);
    this.addSnoozedNotification(type);
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('notification-snoozed', { detail: { type } }));
  }

  async schedulePeriodicReminders(lastPeriodDate: string, cycleLength: number): Promise<void> {
    console.log('[NotificationService] Scheduling periodic reminders:', { lastPeriodDate, cycleLength });
    
    if (!this.settings.enabled) {
      console.log('[NotificationService] Notifications disabled, skipping scheduling');
      return;
    }

    const lastPeriod = new Date(lastPeriodDate);
    const nextPeriodDate = addDays(lastPeriod, cycleLength);
    
    console.log('[NotificationService] Next period date:', nextPeriodDate);
    
    // Schedule reminder N days before
    const reminderDate = addDays(nextPeriodDate, -this.settings.daysBefore);
    if (reminderDate > new Date()) {
      await this.sendNotification(
        `Period Reminder 🌸`,
        `Your period is expected to start in ${this.settings.daysBefore} days. Don't forget to prepare!`,
        {
          tag: `period-reminder-${this.settings.daysBefore}days`,
          canSnooze: true,
          schedule: reminderDate,
          id: 1
        }
      );
    }

    // Schedule reminder 1 day before
    const oneDayBefore = addDays(nextPeriodDate, -1);
    if (oneDayBefore > new Date()) {
      await this.sendNotification(
        'Period Tomorrow 🌸',
        'Your period is expected to start tomorrow. Make sure you\'re prepared!',
        {
          tag: 'period-reminder-1day',
          canSnooze: true,
          schedule: oneDayBefore,
          id: 2
        }
      );
    }

    // Schedule reminder on the day
    if (nextPeriodDate > new Date()) {
      await this.sendNotification(
        '🩸 Period Day is Here! 🌸',
        'Your period is expected to start today. Don\'t forget to log it and track your symptoms!',
        {
          tag: 'period-reminder-today',
          canSnooze: true,
          schedule: nextPeriodDate,
          id: 3
        }
      );
    }
  }

  checkPeriodReminder(lastPeriodDate: string, cycleLength: number): void {
    console.log('[NotificationService] Checking period reminder:', { lastPeriodDate, cycleLength });
    
    if (!this.settings.enabled) {
      console.log('[NotificationService] Notifications disabled, skipping check');
      return;
    }

    const today = new Date();
    const lastPeriod = new Date(lastPeriodDate);
    const nextPeriodDate = addDays(lastPeriod, cycleLength);
    
    const daysUntilPeriod = getDaysBetween(today, nextPeriodDate);
    console.log('[NotificationService] Days until period:', daysUntilPeriod);
    
    // Check if we should send reminder
    if (daysUntilPeriod === this.settings.daysBefore) {
      const notificationType = `period-reminder-${this.settings.daysBefore}days`;
      
      if (!this.isNotificationSnoozed(notificationType)) {
        this.sendNotification(
          `Period Reminder 🌸`,
          `Your period is expected to start in ${this.settings.daysBefore} days. Don't forget to prepare!`,
          {
            tag: notificationType,
            canSnooze: true
          }
        );
      }
    }
    
    // Check if period is tomorrow
    if (daysUntilPeriod === 1) {
      const notificationType = 'period-reminder-1day';
      
      if (!this.isNotificationSnoozed(notificationType)) {
        this.sendNotification(
          'Period Tomorrow 🌸',
          'Your period is expected to start tomorrow. Make sure you\'re prepared!',
          {
            tag: notificationType,
            canSnooze: true
          }
        );
      }
    }
    
    // Check if period is today
    if (daysUntilPeriod === 0) {
      const notificationType = 'period-reminder-today';
      
      if (!this.isNotificationSnoozed(notificationType)) {
        this.sendNotification(
          '🩸 Period Day is Here! 🌸',
          'Your period is expected to start today. Don\'t forget to log it and track your symptoms!',
          {
            tag: notificationType,
            canSnooze: true
          }
        );
      }
    }
  }

  // Auto-calculate missed periods and adjust dates
  autoCalculateMissedPeriods(lastPeriodDate: string, cycleLength: number): { shouldUpdate: boolean; newDate: string } {
    const today = new Date();
    const lastPeriod = new Date(lastPeriodDate);
    const daysSinceLastPeriod = getDaysBetween(lastPeriod, today);
    
    // If more than 1.5 cycles have passed without logging, auto-calculate
    const threshold = Math.floor(cycleLength * 1.5);
    
    console.log('[NotificationService] Auto-calc check:', { daysSinceLastPeriod, threshold });
    
    if (daysSinceLastPeriod > threshold) {
      // Calculate how many cycles have likely passed
      const missedCycles = Math.floor(daysSinceLastPeriod / cycleLength);
      
      if (missedCycles > 0) {
        // Calculate the most recent period start date
        const newPeriodDate = addDays(lastPeriod, missedCycles * cycleLength);
        
        console.log('[NotificationService] Auto-calculated new period date:', newPeriodDate);
        
        return {
          shouldUpdate: true,
          newDate: newPeriodDate.toISOString().split('T')[0]
        };
      }
    }
    
    return { shouldUpdate: false, newDate: lastPeriodDate };
  }

  async schedulePeriodicCheck(lastPeriodDate: string, cycleLength: number): Promise<void> {
    console.log('[NotificationService] Starting periodic check setup');
    
    // Check for auto-calculation first
    const autoCalc = this.autoCalculateMissedPeriods(lastPeriodDate, cycleLength);
    let effectiveLastPeriodDate = autoCalc.shouldUpdate ? autoCalc.newDate : lastPeriodDate;
    
    // Dispatch event if auto-calculation suggests an update
    if (autoCalc.shouldUpdate) {
      console.log('[NotificationService] Dispatching auto-calculation event');
      window.dispatchEvent(new CustomEvent('period-auto-calculated', { 
        detail: { newDate: autoCalc.newDate, originalDate: lastPeriodDate }
      }));
    }
    
    // Check immediately
    this.checkPeriodReminder(effectiveLastPeriodDate, cycleLength);
    
    // Schedule future notifications
    await this.schedulePeriodicReminders(effectiveLastPeriodDate, cycleLength);
  }
}
