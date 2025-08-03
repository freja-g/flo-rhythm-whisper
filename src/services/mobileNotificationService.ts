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
    if (Capacitor.isNativePlatform()) {
      try {
        // Request permission for local notifications on mobile
        const permission = await LocalNotifications.requestPermissions();
        console.log('Local notification permission:', permission);
      } catch (error) {
        console.error('Error requesting local notification permissions:', error);
      }
    }
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

async requestPermission(): Promise<boolean> {
  const platform = Capacitor.getPlatform();
  console.log("Capacitor platform:", platform); // ✅ This line shows 'web', 'android', or 'ios'

  if (Capacitor.isNativePlatform()) {
    try {
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (err) {
      console.error("Native permission request failed:", err);
      return false;
    }
  } else if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
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
    
    // Cancel all scheduled notifications
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.cancel({ notifications: [
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ]});
    }
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

  private async sendMobileNotification(id: number, title: string, body: string, schedule?: Date): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
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
    } catch (error) {
      console.error('Error scheduling mobile notification:', error);
    }
  }

  private sendBrowserNotification(title: string, options?: NotificationOptions & { canSnooze?: boolean }): void {
    if (Capacitor.isNativePlatform()) return;
    
    if (!this.settings.enabled || Notification.permission !== 'granted') {
      return;
    }

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
  }

  async sendNotification(title: string, body: string, options?: { canSnooze?: boolean; tag?: string; schedule?: Date; id?: number }): Promise<void> {
    if (!this.settings.enabled) return;

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
    this.addSnoozedNotification(type);
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('notification-snoozed', { detail: { type } }));
  }

  async schedulePeriodicReminders(lastPeriodDate: string, cycleLength: number): Promise<void> {
    if (!this.settings.enabled) return;

    const lastPeriod = new Date(lastPeriodDate);
    const nextPeriodDate = addDays(lastPeriod, cycleLength);
    
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
    if (!this.settings.enabled) return;

    const today = new Date();
    const lastPeriod = new Date(lastPeriodDate);
    const nextPeriodDate = addDays(lastPeriod, cycleLength);
    
    const daysUntilPeriod = getDaysBetween(today, nextPeriodDate);
    
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
    this.checkPeriodReminder(effectiveLastPeriodDate, cycleLength);
    
    // Schedule future notifications
    await this.schedulePeriodicReminders(effectiveLastPeriodDate, cycleLength);
  }
}
