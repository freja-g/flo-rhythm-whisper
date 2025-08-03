
import React, { createContext, useContext, ReactNode } from 'react';
import { Symptom, ChatMessage, Cycle } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AppContextType {
  symptoms: Symptom[];
  setSymptoms: (symptoms: Symptom[]) => void;
  cycles: Cycle[];
  setCycles: (cycles: Cycle[]) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
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
  const [symptoms, setSymptoms] = useLocalStorage<Symptom[]>('symptoms', []);
  const [cycles, setCycles] = useLocalStorage<Cycle[]>('cycles', []);
  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('chatMessages', []);
  const [currentScreen, setCurrentScreen] = useLocalStorage<string>('currentScreen', 'splash');

  // Listen for screen change events from notifications
  React.useEffect(() => {
    const handleScreenChange = (event: CustomEvent) => {
      const { screen } = event.detail;
      setCurrentScreen(screen);
    };

    window.addEventListener('change-screen', handleScreenChange);
    return () => window.removeEventListener('change-screen', handleScreenChange);
  }, [setCurrentScreen]);

  return (
    <AppContext.Provider value={{
      symptoms,
      setSymptoms,
      cycles,
      setCycles,
      chatMessages,
      setChatMessages,
      currentScreen,
      setCurrentScreen
    }}>
      {children}
    </AppContext.Provider>
  );
};
