
import React from 'react';
import { useApp } from '../context/AppContext';

const SplashScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-300 to-indigo-400 flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <div className="text-6xl mb-4">🌸</div>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">
            FloMentor
          </h1>
          <p className="text-xl text-white/90 max-w-sm">
            Your personal companion for menstrual health and wellness
          </p>
        </div>
        
        <div className="space-y-4 pt-8">
          <button
            onClick={() => setCurrentScreen('signup')}
            className="w-full bg-white text-purple-600 font-semibold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Start Now
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-white/70 text-sm">
        Track • Learn • Thrive
      </div>
    </div>
  );
};

export default SplashScreen;
