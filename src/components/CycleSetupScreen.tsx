
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const CycleSetupScreen: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentScreen } = useApp();
  const [formData, setFormData] = useState({
    periodLength: 5,
    cycleLength: 28,
    lastPeriodDate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          period_length: formData.periodLength,
          cycle_length: formData.cycleLength,
          last_period_date: formData.lastPeriodDate
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        alert('Error saving your cycle information. Please try again.');
        return;
      }
      
      setCurrentScreen('dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving your cycle information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6 text-center">
        <h1 className="text-2xl font-bold text-white">Cycle Setup</h1>
        <p className="text-white/90 mt-1">Let's personalize your experience</p>
      </div>

      {/* Form */}
      <div className="p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  Period Length (days)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={formData.periodLength}
                    onChange={(e) => setFormData({...formData, periodLength: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    {formData.periodLength} days
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  Cycle Length (days)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="21"
                    max="35"
                    value={formData.cycleLength}
                    onChange={(e) => setFormData({...formData, cycleLength: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    {formData.cycleLength} days
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  Start Date of Last Period
                </label>
                <input
                  type="date"
                  value={formData.lastPeriodDate}
                  onChange={(e) => setFormData({...formData, lastPeriodDate: e.target.value})}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleSetupScreen;
