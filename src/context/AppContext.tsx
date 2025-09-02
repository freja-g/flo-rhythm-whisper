import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { Symptom, ChatMessage, Cycle } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AppContextType {
  symptoms: Symptom[];
  setSymptoms: (symptoms: Symptom[]) => void;
  cycles: Cycle[];
  setCycles: (cycles: Cycle[]) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useLocalStorage<Symptom[]>('symptoms', []);
  const [cycles, setCycles] = useLocalStorage<Cycle[]>('cycles', []);
  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('chatMessages', []);
  const [currentScreen, setCurrentScreen] = useLocalStorage<string>('currentScreen', 'splash');
  const [loading, setLoading] = React.useState(false);
  const lastLoadedUserId = useRef<string | null>(null);

  const userId = user?.id;

  // Load data from database when user logs in
  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        // Clear data when user logs out
        setSymptoms([]);
        setCycles([]);
        setChatMessages([]);
        lastLoadedUserId.current = null;
        return;
      }

      // Prevent loading if we've already loaded data for this user
      if (lastLoadedUserId.current === userId) {
        return;
      }

      setLoading(true);
      try {
        // Load cycles from database
        const { data: cyclesData } = await supabase
          .from('cycles')
          .select('*')
          .eq('user_id', userId)
          .order('start_date', { ascending: false });

        if (cyclesData) {
          const formattedCycles: Cycle[] = cyclesData.map(cycle => ({
            id: cycle.id,
            startDate: cycle.start_date,
            length: cycle.cycle_length,
            periodLength: cycle.period_length,
            userId: cycle.user_id,
            createdAt: cycle.created_at || new Date().toISOString()
          }));
          setCycles(formattedCycles);
        }

        // Load symptoms from database
        const { data: symptomsData } = await supabase
          .from('symptoms')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (symptomsData) {
          const formattedSymptoms: Symptom[] = symptomsData.map(symptom => ({
            id: symptom.id,
            date: symptom.date,
            symptoms: symptom.symptoms || [],
            mood: symptom.mood || '',
            menstrualFlow: (symptom.menstrual_flow as 'light' | 'medium' | 'heavy' | 'none') || 'none',
            spotting: (symptom.spotting as 'none' | 'light' | 'heavy') || 'none',
            userId: symptom.user_id,
            createdAt: symptom.created_at || new Date().toISOString()
          }));
          setSymptoms(formattedSymptoms);
        }

        lastLoadedUserId.current = userId;
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  return (
    <AppContext.Provider value={{
      symptoms,
      setSymptoms,
      cycles,
      setCycles,
      chatMessages,
      setChatMessages,
      currentScreen,
      setCurrentScreen,
      loading
    }}>
      {children}
    </AppContext.Provider>
  );
};
