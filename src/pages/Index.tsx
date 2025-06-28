
import React from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import SplashScreen from '../components/SplashScreen';
import SignUpScreen from '../components/SignUpScreen';
import CycleSetupScreen from '../components/CycleSetupScreen';
import DashboardScreen from '../components/DashboardScreen';
import LogScreen from '../components/LogScreen';
import CyclesScreen from '../components/CyclesScreen';
import SymptomsScreen from '../components/SymptomsScreen';
import TipsScreen from '../components/TipsScreen';
import ChatScreen from '../components/ChatScreen';
import ProfileScreen from '../components/ProfileScreen';

const AppContent: React.FC = () => {
  const { currentScreen, loading } = useApp();

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FloMentor...</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'signup':
        return <SignUpScreen />;
      case 'cycleSetup':
        return <CycleSetupScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'log':
        return <LogScreen />;
      case 'cycles':
        return <CyclesScreen />;
      case 'symptoms':
        return <SymptomsScreen />;
      case 'tips':
        return <TipsScreen />;  
      case 'chat':
        return <ChatScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <SplashScreen />;
    }
  };

  return (
    <div className="w-full">
      {renderScreen()}
    </div>
  );
};

const Index = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
