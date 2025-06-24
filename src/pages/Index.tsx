
import React from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import SplashScreen from '../components/SplashScreen';
import SignUpScreen from '../components/SignUpScreen';
import CycleSetupScreen from '../components/CycleSetupScreen';
import DashboardScreen from '../components/DashboardScreen';
import LogScreen from '../components/LogScreen';
import TipsScreen from '../components/TipsScreen';
import ChatScreen from '../components/ChatScreen';
import ProfileScreen from '../components/ProfileScreen';

const AppContent: React.FC = () => {
  const { currentScreen } = useApp();

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
