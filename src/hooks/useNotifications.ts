import { useEffect, useState } from 'react';
import { NotificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';

export const useNotifications = (profile: Profile | null) => {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    // Set up period reminders when profile is available and notifications are enabled
    if (profile && notificationsEnabled && profile.last_period_date && profile.cycle_length) {
      notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
    }
  }, [profile, notificationsEnabled]);

  const enableNotifications = async (): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    setNotificationsEnabled(granted);
    
    if (granted && profile && profile.last_period_date && profile.cycle_length) {
      notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
    }
    
    return granted;
  };

  return {
    notificationsEnabled,
    enableNotifications
  };
};