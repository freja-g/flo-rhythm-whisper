
import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';

const SignUpScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-3 border rounded-lg"
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border rounded-lg"
          />
          <Button 
            onClick={() => setCurrentScreen('cycleSetup')}
            className="w-full bg-purple-500 hover:bg-purple-600"
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;
