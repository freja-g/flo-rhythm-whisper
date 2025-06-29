
import { useState, useEffect } from 'react';
import { Network, PluginListenerHandle } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let networkListener: PluginListenerHandle;

    const setupNetworkListener = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);

      networkListener = await Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
      });
    };

    setupNetworkListener();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  const saveOfflineData = async (key: string, data: any) => {
    try {
      await Preferences.set({
        key: `offline_${key}`,
        value: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  };

  const getOfflineData = async (key: string) => {
    try {
      const result = await Preferences.get({ key: `offline_${key}` });
      return result.value ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  };

  const clearOfflineData = async (key: string) => {
    try {
      await Preferences.remove({ key: `offline_${key}` });
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
