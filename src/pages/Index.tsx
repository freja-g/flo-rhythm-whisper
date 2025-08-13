import React from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useKeyboardVisibility } from '../hooks/useKeyboardVisibility';
import SplashScreen from '../components/SplashScreen';
import ProfileSetupScreen from '../components/ProfileSetupScreen';
import SignUpScreen from '../components/SignUpScreen';
import CycleSetupScreen from '../components/CycleSetupScreen';
import DashboardScreen from '../components/DashboardScreen';
import LogScreen from '../components/LogScreen';
import CyclesScreen from '../components/CyclesScreen';
import SymptomsScreen from '../components/SymptomsScreen';
import TipsScreen from '../components/TipsScreen';
import ChatScreen from '../components/ChatScreen';
import ProfileScreen from '../components/ProfileScreen';
import GoalsScreen from '../components/GoalsScreen';
import HealthReportsScreen from '../components/HealthReportsScreen';
import { FlowerLoading } from '../components/ui/flower-loading';

const AppContent: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useApp();
  const { user, loading } = useAuth();
  
  // Enable keyboard visibility handling for mobile devices
  useKeyboardVisibility({
    enabled: true,
    scrollOffset: 30
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <FlowerLoading size="lg" message="Preparing your wellness journey..." />
      </div>
    );
  }

  // If user is not authenticated, only show splash, signup, or login screens
  if (!user && currentScreen !== 'splash' && currentScreen !== 'signup' && currentScreen !== 'login') {
    return <SplashScreen />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'signup':
        return <SignUpScreen />;
      case 'login':
        return <SignUpScreen />;
      case 'profileSetup':
        return <ProfileSetupScreen />;
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
      case 'goals':
        return <GoalsScreen />;
      case 'healthReports':
        return <HealthReportsScreen />;
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
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
};

export default Index;
