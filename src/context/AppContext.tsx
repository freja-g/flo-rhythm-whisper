
import React, { createContext, useContext, ReactNode } from 'react';
import { User, Symptom, ChatMessage } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  symptoms: Symptom[];
  setSymptoms: (symptoms: Symptom[]) => void;
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
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  const [symptoms, setSymptoms] = useLocalStorage<Symptom[]>('symptoms', []);
  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('chatMessages', []);
  const [currentScreen, setCurrentScreen] = useLocalStorage<string>('currentScreen', 'splash');

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      symptoms,
      setSymptoms,
      chatMessages,
      setChatMessages,
      currentScreen,
      setCurrentScreen
    }}>
      {children}
    </AppContext.Provider>
  );
};
