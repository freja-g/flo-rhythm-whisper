import { useEffect, useState } from 'react';
import { NotificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useNotifications = (profile: Profile | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', message: '' });
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      const settings = notificationService.getSettings();
      setNotificationsEnabled(Notification.permission === 'granted' && settings.enabled);
    }
  }, []);

  useEffect(() => {
    // Set up period reminders when profile is available and notifications are enabled
    if (profile && notificationsEnabled && profile.last_period_date && profile.cycle_length) {
      notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
    }
  }, [profile, notificationsEnabled]);

  useEffect(() => {
    // Listen for auto-calculated period updates
    const handleAutoCalculation = async (event: CustomEvent) => {
      const { newDate, originalDate } = event.detail;
      
      if (user) {
        try {
          // Update the profile with the new calculated date
          const { error } = await supabase
            .from('profiles')
            .update({ last_period_date: newDate })
            .eq('id', user.id);
            
          if (!error) {
            toast({
              title: "Period Date Updated",
              description: `Auto-calculated your last period date to ${new Date(newDate).toLocaleDateString()} based on your cycle pattern.`,
            });
          }
        } catch (error) {
          console.error('Error updating auto-calculated period date:', error);
        }
      }
    };

    // Listen for notification snooze events
    const handleNotificationSnoozed = (event: CustomEvent) => {
      const { type } = event.detail;
      toast({
        title: "Notification Snoozed",
        description: "You'll be reminded again in 24 hours.",
      });
    };

    window.addEventListener('period-auto-calculated', handleAutoCalculation);
    window.addEventListener('notification-snoozed', handleNotificationSnoozed);

    return () => {
      window.removeEventListener('period-auto-calculated', handleAutoCalculation);
      window.removeEventListener('notification-snoozed', handleNotificationSnoozed);
    };
  }, [user, toast]);

  const enableNotifications = async (daysBefore: number = 5): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    
    if (granted) {
      notificationService.enableNotifications(daysBefore);
      setNotificationsEnabled(true);
      
      if (profile && profile.last_period_date && profile.cycle_length) {
        notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
      }
      
      toast({
        title: "Notifications Enabled",
        description: `You'll receive period reminders ${daysBefore} days before your expected date.`,
      });
    } else {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings to receive period reminders.",
        variant: "destructive",
      });
    }
    
    return granted;
  };

  const disableNotifications = (): void => {
    notificationService.disableNotifications();
    setNotificationsEnabled(false);
    toast({
      title: "Notifications Disabled",
      description: "You won't receive period reminders anymore.",
    });
  };

  const showNotificationPopup = (title: string, message: string): void => {
    setPopupData({ title, message });
    setShowPopup(true);
  };

  const snoozePopup = (): void => {
    notificationService.snoozeNotification('period-reminder');
    setShowPopup(false);
  };

  const dismissPopup = (): void => {
    setShowPopup(false);
  };

  const getSettings = () => notificationService.getSettings();
  
  const updateSettings = (settings: any) => {
    notificationService.updateSettings(settings);
    if (settings.enabled !== undefined) {
      setNotificationsEnabled(settings.enabled && Notification.permission === 'granted');
    }
  };

  return {
    notificationsEnabled,
    enableNotifications,
    disableNotifications,
    showPopup,
    popupData,
    showNotificationPopup,
    snoozePopup,
    dismissPopup,
    getSettings,
    updateSettings
  };
};