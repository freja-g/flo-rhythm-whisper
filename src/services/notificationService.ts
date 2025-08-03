import { addDays, getDaysBetween } from '../utils/dateUtils';

interface NotificationSettings {
  enabled: boolean;
  daysBefore: number;
  snoozeDuration: number; // in hours
  reminderTime: string; // HH:MM format
  weeklyReminder: boolean;
  ovulationReminder: boolean;
}

interface SnoozedNotification {
  type: string;
  snoozeUntil: string;
}

interface ScheduledNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  scheduledFor: string;
  userId?: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private settings: NotificationSettings = {
    enabled: false,
    daysBefore: 5,
    snoozeDuration: 24,
    reminderTime: '09:00',
    weeklyReminder: true,
    ovulationReminder: false
  };
  
  private scheduledNotifications: ScheduledNotification[] = [];
  private checkInterval: number | null = null;
  
  private constructor() {
    this.loadSettings();
    this.loadScheduledNotifications();
    this.startPeriodicCheck();
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

  private loadScheduledNotifications() {
    const stored = localStorage.getItem('scheduled-notifications');
    if (stored) {
      try {
        this.scheduledNotifications = JSON.parse(stored);
      } catch {
        this.scheduledNotifications = [];
      }
    }
  }

  private saveScheduledNotifications() {
    localStorage.setItem('scheduled-notifications', JSON.stringify(this.scheduledNotifications));
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
    this.startPeriodicCheck();
    return true;
  }

  disableNotifications(): void {
    this.settings.enabled = false;
    this.saveSettings();
    this.stopPeriodicCheck();
    this.clearAllScheduledNotifications();
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    
    // Restart periodic check if settings changed
    if (this.settings.enabled) {
      this.stopPeriodicCheck();
      this.startPeriodicCheck();
    }
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

  sendNotification(title: string, options?: NotificationOptions & { canSnooze?: boolean }): Notification | null {
    if (!this.settings.enabled || Notification.permission !== 'granted') {
      return null;
    }

    const notification = new Notification(title, {
      icon: '/favicon.png',
      badge: '/favicon.png',
      requireInteraction: true,
      ...options
    });

    // Add click handler
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Navigate to relevant screen if needed
      if (options?.tag?.includes('period')) {
        window.dispatchEvent(new CustomEvent('navigate-to-screen', { detail: { screen: 'cycles' } }));
      }
    };

    // Auto-close after 10 seconds if not requiring interaction
    if (!options?.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    return notification;
  }

  snoozeNotification(type: string): void {
    this.addSnoozedNotification(type);
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('notification-snoozed', { detail: { type } }));
  }

  private scheduleNotification(notification: ScheduledNotification): void {
    // Remove existing notification of same type
    this.scheduledNotifications = this.scheduledNotifications.filter(n => n.type !== notification.type);
    
    // Add new notification
    this.scheduledNotifications.push(notification);
    this.saveScheduledNotifications();
  }

  private clearAllScheduledNotifications(): void {
    this.scheduledNotifications = [];
    this.saveScheduledNotifications();
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
          canSnooze: true,
          requireInteraction: true
        });
      }
    }
    
    // Check if period is today
    if (daysUntilPeriod === 0) {
      const notificationType = 'period-reminder-today';
      
      if (!this.isNotificationSnoozed(notificationType)) {
        this.sendNotification('🩸 Period Day is Here! 🌸', {
          body: 'Your period is expected to start today. Don\'t forget to log it and track your symptoms!',
          tag: notificationType,
          canSnooze: true,
          requireInteraction: true
        });
      }
    }

    // Check for ovulation reminder (if enabled)
    if (this.settings.ovulationReminder) {
      const ovulationDay = Math.floor(cycleLength / 2); // Approximate ovulation
      const daysSinceLastPeriod = getDaysBetween(lastPeriod, today);
      
      if (daysSinceLastPeriod === ovulationDay) {
        const notificationType = 'ovulation-reminder';
        
        if (!this.isNotificationSnoozed(notificationType)) {
          this.sendNotification('Ovulation Window 🥚', {
            body: 'You may be in your fertile window. Track your symptoms for better insights!',
            tag: notificationType,
            canSnooze: true
          });
        }
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

  private startPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every hour
    this.checkInterval = window.setInterval(() => {
      this.processScheduledNotifications();
    }, 60 * 60 * 1000);

    // Also check immediately
    this.processScheduledNotifications();
  }

  private stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private processScheduledNotifications(): void {
    const now = new Date();
    const [hours, minutes] = this.settings.reminderTime.split(':').map(Number);
    
    // Check if it's the right time for notifications
    if (now.getHours() === hours && now.getMinutes() >= minutes && now.getMinutes() < minutes + 60) {
      // Process any scheduled notifications for today
      const today = now.toISOString().split('T')[0];
      
      this.scheduledNotifications.forEach(notification => {
        const scheduledDate = new Date(notification.scheduledFor).toISOString().split('T')[0];
        
        if (scheduledDate === today && !this.isNotificationSnoozed(notification.type)) {
          this.sendNotification(notification.title, {
            body: notification.body,
            tag: notification.type,
            canSnooze: true
          });
        }
      });
    }
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
    
    // Schedule upcoming notifications
    this.scheduleUpcomingNotifications(effectiveLastPeriodDate, cycleLength);
    
    // Start the periodic check system
    this.startPeriodicCheck();
  }

  private scheduleUpcomingNotifications(lastPeriodDate: string, cycleLength: number): void {
    const lastPeriod = new Date(lastPeriodDate);
    const nextPeriodDate = addDays(lastPeriod, cycleLength);
    
    // Clear existing scheduled notifications
    this.clearAllScheduledNotifications();
    
    // Schedule period reminder
    const reminderDate = addDays(nextPeriodDate, -this.settings.daysBefore);
    this.scheduleNotification({
      id: `period-reminder-${this.settings.daysBefore}`,
      type: `period-reminder-${this.settings.daysBefore}days`,
      title: 'Period Reminder 🌸',
      body: `Your period is expected to start in ${this.settings.daysBefore} days. Don't forget to prepare!`,
      scheduledFor: reminderDate.toISOString()
    });
    
    // Schedule tomorrow reminder
    const tomorrowDate = addDays(nextPeriodDate, -1);
    this.scheduleNotification({
      id: 'period-reminder-tomorrow',
      type: 'period-reminder-1day',
      title: 'Period Tomorrow 🌸',
      body: 'Your period is expected to start tomorrow. Make sure you\'re prepared!',
      scheduledFor: tomorrowDate.toISOString()
    });
    
    // Schedule today reminder
    this.scheduleNotification({
      id: 'period-reminder-today',
      type: 'period-reminder-today',
      title: '🩸 Period Day is Here! 🌸',
      body: 'Your period is expected to start today. Don\'t forget to log it and track your symptoms!',
      scheduledFor: nextPeriodDate.toISOString()
    });

    // Schedule ovulation reminder if enabled
    if (this.settings.ovulationReminder) {
      const ovulationDate = addDays(lastPeriod, Math.floor(cycleLength / 2));
      if (ovulationDate > new Date()) {
        this.scheduleNotification({
          id: 'ovulation-reminder',
          type: 'ovulation-reminder',
          title: 'Ovulation Window 🥚',
          body: 'You may be in your fertile window. Track your symptoms for better insights!',
          scheduledFor: ovulationDate.toISOString()
        });
      }
    }

    // Schedule weekly reminder if enabled
    if (this.settings.weeklyReminder) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      this.scheduleNotification({
        id: 'weekly-reminder',
        type: 'weekly-reminder',
        title: 'Weekly Check-in 📝',
        body: 'Don\'t forget to log your symptoms and track your wellness this week!',
        scheduledFor: nextWeek.toISOString()
      });
    }
  }

  // Method to send test notification
  sendTestNotification(): boolean {
    if (Notification.permission !== 'granted') {
      return false;
    }

    this.sendNotification('Test Notification 🌸', {
      body: 'This is a test notification from FloMentor. Your notifications are working!',
      tag: 'test-notification'
    });

    return true;
  }

  // Get notification statistics
  getNotificationStats(): { 
    scheduled: number; 
    snoozed: number; 
    permission: string;
    enabled: boolean;
  } {
    const snoozed = localStorage.getItem('snoozed-notifications');
    let snoozedCount = 0;
    
    if (snoozed) {
      try {
        const snoozedData = JSON.parse(snoozed);
        snoozedCount = snoozedData.length;
      } catch {
        snoozedCount = 0;
      }
    }

    return {
      scheduled: this.scheduledNotifications.length,
      snoozed: snoozedCount,
      permission: Notification.permission,
      enabled: this.settings.enabled
    };
  }
}