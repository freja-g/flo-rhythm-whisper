
import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';

const SplashScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-purple-600 mb-4">FloMentor</h1>
        <p className="text-gray-600 mb-8">Your personal menstrual health companion</p>
        <Button 
          onClick={() => setCurrentScreen('signup')}
          className="w-full bg-purple-500 hover:bg-purple-600"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default SplashScreen;
