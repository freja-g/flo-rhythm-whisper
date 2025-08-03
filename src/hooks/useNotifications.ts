import { useEffect, useState } from 'react';
import { MobileNotificationService } from '../services/mobileNotificationService';
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
  const notificationService = MobileNotificationService.getInstance();

  const debugNotifications = async () => {
    console.log('=== NOTIFICATION DEBUG START ===');
    
    // Check what platform we're on
    console.log('User agent:', navigator.userAgent);
    console.log('Is mobile:', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    // Check browser support
    console.log('Notification in window:', 'Notification' in window);
    if ('Notification' in window) {
      console.log('Current permission:', Notification.permission);
    }
    
    // Check service settings
    const settings = notificationService.getSettings();
    console.log('Service enabled:', settings.enabled);
    console.log('Days before:', settings.daysBefore);
    
    console.log('=== NOTIFICATION DEBUG END ===');
  };
  useEffect(() => {
    // Check current permission status
    const checkPermission = async () => {
      const settings = notificationService.getSettings();
      const hasPermission = await notificationService.requestPermission();
      setNotificationsEnabled(hasPermission && settings.enabled);
    };
    checkPermission();
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
        await notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
      }
      
      toast({
        title: "Notifications Enabled",
        description: `You'll receive period reminders ${daysBefore} days before your expected date.`,
      });
    } else {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your device settings to receive period reminders.",
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
  
  const updateSettings = async (settings: any) => {
    notificationService.updateSettings(settings);
    if (settings.enabled !== undefined) {
      const hasPermission = await notificationService.requestPermission();
      setNotificationsEnabled(settings.enabled && hasPermission);
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
    updateSettings,
    debugNotifications
  };
};
