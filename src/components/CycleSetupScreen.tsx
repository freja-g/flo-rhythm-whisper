
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';

const CycleSetupScreen: React.FC = () => {
  const { setUser, setCurrentScreen } = useApp();
  const [setupData, setSetupData] = useState({
    name: '',
    periodLength: 5,
    cycleLength: 28,
    lastPeriodDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newUser: User = {
      id: Date.now().toString(),
      name: setupData.name,
      email: 'user@example.com', // Would come from signup
      periodLength: setupData.periodLength,
      cycleLength: setupData.cycleLength,
      lastPeriodDate: setupData.lastPeriodDate,
      createdAt: new Date().toISOString()
    };
    
    setUser(newUser);
    setCurrentScreen('dashboard');
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
                <label className="block text-gray-700 font-medium mb-3">Your Name</label>
                <input
                  type="text"
                  value={setupData.name}
                  onChange={(e) => setSetupData({...setupData, name: e.target.value})}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-3">
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
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    {setupData.periodLength} days
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
                    value={setupData.cycleLength}
                    onChange={(e) => setSetupData({...setupData, cycleLength: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    {setupData.cycleLength} days
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  Start Date of Last Period
                </label>
                <input
                  type="date"
                  value={setupData.lastPeriodDate}
                  onChange={(e) => setSetupData({...setupData, lastPeriodDate: e.target.value})}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Complete Setup
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CycleSetupScreen;
