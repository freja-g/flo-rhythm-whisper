
import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

const CyclesScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentScreen('dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Cycles</h1>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600 text-center">Cycle tracking coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default CyclesScreen;
