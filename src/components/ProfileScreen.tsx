
import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

const ProfileScreen: React.FC = () => {
  const { setCurrentScreen, user } = useApp();

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
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input 
                type="text" 
                defaultValue={user?.name || ""}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input 
                type="email" 
                defaultValue={user?.email || ""}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <Button className="w-full bg-purple-500 hover:bg-purple-600">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
