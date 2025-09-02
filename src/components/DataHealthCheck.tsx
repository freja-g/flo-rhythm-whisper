import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

interface DataHealthCheckProps {
  onClose: () => void;
}

export const DataHealthCheck: React.FC<DataHealthCheckProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState({
    profileComplete: false,
    hasSymptoms: false,
    hasCycles: false,
    hasGoals: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkDataHealth = async () => {
      if (!user) return;

      try {
        // Check profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Check symptoms
        const { data: symptoms } = await supabase
          .from('symptoms')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        // Check cycles
        const { data: cycles } = await supabase
          .from('cycles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        // Check goals
        const { data: goals } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        setHealthData({
          profileComplete: !!(profile?.name && profile?.email),
          hasSymptoms: !!(symptoms && symptoms.length > 0),
          hasCycles: !!(cycles && cycles.length > 0),
          hasGoals: !!(goals && goals.length > 0)
        });
      } catch (error) {
        console.error('Error checking data health:', error);
      } finally {
        setLoading(false);
      }
    };

    checkDataHealth();
  }, [user]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Checking your data...</p>
          </div>
        </div>
      </div>
    );
  }

  const healthScore = Object.values(healthData).filter(Boolean).length;
  const totalChecks = Object.keys(healthData).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2">🔍</span>
          Data Health Check
        </h3>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Health Score</span>
            <span className="text-2xl font-bold text-purple-600">{healthScore}/{totalChecks}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(healthScore / totalChecks) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="mr-2">{healthData.profileComplete ? '✅' : '❌'}</span>
              <span>Profile Complete</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="mr-2">{healthData.hasSymptoms ? '✅' : '❌'}</span>
              <span>Symptoms Tracked</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="mr-2">{healthData.hasCycles ? '✅' : '❌'}</span>
              <span>Cycles Recorded</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <span className="mr-2">{healthData.hasGoals ? '✅' : '❌'}</span>
              <span>Goals Set</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};