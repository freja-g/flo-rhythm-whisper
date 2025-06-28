
import React from 'react';
import { useApp } from '../context/AppContext';
import { getDaysUntilPeriod, formatDate } from '../utils/dateUtils';

const DashboardScreen: React.FC = () => {
  const { user, setCurrentScreen } = useApp();

  if (!user) return null;

  const daysUntilPeriod = getDaysUntilPeriod(user.lastPeriodDate, user.cycleLength);
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 sm:p-6 lg:p-8 pb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Welcome {user.name}!</h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg">How are you feeling today?</p>
          </div>
          <button
            onClick={() => setCurrentScreen('profile')}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-lg sm:text-xl">👤</span>
          </button>
        </div>

        {/* Period Prediction */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center">
          <div className="text-2xl sm:text-3xl mb-2">🌸</div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
            Period Prediction
          </h3>
          <p className="text-gray-600 text-sm sm:text-base">
            Your period starts in <span className="font-bold text-purple-600">{daysUntilPeriod} days</span>
          </p>
        </div>
      </div>

      {/* Week Strip */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div
                key={index}
                className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-medium text-sm sm:text-base ${
                  index === new Date().getDay()
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
      <div className="px-4 sm:px-6 lg:px-8 space-y-4 mb-20">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Quick Access</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="w-full bg-white rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-xl sm:text-2xl`}>
                  {action.icon}
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{action.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">{action.subtitle}</p>
                </div>
                <div className="ml-auto text-gray-400 text-lg sm:text-xl">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex justify-around max-w-md mx-auto">
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-lg sm:text-xl">🏠</span>
            <span className="text-xs sm:text-sm text-purple-500 font-medium">Home</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('cycles')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-lg sm:text-xl">📅</span>
            <span className="text-xs sm:text-sm text-gray-400">Cycles</span>
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

export default DashboardScreen;
