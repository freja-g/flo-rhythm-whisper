
import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';

const CycleSetupScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Cycle Setup</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Period Length (days)</label>
            <input 
              type="number" 
              defaultValue="5"
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cycle Length (days)</label>
            <input 
              type="number" 
              defaultValue="28"
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <Button 
            onClick={() => setCurrentScreen('dashboard')}
            className="w-full bg-purple-500 hover:bg-purple-600"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CycleSetupScreen;
