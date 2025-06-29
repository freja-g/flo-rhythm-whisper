
import { useState, useEffect } from 'react';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineData = async (key: string, data: any) => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const getOfflineData = async (key: string) => {
    try {
      const data = localStorage.getItem(`offline_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  };

  const clearOfflineData = async (key: string) => {
    try {
      localStorage.removeItem(`offline_${key}`);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  };

  return {
    isOnline,
    saveOfflineData,
    getOfflineData,
    clearOfflineData
  };
};
