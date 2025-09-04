import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { addDays, differenceInDays, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { OfflineStorageService } from '../services/offlineStorage';
import { useNotifications } from '../hooks/useNotifications';
import { Profile } from '../types';

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentScreen } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const offlineStorage = OfflineStorageService.getInstance();
  const { notificationsEnabled, enableNotifications } = useNotifications(profile);

  const fetchProfile = useCallback(async () => {
    try {
      if (!navigator.onLine) {
        // Use offline data when offline
        const offlineData = offlineStorage.getProfile(user?.id || '');
        if (offlineData) {
          setProfile(offlineData);
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message || error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        console.error('User ID:', user?.id);

        // Check if it's a "no rows" error (profile doesn't exist)
        if (error.code === 'PGRST116' || error.message?.includes('no rows')) {
          console.log('No profile found, redirecting to profile setup');
          setProfile(null);
          setLoading(false);
          return;
        }

        // Try to load from offline storage as fallback
        const offlineData = offlineStorage.getProfile(user?.id || '');
        if (offlineData) {
          setProfile(offlineData);
        }
      } else {
        setProfile(data);
        // Save to offline storage
        offlineStorage.saveProfile(data);
      }
    } catch (error) {
      console.error('Catch block error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Try to load from offline storage as fallback
      const offlineData = offlineStorage.getProfile(user?.id || '');
      if (offlineData) {
        setProfile(offlineData);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Listen for profile updates to sync across components
    const handleProfileUpdate = () => {
      if (user) {
        fetchProfile();
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!loading && !profile && user) {
      // If no profile found after loading, redirect to profile setup
      setCurrentScreen('profileSetup');
    }
  }, [loading, profile, user, setCurrentScreen]);

  if (!user || loading) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const lastPeriodDate = profile.last_period_date ? new Date(profile.last_period_date) : new Date();
  const cycleLength = profile.cycle_length || 28;
  const nextPeriodDate = addDays(lastPeriodDate, cycleLength);
  const daysUntilNextPeriod = differenceInDays(nextPeriodDate, today);
  const daysUntilPeriod = daysUntilNextPeriod > 0 ? daysUntilNextPeriod : 0;
  
  const quickActions = [
    {
      title: 'Add Cycle Details',
      subtitle: 'Track your cycle information',
      icon: '📅',
      color: 'from-pink-500 to-rose-500',
      onClick: () => setCurrentScreen('cycles')
    },
    {
      title: 'Log Symptoms',
      subtitle: 'Track your daily symptoms',
      icon: '📝',
      color: 'from-pink-400 to-rose-400',
      onClick: () => setCurrentScreen('log')
    },
    {
      title: 'My Goals',
      subtitle: 'Set and track wellness goals',
      icon: '🎯',
      color: 'from-green-400 to-emerald-400',
      onClick: () => setCurrentScreen('goals')
    },
    {
      title: 'Health Reports',
      subtitle: 'View trends and insights',
      icon: '📊',
      color: 'from-purple-500 to-indigo-500',
      onClick: () => setCurrentScreen('healthReports')
    },
    {
      title: 'Tips & Info', 
      subtitle: 'Learn about your health',
      icon: '💡',
      color: 'from-purple-400 to-indigo-400',
      onClick: () => setCurrentScreen('tips')
    },
    {
      title: 'AI Chatbot',
      subtitle: 'Get personalized advice',
      icon: '👩‍⚕️',
      color: 'from-blue-400 to-cyan-400',
      onClick: () => setCurrentScreen('chat')
    }
  ];

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayIndex = new Date().getDay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 pb-24">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-2 px-4">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm">📱</span>
            <span className="text-sm font-medium">Offline - Changes will sync when connection returns</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 sm:p-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Welcome {profile.name}!</h1>
            <p className="text-sm sm:text-base text-white/90">How are you feeling today?</p>
          </div>
          <button
            onClick={() => setCurrentScreen('profile')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile.profile_photo || ''} alt={profile.name} />
              <AvatarFallback className="bg-white/20 text-white text-sm">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>

        {/* Period Prediction */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">🌸</div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
            Period Prediction
          </h3>
          <p className="text-sm sm:text-base text-gray-600">
            Your period starts in <span className="font-bold text-purple-600">{daysUntilPeriod} days</span>
          </p>
        </div>
      </div>

      {/* Week Strip */}
      <div className="px-4 sm:px-6 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex justify-between items-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div
                key={index}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  index === todayIndex
                    ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                    : 'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 sm:px-6 space-y-4 mb-20">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Quick Access</h2>
        
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-lg sm:text-xl`}>
                {action.icon}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{action.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{action.subtitle}</p>
              </div>
              <div className="ml-auto text-gray-400">
                →
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-xl">🏠</span>
            <span className="text-xs text-purple-500 font-medium">Home</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('cycles')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">📅</span>
            <span className="text-xs text-gray-400">Cycles</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('symptoms')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">📝</span>
            <span className="text-xs text-gray-400">Symptoms</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('tips')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">💡</span>
            <span className="text-xs text-gray-400">Tips</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">👩</span>
            <span className="text-xs text-gray-400">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
