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

export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    enabled: false,
    daysBefore: 5,
    snoozeDuration: 24
  };
  
  private constructor() {
    this.loadSettings();
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

  async requestPermission(): Promise<boolean> {
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

  sendNotification(title: string, options?: NotificationOptions & { canSnooze?: boolean }): void {
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

  snoozeNotification(type: string): void {
    this.addSnoozedNotification(type);
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('notification-snoozed', { detail: { type } }));
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
        this.sendNotification(`Period Reminder 🌸`, {
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
        this.sendNotification('Period Tomorrow 🌸', {
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
        this.sendNotification('Period Started 🌸', {
          body: 'Your period is expected to start today. Track your cycle in the app!',
          tag: notificationType,
          canSnooze: true
        });
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

  schedulePeriodicCheck(lastPeriodDate: string, cycleLength: number): void {
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
      setInterval(() => {
        const latestAutoCalc = this.autoCalculateMissedPeriods(effectiveLastPeriodDate, cycleLength);
        if (latestAutoCalc.shouldUpdate) {
          effectiveLastPeriodDate = latestAutoCalc.newDate;
          window.dispatchEvent(new CustomEvent('period-auto-calculated', { 
            detail: { newDate: latestAutoCalc.newDate, originalDate: effectiveLastPeriodDate }
          }));
        }
        this.checkPeriodReminder(effectiveLastPeriodDate, cycleLength);
      }, 24 * 60 * 60 * 1000);
    }, timeUntil9AM);
  }
}