
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { Cycle } from '../types';
import { supabase } from '@/integrations/supabase/client';

const CyclesScreen: React.FC = () => {
  const { user } = useAuth();
  const { cycles, setCycles, setCurrentScreen } = useApp();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const { toast } = useToast();

  const sortedCycles = cycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const handleSaveCycle = async () => {
    if (!startDate) {
      toast({
        title: "Error",
        description: "Please select a start date",
        variant: "destructive"
      });
      return;
    }

    if (!user) return;

    const newCycle: Cycle = {
      id: Date.now().toString(),
      userId: user.id,
      startDate,
      endDate: endDate || undefined,
      length: cycleLength,
      createdAt: new Date().toISOString()
    };

    setCycles([...cycles, newCycle]);
    
    // Save to database
    try {
      await supabase
        .from('cycles')
        .insert({
          user_id: user.id,
          start_date: startDate,
          end_date: endDate || null,
          cycle_length: cycleLength,
          period_length: periodLength,
        });

      // Update profile's last_period_date
      await supabase
        .from('profiles')
        .update({ last_period_date: startDate })
        .eq('id', user.id);

      // Trigger profile update event
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error) {
      console.error('Error saving cycle:', error);
    }
    
    toast({
      title: "Success",
      description: "Cycle saved successfully!"
    });

    setStartDate('');
    setEndDate('');
  };

  const handleDeleteCycle = async (cycleId: string, cycleDate: string) => {
    if (!user) return;

    // Remove from local state
    const updatedCycles = cycles.filter(cycle => cycle.id !== cycleId);
    setCycles(updatedCycles);

    try {
      // Delete from database (assuming we save cycles there)
      await supabase
        .from('cycles')
        .delete()
        .eq('id', cycleId);

      // If this was the most recent cycle, update profile's last_period_date
      if (updatedCycles.length > 0) {
        const mostRecentCycle = updatedCycles.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )[0];
        
        await supabase
          .from('profiles')
          .update({ last_period_date: mostRecentCycle.startDate })
          .eq('id', user.id);
      } else {
        // No cycles left, clear the last_period_date
        await supabase
          .from('profiles')
          .update({ last_period_date: null })
          .eq('id', user.id);
      }

      // Trigger profile update event
      window.dispatchEvent(new CustomEvent('profile-updated'));

      toast({
        title: "Success",
        description: "Cycle deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting cycle:', error);
      toast({
        title: "Error",
        description: "Failed to delete cycle",
        variant: "destructive"
      });
    }
  };

  const calculateNextPeriod = () => {
    if (sortedCycles.length > 0) {
      const lastCycle = sortedCycles[0];
      const lastPeriod = new Date(lastCycle.startDate);
      const nextPeriod = new Date(lastPeriod.getTime() + (lastCycle.length * 24 * 60 * 60 * 1000));
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
        {sortedCycles.length === 0 ? (
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
            {sortedCycles.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Cycle Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Last Period Date</span>
                    <span className="font-medium">{formatDate(sortedCycles[0].startDate)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Cycle Length</span>
                    <span className="font-medium">{sortedCycles[0].length} days</span>
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
                {sortedCycles.map((cycle, index) => (
                  <div key={cycle.id} className="border-l-4 border-pink-400 pl-4 py-3 bg-pink-50 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {index === 0 ? 'Latest Cycle' : `Cycle ${index + 1}`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(cycle.startDate)} {cycle.endDate && `- ${formatDate(cycle.endDate)}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          index === 0 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {index === 0 ? 'Latest' : 'Completed'}
                        </span>
                        <button
                          onClick={() => handleDeleteCycle(cycle.id, cycle.startDate)}
                          className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50"
                          title="Delete cycle"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Cycle Length:</span>
                        <span className="ml-1 font-medium">{cycle.length} days</span>
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
            {sortedCycles.length === 0 ? 'Start Tracking Your Cycle' : 'Add New Cycle'}
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
              {sortedCycles.length === 0 ? 'Start Tracking' : 'Add Cycle'}
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
            <span className="text-gray-400 text-xl">👩</span>
            <span className="text-xs text-gray-400">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CyclesScreen;
