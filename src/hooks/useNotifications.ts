import { useEffect, useState } from 'react';
import { NotificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { Capacitor } from '@capacitor/core';

export const useNotifications = (profile: Profile | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', message: '' });
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    notificationService.registerInAppNotificationCallback((title, options) => {
      showNotificationPopup(title, options?.body || '');
    });
    // No dependencies needed; register once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    // Check current permission status
    const checkPermissions = async () => {
      try {
        const hasPermission = await notificationService.checkPermissions();
        const settings = notificationService.getSettings();
        setNotificationsEnabled(hasPermission && settings.enabled);
      } catch (error) {
        console.error('Error checking notification permissions:', error);
        setNotificationsEnabled(false);
      }
    };

    checkPermissions();
  }, [notificationService]);

  useEffect(() => {
    // Set up period reminders when profile is available and notifications are enabled
    if (profile && notificationsEnabled && profile.last_period_date && profile.cycle_length) {
      notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
    }
  }, [profile, notificationsEnabled, profile?.last_period_date, profile?.cycle_length, notificationService]);

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
    try {
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        notificationService.enableNotifications(daysBefore);
        setNotificationsEnabled(true);
        
        if (profile && profile.last_period_date && profile.cycle_length) {
          await notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
        }
        
        const platform = Capacitor.isNativePlatform() ? 'mobile app' : 'browser';
        toast({
          title: "Notifications Enabled",
          description: `You'll receive period reminders ${daysBefore} days before your expected date in your ${platform}.`,
        });
      } else {
        const errorMessage = Capacitor.isNativePlatform() 
          ? "Please enable notifications in your device settings to receive period reminders."
          : "Please enable notifications in your browser settings to receive period reminders.";
          
        toast({
          title: "Notifications Blocked",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "There was an error enabling notifications. Please try again.",
        variant: "destructive",
      });
      return false;
    }
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
      const hasPermission = await notificationService.checkPermissions();
      setNotificationsEnabled(settings.enabled && hasPermission);
    }
  };

  // Get platform info for UI feedback
  const getPlatformInfo = () => {
    return {
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      displayName: Capacitor.isNativePlatform() ? 'mobile app' : 'browser'
    };
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
    platformInfo: getPlatformInfo()
  };
};import { useEffect, useState } from 'react';
import { NotificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { Capacitor } from '@capacitor/core';

export const useNotifications = (profile: Profile | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', message: '' });
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    notificationService.registerInAppNotificationCallback((title, options) => {
      showNotificationPopup(title, options?.body || '');
    });
    // No dependencies needed; register once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    // Check current permission status
    const checkPermissions = async () => {
      try {
        const hasPermission = await notificationService.checkPermissions();
        const settings = notificationService.getSettings();
        setNotificationsEnabled(hasPermission && settings.enabled);
      } catch (error) {
        console.error('Error checking notification permissions:', error);
        setNotificationsEnabled(false);
      }
    };

    checkPermissions();
  }, [notificationService]);

  useEffect(() => {
    // Set up period reminders when profile is available and notifications are enabled
    if (profile && notificationsEnabled && profile.last_period_date && profile.cycle_length) {
      notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
    }
  }, [profile, notificationsEnabled, profile?.last_period_date, profile?.cycle_length, notificationService]);

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
    try {
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        notificationService.enableNotifications(daysBefore);
        setNotificationsEnabled(true);
        
        if (profile && profile.last_period_date && profile.cycle_length) {
          await notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
        }
        
        const platform = Capacitor.isNativePlatform() ? 'mobile app' : 'browser';
        toast({
          title: "Notifications Enabled",
          description: `You'll receive period reminders ${daysBefore} days before your expected date in your ${platform}.`,
        });
      } else {
        const errorMessage = Capacitor.isNativePlatform() 
          ? "Please enable notifications in your device settings to receive period reminders."
          : "Please enable notifications in your browser settings to receive period reminders.";
          
        toast({
          title: "Notifications Blocked",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "There was an error enabling notifications. Please try again.",
        variant: "destructive",
      });
      return false;
    }
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
      const hasPermission = await notificationService.checkPermissions();
      setNotificationsEnabled(settings.enabled && hasPermission);
    }
  };

  // Get platform info for UI feedback
  const getPlatformInfo = () => {
    return {
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      displayName: Capacitor.isNativePlatform() ? 'mobile app' : 'browser'
    };
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
    platformInfo: getPlatformInfo()
  };
};
