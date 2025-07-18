export class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {}
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
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

  sendNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        ...options
      });
    }
  }

  checkPeriodReminder(lastPeriodDate: string, cycleLength: number): void {
    const today = new Date();
    const lastPeriod = new Date(lastPeriodDate);
    const nextPeriodDate = new Date(lastPeriod);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
    
    const daysUntilPeriod = Math.ceil((nextPeriodDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    // Check if period is approaching (2 days before)
    if (daysUntilPeriod === 2) {
      this.sendNotification('Period Reminder 🌸', {
        body: 'Your period is expected to start in 2 days. Don\'t forget to prepare!',
        tag: 'period-reminder-2days'
      });
    }
    
    // Check if period is tomorrow
    if (daysUntilPeriod === 1) {
      this.sendNotification('Period Tomorrow 🌸', {
        body: 'Your period is expected to start tomorrow. Make sure you\'re prepared!',
        tag: 'period-reminder-1day'
      });
    }
    
    // Check if period is today
    if (daysUntilPeriod === 0) {
      this.sendNotification('Period Started 🌸', {
        body: 'Your period is expected to start today. Track your cycle in the app!',
        tag: 'period-reminder-today'
      });
    }
  }

  schedulePeriodicCheck(lastPeriodDate: string, cycleLength: number): void {
    // Check immediately
    this.checkPeriodReminder(lastPeriodDate, cycleLength);
    
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
      this.checkPeriodReminder(lastPeriodDate, cycleLength);
      // Then check every 24 hours
      setInterval(() => {
        this.checkPeriodReminder(lastPeriodDate, cycleLength);
      }, 24 * 60 * 60 * 1000);
    }, timeUntil9AM);
  }
}