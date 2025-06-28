
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { User, Symptom, ChatMessage } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  symptoms: Symptom[];
  setSymptoms: (symptoms: Symptom[]) => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentScreen, setCurrentScreen] = useState<string>('splash');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          if (profile) {
            const userData: User = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              periodLength: profile.period_length || 5,
              cycleLength: profile.cycle_length || 28,
              lastPeriodDate: profile.last_period_date || '',
              createdAt: profile.created_at
            };
            setUser(userData);
            if (profile.period_length && profile.cycle_length) {
              setCurrentScreen('dashboard');
            } else {
              setCurrentScreen('cycleSetup');
            }
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setCurrentScreen('splash');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      symptoms,
      setSymptoms,
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
