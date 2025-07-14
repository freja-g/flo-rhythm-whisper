
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateUtils';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CyclesScreen: React.FC = () => {
  const { user, setCurrentScreen } = useApp();
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const { toast } = useToast();

  // Load cycles from database
  useEffect(() => {
    const loadCycles = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('cycles')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false });

        if (error) throw error;
        setCycles(data || []);
      } catch (error) {
        console.error('Error loading cycles:', error);
        toast({
          title: "Error",
          description: "Failed to load cycles data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadCycles();
  }, [user?.id, toast]);

  if (!user || loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const handleSaveCycle = async () => {
    if (!startDate) {
      toast({
        title: "Error",
        description: "Please select a start date",
        variant: "destructive"
      });
      return;
    }

    try {
      const cycleData = {
        user_id: user.id,
        start_date: startDate,
        end_date: endDate || null,
        cycle_length: cycleLength,
        period_length: periodLength
      };

      const { error } = await supabase
        .from('cycles')
        .insert([cycleData]);

      if (error) throw error;

      // Update user profile with latest cycle info
      await supabase
        .from('profiles')
        .update({
          last_period_date: startDate,
          cycle_length: cycleLength,
          period_length: periodLength
        })
        .eq('id', user.id);

      toast({
        title: "Success",
        description: "Cycle saved successfully!"
      });

      // Refresh cycles
      const { data } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      setCycles(data || []);
      setStartDate('');
      setEndDate('');
    } catch (error) {
      console.error('Error saving cycle:', error);
      toast({
        title: "Error",
        description: "Failed to save cycle",
        variant: "destructive"
      });
    }
  };

  const calculateNextPeriod = () => {
    if (cycles.length > 0) {
      const lastCycle = cycles[0];
      const lastPeriod = new Date(lastCycle.start_date);
      const nextPeriod = new Date(lastPeriod.getTime() + (lastCycle.cycle_length * 24 * 60 * 60 * 1000));
      return formatDate(nextPeriod.toISOString().split('T')[0]);
    }
    return 'Not available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="text-white text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Cycles</h1>
            <p className="text-white/90">Track your menstrual cycle</p>
          </div>
        </div>
      </div>

      <div className="p-6 pb-24">
        {cycles.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Cycles Yet</h3>
            <p className="text-gray-600 mb-4">Start tracking your menstrual cycle to see history here</p>
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                document.getElementById('cycle-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
            >
              Start Tracking
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Cycle Info */}
            {cycles.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Cycle Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Last Period Date</span>
                    <span className="font-medium">{formatDate(cycles[0].start_date)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Cycle Length</span>
                    <span className="font-medium">{cycles[0].cycle_length} days</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Period Length</span>
                    <span className="font-medium">{cycles[0].period_length} days</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Next Expected Period</span>
                    <span className="font-medium text-purple-600">{calculateNextPeriod()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cycles History */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Cycle History</h3>
              <div className="space-y-4">
                {cycles.map((cycle, index) => (
                  <div key={cycle.id} className="border-l-4 border-pink-400 pl-4 py-3 bg-pink-50 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {index === 0 ? 'Latest Cycle' : `Cycle ${index + 1}`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(cycle.start_date)} {cycle.end_date && `- ${formatDate(cycle.end_date)}`}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        index === 0 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {index === 0 ? 'Latest' : 'Completed'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Cycle Length:</span>
                        <span className="ml-1 font-medium">{cycle.cycle_length} days</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Period Length:</span>
                        <span className="ml-1 font-medium">{cycle.period_length} days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add New Cycle */}
        <div id="cycle-form" className="bg-white rounded-2xl p-6 shadow-lg mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {cycles.length === 0 ? 'Start Tracking Your Cycle' : 'Add New Cycle'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <button
              onClick={handleSaveCycle}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              {cycles.length === 0 ? 'Start Tracking' : 'Add Cycle'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-around">
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">🏠</span>
            <span className="text-xs text-gray-400">Home</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-xl">📅</span>
            <span className="text-xs text-purple-500 font-medium">Cycles</span>
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
            <span className="text-gray-400 text-xl">👤</span>
            <span className="text-xs text-gray-400">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CyclesScreen;
