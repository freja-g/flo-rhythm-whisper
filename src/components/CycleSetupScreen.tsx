
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { User } from '../types';

const CycleSetupScreen: React.FC = () => {
  const { setUser, setCurrentScreen } = useApp();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [setupData, setSetupData] = useState({
    periodLength: 5,
    cycleLength: 28,
    lastPeriodDate: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && userProfile) {
        // Update profile with cycle data
        const { error } = await supabase
          .from('profiles')
          .update({
            period_length: setupData.periodLength,
            cycle_length: setupData.cycleLength,
            last_period_date: setupData.lastPeriodDate
          })
          .eq('id', user.id);

        if (error) throw error;

        const newUser: User = {
          id: user.id,
          name: userProfile.name,
          email: userProfile.email,
          periodLength: setupData.periodLength,
          cycleLength: setupData.cycleLength,
          lastPeriodDate: setupData.lastPeriodDate,
          createdAt: userProfile.created_at
        };
        
        setUser(newUser);
        setCurrentScreen('dashboard');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 sm:p-6 lg:p-8 text-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Welcome, {userProfile.name}!</h1>
        <p className="text-white/90 mt-1 text-sm sm:text-base lg:text-lg">Let's personalize your experience</p>
      </div>

      {/* Form */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-sm sm:max-w-md lg:max-w-lg mx-auto space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-3 text-sm sm:text-base lg:text-lg">
                  Period Length (days)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={setupData.periodLength}
                    onChange={(e) => setSetupData({...setupData, periodLength: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium text-sm sm:text-base">
                    {setupData.periodLength} days
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-3 text-sm sm:text-base lg:text-lg">
                  Cycle Length (days)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="21"
                    max="35"
                    value={setupData.cycleLength}
                    onChange={(e) => setSetupData({...setupData, cycleLength: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium text-sm sm:text-base">
                    {setupData.cycleLength} days
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-3 text-sm sm:text-base lg:text-lg">
                  Start Date of Last Period
                </label>
                <input
                  type="date"
                  value={setupData.lastPeriodDate}
                  onChange={(e) => setSetupData({...setupData, lastPeriodDate: e.target.value})}
                  className="w-full p-3 sm:p-4 lg:p-5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm sm:text-base lg:text-lg"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-3 sm:py-4 lg:py-5 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none text-sm sm:text-base lg:text-lg"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleSetupScreen;
