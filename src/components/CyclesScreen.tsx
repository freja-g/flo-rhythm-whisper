
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';

interface CycleEntry {
  id: string;
  start_date: string;
  end_date?: string;
  cycle_length: number;
  period_length: number;
  created_at: string;
}

const CyclesScreen: React.FC = () => {
  const { user, setUser, setCurrentScreen } = useApp();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cycleLength, setCycleLength] = useState(user?.cycleLength || 28);
  const [periodLength, setPeriodLength] = useState(user?.periodLength || 5);
  const [cycles, setCycles] = useState<CycleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCycles();
    }
  }, [user]);

  const fetchCycles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setCycles(data || []);
    } catch (error) {
      console.error('Error fetching cycles:', error);
    }
  };

  if (!user) return null;

  const handleSaveCycle = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    setLoading(true);
    try {
      // Save cycle to database
      const { error: cycleError } = await supabase
        .from('cycles')
        .insert([
          {
            user_id: user.id,
            start_date: startDate,
            end_date: endDate || null,
            cycle_length: cycleLength,
            period_length: periodLength
          }
        ]);

      if (cycleError) throw cycleError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          last_period_date: startDate,
          cycle_length: cycleLength,
          period_length: periodLength
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const updatedUser = {
        ...user,
        lastPeriodDate: startDate,
        cycleLength,
        periodLength
      };

      setUser(updatedUser);
      fetchCycles(); // Refresh cycles list
      setStartDate('');
      setEndDate('');
      alert('Cycle details saved successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextPeriod = () => {
    if (user.lastPeriodDate) {
      const lastPeriod = new Date(user.lastPeriodDate);
      const nextPeriod = new Date(lastPeriod.getTime() + (user.cycleLength * 24 * 60 * 60 * 1000));
      return formatDate(nextPeriod.toISOString().split('T')[0]);
    }
    return 'Not available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="text-white text-xl sm:text-2xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Cycles</h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg">Track your menstrual cycle</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
        {/* Current Cycle Info */}
        {user.lastPeriodDate && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Current Cycle Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-600 text-sm sm:text-base">Last Period Date</span>
                <span className="font-medium text-sm sm:text-base">{formatDate(user.lastPeriodDate)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 text-sm sm:text-base">Cycle Length</span>
                <span className="font-medium text-sm sm:text-base">{user.cycleLength} days</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 text-sm sm:text-base">Period Length</span>
                <span className="font-medium text-sm sm:text-base">{user.periodLength} days</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 text-sm sm:text-base">Next Expected Period</span>
                <span className="font-medium text-purple-600 text-sm sm:text-base">{calculateNextPeriod()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Cycle History */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Cycle History</h3>
          {cycles.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📅</div>
              <p className="text-gray-500 text-base sm:text-lg mb-2">No cycle history yet</p>
              <p className="text-gray-400 text-sm sm:text-base">Start tracking your cycles to see your history here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cycles.map((cycle) => (
                <div key={cycle.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base">
                        {formatDate(cycle.start_date)}
                      </h4>
                      {cycle.end_date && (
                        <p className="text-sm text-gray-600">
                          to {formatDate(cycle.end_date)}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{cycle.cycle_length} day cycle</p>
                      <p>{cycle.period_length} day period</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Cycle */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Add New Cycle</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle Length (days)
              </label>
              <input
                type="number"
                min="21"
                max="35"
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Length (days)
              </label>
              <input
                type="number"
                min="3"
                max="7"
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm sm:text-base"
              />
            </div>

            <button
              onClick={handleSaveCycle}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-3 sm:py-4 lg:py-5 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base lg:text-lg"
            >
              {loading ? 'Saving...' : 'Save Cycle'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex justify-around max-w-md mx-auto">
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-lg sm:text-xl">🏠</span>
            <span className="text-xs sm:text-sm text-gray-400">Home</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-lg sm:text-xl">📅</span>
            <span className="text-xs sm:text-sm text-purple-500 font-medium">Cycles</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('symptoms')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-lg sm:text-xl">📝</span>
            <span className="text-xs sm:text-sm text-gray-400">Symptoms</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('tips')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-lg sm:text-xl">💡</span>
            <span className="text-xs sm:text-sm text-gray-400">Tips</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-lg sm:text-xl">👤</span>
            <span className="text-xs sm:text-sm text-gray-400">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CyclesScreen;
