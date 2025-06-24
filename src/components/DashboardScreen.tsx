
import React from 'react';
import { useApp } from '../context/AppContext';
import { getDaysUntilPeriod, formatDate } from '../utils/dateUtils';

const DashboardScreen: React.FC = () => {
  const { user, setCurrentScreen } = useApp();

  if (!user) return null;

  const daysUntilPeriod = getDaysUntilPeriod(user.lastPeriodDate, user.cycleLength);
  
  const quickActions = [
    {
      title: 'Log Symptoms',
      subtitle: 'Track your daily symptoms',
      icon: '📝',
      color: 'from-pink-400 to-rose-400',
      onClick: () => setCurrentScreen('log')
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
      icon: '🤖',
      color: 'from-blue-400 to-cyan-400',
      onClick: () => setCurrentScreen('chat')
    }
  ];

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome {user.name}!</h1>
            <p className="text-white/90">How are you feeling today?</p>
          </div>
          <button
            onClick={() => setCurrentScreen('profile')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-lg">👤</span>
          </button>
        </div>

        {/* Period Prediction */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center">
          <div className="text-3xl mb-2">🌸</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Period Prediction
          </h3>
          <p className="text-gray-600">
            Your period starts in <span className="font-bold text-purple-600">{daysUntilPeriod} days</span>
          </p>
        </div>
      </div>

      {/* Week Strip */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex justify-between items-center">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  index === today
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
      <div className="px-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Access</h2>
        
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-xl`}>
                {action.icon}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.subtitle}</p>
              </div>
              <div className="ml-auto text-gray-400">
                →
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-xl">🏠</span>
            <span className="text-xs text-purple-500 font-medium">Home</span>
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

export default DashboardScreen;
