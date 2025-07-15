import { Profile } from '../types';

export interface OfflineData {
  profiles: Profile[];
  symptoms: any[];
  cycles: any[];
  lastSync: string;
}

export class OfflineStorageService {
  private static instance: OfflineStorageService;
  private storageKey = 'flo-rhythm-offline-data';

  public static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  private getOfflineData(): OfflineData {
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      return JSON.parse(data);
    }
    return {
      profiles: [],
      symptoms: [],
      cycles: [],
      lastSync: new Date().toISOString()
    };
  }

  private saveOfflineData(data: OfflineData): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Profile methods
  saveProfile(profile: Profile): void {
    const data = this.getOfflineData();
    const existingIndex = data.profiles.findIndex(p => p.id === profile.id);
    
    if (existingIndex >= 0) {
      data.profiles[existingIndex] = profile;
    } else {
      data.profiles.push(profile);
    }
    
    this.saveOfflineData(data);
  }

  getProfile(userId: string): Profile | null {
    const data = this.getOfflineData();
    return data.profiles.find(p => p.id === userId) || null;
  }

  // Symptoms methods
  saveSymptom(symptom: any): void {
    const data = this.getOfflineData();
    const existingIndex = data.symptoms.findIndex(s => s.id === symptom.id);
    
    if (existingIndex >= 0) {
      data.symptoms[existingIndex] = symptom;
    } else {
      data.symptoms.push(symptom);
    }
    
    this.saveOfflineData(data);
  }

  getSymptoms(userId: string): any[] {
    const data = this.getOfflineData();
    return data.symptoms.filter(s => s.user_id === userId);
  }

  // Cycles methods
  saveCycle(cycle: any): void {
    const data = this.getOfflineData();
    const existingIndex = data.cycles.findIndex(c => c.id === cycle.id);
    
    if (existingIndex >= 0) {
      data.cycles[existingIndex] = cycle;
    } else {
      data.cycles.push(cycle);
    }
    
    this.saveOfflineData(data);
  }

  getCycles(userId: string): any[] {
    const data = this.getOfflineData();
    return data.cycles.filter(c => c.user_id === userId);
  }

  // Sync methods
  getAllPendingData(): OfflineData {
    return this.getOfflineData();
  }

  updateLastSync(): void {
    const data = this.getOfflineData();
    data.lastSync = new Date().toISOString();
    this.saveOfflineData(data);
  }

  clearOfflineData(): void {
    localStorage.removeItem(this.storageKey);
  }
}