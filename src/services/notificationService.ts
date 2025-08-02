import { addDays, getDaysBetween } from '../utils/dateUtils';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

interface NotificationSettings {
  enabled: boolean;
  daysBefore: number;
  snoozeDuration: number; // in hours
}

interface SnoozedNotification {
  type: string;
  snoozeUntil: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    enabled: false,
    daysBefore: 5,
    snoozeDuration: 24
  };
  
  private constructor() {
    this.loadSettings();
    this.initializeCapacitorNotifications();
  }
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private loadSettings() {
    const stored = localStorage.getItem('notification-settings');
    if (stored) {
      this.settings = { ...this.settings, ...JSON.parse(stored) };
    }
  }

  private saveSettings() {
    localStorage.setItem('notification-settings', JSON.stringify(this.settings));
  }

  private async initializeCapacitorNotifications() {
    if (Capacitor.isNativePlatform()) {
      try {
        // Initialize local notifications for Capacitor
        await LocalNotifications.requestPermissions();
        
        // Listen for notification clicks
        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('Notification clicked:', notification);
          // Handle notification click (e.g., open app, navigate to specific screen)
        });
      } catch (error) {
        console.error('Error initializing Capacitor notifications:', error);
      }
    }
  }

  private inAppNotificationCallback: ((title: string, options?: NotificationOptions & { canSnooze?: boolean }) => void) | null = null;

  registerInAppNotificationCallback(
    callback: (title: string, options?: NotificationOptions & { canSnooze?: boolean }) => void
  ) {
    this.inAppNotificationCallback = callback;
  }

  async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } catch (error) {
        console.error('Error requesting Capacitor notification permissions:', error);
        return false;
      }
    } else {
      // Web browser fallback
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }

  async checkPermissions(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await LocalNotifications.checkPermissions();
        return result.display === 'granted';
      } catch (error) {
        console.error('Error checking Capacitor notification permissions:', error);
        return false;
      }
    } else {
      return Notification.permission === 'granted';
    }
  }

  enableNotifications(daysBefore: number = 5): boolean {
    this.settings.enabled = true;
    this.settings.daysBefore = daysBefore;
    this.saveSettings();
    return true;
  }

  disableNotifications(): void {
    this.settings.enabled = false;
    this.saveSettings();
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  private isNotificationSnoozed(type: string): boolean {
    const snoozed = localStorage.getItem('snoozed-notifications');
    if (!snoozed) return false;
    
    try {
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
      
      return true;
    } catch {
      return false;
    }
  }

  private addSnoozedNotification(type: string): void {
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
  }

  private removeSnoozedNotification(type: string): void {
    const snoozed = localStorage.getItem('snoozed-notifications');
    if (!snoozed) return;
    
    try {
      let snoozedData: SnoozedNotification[] = JSON.parse(snoozed);
      snoozedData = snoozedData.filter(n => n.type !== type);
      localStorage.setItem('snoozed-notifications', JSON.stringify(snoozedData));
    } catch {
      // Handle parsing error
    }
  }

  async sendNotification(title: string, options?: NotificationOptions & { canSnooze?: boolean }): Promise<void> {
    if (!this.settings.enabled) return;

    const hasPermission = await this.checkPermissions();
    
    if (Capacitor.isNativePlatform() && hasPermission) {
      try {
        // Use Capacitor Local Notifications for native apps
        const notificationOptions: ScheduleOptions = {
          notifications: [{
            title,
            body: options?.body || '',
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 1000) }, // Schedule immediately
            sound: 'default',
            attachments: options?.icon ? [{ id: 'icon', url: options.icon }] : undefined,
            actionTypeId: options?.canSnooze ? 'snooze' : 'dismiss',
            extra: {
              type: options?.tag || 'general',
              canSnooze: options?.canSnooze || false
            }
          }]
        };

        await LocalNotifications.schedule(notificationOptions);
        console.log('Capacitor notification sent:', title);
      } catch (error) {
        console.error('Error sending Capacitor notification:', error);
        // Fallback to in-app notification
        if (this.inAppNotificationCallback) {
          this.inAppNotificationCallback(title, options);
        }
      }
    } else if (!Capacitor.isNativePlatform() && hasPermission) {
      // Use Web Notifications API for browser
      try {
        const notification = new Notification(title, {
          icon: '/favicon.png',
          badge: '/favicon.png',
          ...options
        });

        if (options?.canSnooze) {
          notification.onclick = () => {
            this.snoozeNotification(options.tag || 'period-reminder');
            notification.close();
          };
        }
      } catch (error) {
        console.error('Error sending web notification:', error);
        // Fallback to in-app notification
        if (this.inAppNotificationCallback) {
          this.inAppNotificationCallback(title, options);
        }
      }
    } else {
      // Fallback to in-app notification when no permission or unsupported
      if (this.inAppNotificationCallback) {
        this.inAppNotificationCallback(title, options);
      }
    }
  }

  snoozeNotification(type: string): void {
    this.addSnoozedNotification(type);
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('notification-snoozed', { detail: { type } }));
  }

  async checkPeriodReminder(lastPeriodDate: string, cycleLength: number): Promise<void> {
    if (!this.settings.enabled) return;

    const today = new Date();
    const lastPeriod = new Date(lastPeriodDate);
    const nextPeriodDate = addDays(lastPeriod, cycleLength);
    
    const daysUntilPeriod = getDaysBetween(today, nextPeriodDate);
    
    // Check if we should send reminder
    if (daysUntilPeriod === this.settings.daysBefore) {
      const notificationType = `period-reminder-${this.settings.daysBefore}days`;
      
      if (!this.isNotificationSnoozed(notificationType)) {
        await this.sendNotification(`Period Reminder 🌸`, {
          body: `Your period is expected to start in ${this.settings.daysBefore} days. Don't forget to prepare!`,
          tag: notificationType,
          canSnooze: true
        });
      }
    }
    
    // Check if period is tomorrow
    if (daysUntilPeriod === 1) {
      const notificationType = 'period-reminder-1day';
      
      if (!this.isNotificationSnoozed(notificationType)) {
        await this.sendNotification('Period Tomorrow 🌸', {
          body: 'Your period is expected to start tomorrow. Make sure you\'re prepared!',
          tag: notificationType,
          canSnooze: true
        });
      }
    }
    
    // Check if period is today
    if (daysUntilPeriod === 0) {
      const notificationType = 'period-reminder-today';
      
      if (!this.isNotificationSnoozed(notificationType)) {
        await this.sendNotification('🩸 Period Day is Here! 🌸', {
          body: 'Your period is expected to start today. Don\'t forget to log it and track your symptoms!',
          tag: notificationType,
          canSnooze: true,
          requireInteraction: true // Keep notification visible until user interacts
        });
      }
      
      // Send a follow-up reminder in the evening if not snoozed
      const eveningReminderType = 'period-reminder-today-evening';
      const now = new Date();
      
      if (now.getHours() >= 18 && !this.isNotificationSnoozed(eveningReminderType)) {
        setTimeout(async () => {
          if (!this.isNotificationSnoozed(eveningReminderType)) {
            await this.sendNotification('Period Tracking Reminder 🌸', {
              body: 'Did you start your period today? Don\'t forget to log it in the app!',
              tag: eveningReminderType,
              canSnooze: true
            });
          }
        }, 2 * 60 * 60 * 1000); // 2 hours delay
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
    
    if (daysSinceLastPeriod > threshold) {
      // Calculate how many cycles have likely passed
      const missedCycles = Math.floor(daysSinceLastPeriod / cycleLength);
      
      if (missedCycles > 0) {
        // Calculate the most recent period start date
        const newPeriodDate = addDays(lastPeriod, missedCycles * cycleLength);
        
        return {
          shouldUpdate: true,
          newDate: newPeriodDate.toISOString().split('T')[0]
        };
      }
    }
    
    return { shouldUpdate: false, newDate: lastPeriodDate };
  }

  async schedulePeriodicCheck(lastPeriodDate: string, cycleLength: number): Promise<void> {
    // Check for auto-calculation first
    const autoCalc = this.autoCalculateMissedPeriods(lastPeriodDate, cycleLength);
    let effectiveLastPeriodDate = autoCalc.shouldUpdate ? autoCalc.newDate : lastPeriodDate;
    
    // Dispatch event if auto-calculation suggests an update
    if (autoCalc.shouldUpdate) {
      window.dispatchEvent(new CustomEvent('period-auto-calculated', { 
        detail: { newDate: autoCalc.newDate, originalDate: lastPeriodDate }
      }));
    }
    
    // Check immediately
    await this.checkPeriodReminder(effectiveLastPeriodDate, cycleLength);
    
    // Set up daily check at 9 AM
    const now = new Date();
    const next9AM = new Date();
    next9AM.setHours(9, 0, 0, 0);
    
    // If it's past 9 AM today, schedule for tomorrow
    if (now > next9AM) {
      next9AM.setDate(next9AM.getDate() + 1);
    }
    
    const timeUntil9AM = next9AM.getTime() - now.getTime();
    
    setTimeout(() => {
      this.checkPeriodReminder(effectiveLastPeriodDate, cycleLength);
      // Then check every 24 hours
      setInterval(async () => {
        const latestAutoCalc = this.autoCalculateMissedPeriods(effectiveLastPeriodDate, cycleLength);
        if (latestAutoCalc.shouldUpdate) {
          effectiveLastPeriodDate = latestAutoCalc.newDate;
          window.dispatchEvent(new CustomEvent('period-auto-calculated', { 
            detail: { newDate: latestAutoCalc.newDate, originalDate: effectiveLastPeriodDate }
          }));
        }
        await this.checkPeriodReminder(effectiveLastPeriodDate, cycleLength);
      }, 24 * 60 * 60 * 1000);
    }, timeUntil9AM);
  }
}
