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

  useEffect(() => {
    // Check current permission status on component mount
    const checkPermission = async () => {
      const settings = notificationService.getSettings();
      const permission = await Notification.permission;
      
      // Set initial state based on permission and settings
      setNotificationsEnabled(permission === 'granted' && settings.enabled);
    };
    
    checkPermission();
  }, []);

  useEffect(() => {
    // Set up period reminders when profile is available and notifications are enabled
    if (profile && notificationsEnabled && profile.last_period_date && profile.cycle_length) {
      notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
    }
  }, [profile, notificationsEnabled]);

  const handleNotificationToggle = async (event: CustomEvent) => {
    event.preventDefault();
    
    // Check current permission status
    const currentPermission = Notification.permission;
    
    if (currentPermission === 'denied') {
      // Permission was denied, show instruction toast
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your device settings to receive period reminders.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentPermission === 'default') {
      // No permission yet, request it
      await requestNotificationPermission();
    } else if (currentPermission === 'granted') {
      // Permission already granted, just toggle the service
      await toggleNotificationService();
    }
  };

  const requestNotificationPermission = async () => {
    try {
      // Request permission from device
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        // Permission granted, enable notifications
        await enableNotifications();
      } else {
        // Permission denied
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your device settings to receive period reminders.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive",
      });
    }
  };

  const enableNotifications = async (daysBefore: number = 5): Promise<boolean> => {
    try {
      // Enable the notification service
      notificationService.enableNotifications(daysBefore);
      setNotificationsEnabled(true);

      // Schedule period check if profile data is available
      if (profile && profile.last_period_date && profile.cycle_length) {
        await notificationService.schedulePeriodicCheck(profile.last_period_date, profile.cycle_length);
      }

      toast({
        title: "Notifications Enabled",
        description: You'll receive period reminders ${daysBefore} days before your expected date.,
      });

      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleNotificationService = async () => {
    if (notificationsEnabled) {
      // Disable notifications
      notificationService.disableNotifications();
      setNotificationsEnabled(false);
      
      toast({
        title: "Notifications Disabled",
        description: "You won't receive period reminders anymore.",
      });
    } else {
      // Enable notifications (permission already granted)
      await enableNotifications();
    }
  };

  const disableNotifications = () => {
    notificationService.disableNotifications();
    setNotificationsEnabled(false);
    
    toast({
      title: "Notifications Disabled",
      description: "You won't receive period reminders anymore.",
    });
  };

  return {
    notificationsEnabled,
    showPopup,
    setShowPopup,
    popupData,
    setPopupData,
    handleNotificationToggle,
    enableNotifications,
    disableNotifications,
    requestNotificationPermission
  };
};
