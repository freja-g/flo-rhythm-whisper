import { useEffect, useState } from 'react';
import { NotificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useNotifications = (profile: Profile | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState();
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', message: '' });
  const [notificationStats, setNotificationStats] = useState({ scheduled: 0, snoozed: 0, permission: 'default', enabled: false });
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      const settings = notificationService.getSettings();
      setNotificationsEnabled(Notification.permission === 'granted' && settings.enabled);
      setNotificationStats(notificationService.getNotificationStats());
    }
  }, []);

  useEffect(() => {
    // Update stats periodically
    const interval = setInterval(() => {
      setNotificationStats(notificationService.getNotificationStats());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Set up period reminders when profile is available and notifications are enabled
    if (profile && notificationsEnabled && profile.last_period_date && profile.cycle_length) {
      notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
    }
  }, [profile, notificationsEnabled, profile?.last_period_date, profile?.cycle_length]);

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
            
            // Trigger a refetch or update of the profile to sync across components
            window.dispatchEvent(new CustomEvent('profile-updated'));
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
      setNotificationStats(notificationService.getNotificationStats());
    };

    // Listen for navigation events from notifications
    const handleNavigateToScreen = (event: CustomEvent) => {
      const { screen } = event.detail;
      // This could be handled by the main app context
      window.dispatchEvent(new CustomEvent('change-screen', { detail: { screen } }));
    };

    window.addEventListener('period-auto-calculated', handleAutoCalculation);
    window.addEventListener('notification-snoozed', handleNotificationSnoozed);
    window.addEventListener('navigate-to-screen', handleNavigateToScreen);

    return () => {
      window.removeEventListener('period-auto-calculated', handleAutoCalculation);
      window.removeEventListener('notification-snoozed', handleNotificationSnoozed);
      window.removeEventListener('navigate-to-screen', handleNavigateToScreen);
    };
  }, [user, toast]);

  const enableNotifications = async (daysBefore: number = 5): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    
    if (granted) {
      notificationService.enableNotifications(daysBefore);
      setNotificationsEnabled(true);
      setNotificationStats(notificationService.getNotificationStats());
      
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
    setNotificationStats(notificationService.getNotificationStats());
    toast({
      title: "Notifications Disabled",
      description: "You won't receive period reminders anymore.",
    });
  };

  const sendTestNotification = (): boolean => {
    const success = notificationService.sendTestNotification();
    if (success) {
      toast({
        title: "Test Notification Sent",
        description: "Check if you received the test notification!",
      });
    } else {
      toast({
        title: "Test Failed",
        description: "Please enable notifications first.",
        variant: "destructive",
      });
    }
    return success;
  };

  const showNotificationPopup = (title: string, message: string): void => {
    setPopupData({ title, message });
    setShowPopup(true);
  };

  const snoozePopup = (): void => {
    notificationService.snoozeNotification('period-reminder');
    setShowPopup(false);
    setNotificationStats(notificationService.getNotificationStats());
  };

  const dismissPopup = (): void => {
    setShowPopup(false);
  };

  const getSettings = () => notificationService.getSettings();
  
  const updateSettings = (settings: any) => {
    notificationService.updateSettings(settings);
    setNotificationStats(notificationService.getNotificationStats());
    if (settings.enabled !== undefined) {
      setNotificationsEnabled(settings.enabled && Notification.permission === 'granted');
    }
  };

  return {
    notificationsEnabled,
    notificationStats,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    showPopup,
    popupData,
    showNotificationPopup,
    snoozePopup,
    dismissPopup,
    getSettings,
    updateSettings
  };
};