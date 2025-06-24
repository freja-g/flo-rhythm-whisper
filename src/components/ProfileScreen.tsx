
import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateUtils';

const ProfileScreen: React.FC = () => {
  const { user, setUser, setCurrentScreen } = useApp();

  if (!user) return null;

  const profileOptions = [
    { title: 'Go Premium', icon: '⭐', color: 'text-yellow-600' },
    { title: 'My Goals', icon: '🎯', color: 'text-blue-600' },
    { title: 'Subscription', icon: '💳', color: 'text-green-600' },
    { title: 'Health Reports', icon: '📊', color: 'text-purple-600' },
    { title: 'Terms & Conditions', icon: '📄', color: 'text-gray-600' },
    { title: 'Delete Profile', icon: '🗑️', color: 'text-red-600' }
  ];

  const handleDeleteProfile = () => {
    if (confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      setUser(null);
      setCurrentScreen('splash');
    }
  };

  const handleOptionClick = (title: string) => {
    if (title === 'Delete Profile') {
      handleDeleteProfile();
    } else {
      // Handle other options
      console.log(`Clicked: ${title}`);
    }
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
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-white/90">Manage your account</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 pb-24">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Period Length</span>
              <span className="font-medium">{user.periodLength} days</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Cycle Length</span>
              <span className="font-medium">{user.cycleLength} days</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Last Period</span>
              <span className="font-medium">{formatDate(user.lastPeriodDate)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {profileOptions.map((option, index) => (
            <button
              key={option.title}
              onClick={() => handleOptionClick(option.title)}
              className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${
                index !== profileOptions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className={`text-xl ${option.color}`}>{option.icon}</span>
              <span className="flex-1 text-left font-medium text-gray-800">
                {option.title}
              </span>
              <span className="text-gray-400">→</span>
            </button>
          ))}
        </div>

        {/* App Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>FloMentor v1.0</p>
          <p>Your personal menstrual health companion</p>
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
          <button 
            onClick={() => setCurrentScreen('log')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">📝</span>
            <span className="text-xs text-gray-400">Log</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('tips')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">💡</span>
            <span className="text-xs text-gray-400">Tips</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-xl">👤</span>
            <span className="text-xs text-purple-500 font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
