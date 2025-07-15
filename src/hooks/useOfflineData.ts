import { useState, useEffect } from 'react';
import { OfflineStorageService } from '../services/offlineStorage';
import { SyncService } from '../services/syncService';
import { useOnlineStatus } from './useOnlineStatus';
import { useAuth } from '../context/AuthContext';

export const useOfflineData = () => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [offlineStorage] = useState(() => OfflineStorageService.getInstance());
  const [syncService] = useState(() => SyncService.getInstance());
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    if (user && isOnline) {
      // Perform sync when coming back online
      syncService.performFullSync(user.id).then(() => {
        setLastSync(new Date().toISOString());
      });
    }
  }, [user, isOnline, syncService]);

  const saveProfileOffline = (profile: any) => {
    offlineStorage.saveProfile(profile);
    if (user && isOnline) {
      syncService.syncToServer(user.id);
    }
  };

  const getProfileOffline = (userId: string) => {
    return offlineStorage.getProfile(userId);
  };

  const saveSymptomOffline = (symptom: any) => {
    offlineStorage.saveSymptom(symptom);
    if (user && isOnline) {
      syncService.syncToServer(user.id);
    }
  };

  const getSymptomsOffline = (userId: string) => {
    return offlineStorage.getSymptoms(userId);
  };

  const saveCycleOffline = (cycle: any) => {
    offlineStorage.saveCycle(cycle);
    if (user && isOnline) {
      syncService.syncToServer(user.id);
    }
  };

  const getCyclesOffline = (userId: string) => {
    return offlineStorage.getCycles(userId);
  };

  const forceSync = async () => {
    if (user && isOnline) {
      await syncService.performFullSync(user.id);
      setLastSync(new Date().toISOString());
    }
  };

  return {
    isOnline,
    lastSync,
    saveProfileOffline,
    getProfileOffline,
    saveSymptomOffline,
    getSymptomsOffline,
    saveCycleOffline,
    getCyclesOffline,
    forceSync
  };
};