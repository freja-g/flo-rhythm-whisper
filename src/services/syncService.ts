import { supabase } from '@/integrations/supabase/client';
import { OfflineStorageService } from './offlineStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export class SyncService {
  private static instance: SyncService;
  private offlineStorage: OfflineStorageService;
  private syncInProgress = false;

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  constructor() {
    this.offlineStorage = OfflineStorageService.getInstance();
  }

  async syncToServer(userId: string): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const offlineData = this.offlineStorage.getAllPendingData();
      
      // Sync profiles
      for (const profile of offlineData.profiles) {
        if (profile.id === userId) {
          await supabase
            .from('profiles')
            .upsert(profile);
        }
      }
      
      // Sync symptoms
      for (const symptom of offlineData.symptoms) {
        if (symptom.user_id === userId) {
          await supabase
            .from('symptoms')
            .upsert(symptom);
        }
      }
      
      // Sync cycles
      for (const cycle of offlineData.cycles) {
        if (cycle.user_id === userId) {
          await supabase
            .from('cycles')
            .upsert(cycle);
        }
      }
      
      this.offlineStorage.updateLastSync();
      console.log('Sync completed successfully');
      
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncFromServer(userId: string): Promise<void> {
    try {
      // Fetch latest data from server
      const [profileData, symptomsData, cyclesData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('symptoms').select('*').eq('user_id', userId),
        supabase.from('cycles').select('*').eq('user_id', userId)
      ]);

      // Update local storage
      if (profileData.data) {
        this.offlineStorage.saveProfile(profileData.data);
      }
      
      if (symptomsData.data) {
        symptomsData.data.forEach(symptom => {
          this.offlineStorage.saveSymptom(symptom);
        });
      }
      
      if (cyclesData.data) {
        cyclesData.data.forEach(cycle => {
          this.offlineStorage.saveCycle(cycle);
        });
      }
      
      this.offlineStorage.updateLastSync();
      console.log('Data fetched from server and stored locally');
      
    } catch (error) {
      console.error('Failed to sync from server:', error);
    }
  }

  async performFullSync(userId: string): Promise<void> {
    try {
      // First sync to server (upload local changes)
      await this.syncToServer(userId);
      
      // Then sync from server (download latest changes)
      await this.syncFromServer(userId);
      
    } catch (error) {
      console.error('Full sync failed:', error);
    }
  }
}