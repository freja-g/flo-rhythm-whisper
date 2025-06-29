
import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';

const DashboardScreen: React.FC = () => {
  const { setCurrentScreen, user } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Dashboard</h1>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-lg font-semibold mb-2">Welcome back!</h2>
          <p className="text-gray-600">Track your cycle and symptoms</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => setCurrentScreen('log')}
            className="bg-pink-500 hover:bg-pink-600"
          >
            Log Symptoms
          </Button>
          <Button 
            onClick={() => setCurrentScreen('chat')}
            className="bg-purple-500 hover:bg-purple-600"
          >
            AI Chat
          </Button>
          <Button 
            onClick={() => setCurrentScreen('cycles')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Cycles
          </Button>
          <Button 
            onClick={() => setCurrentScreen('profile')}
            className="bg-green-500 hover:bg-green-600"
          >
            Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
