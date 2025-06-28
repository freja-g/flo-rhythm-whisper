
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';

interface SymptomEntry {
  id: string;
  date: string;
  mood: string;
  symptoms: string[];
  spotting: string;
  menstrual_flow: string;
  created_at: string;
}

const SymptomsScreen: React.FC = () => {
  const { user, setCurrentScreen } = useApp();
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);

  useEffect(() => {
    if (user) {
      fetchSymptoms();
    }
  }, [user]);

  const fetchSymptoms = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setSymptoms(data || []);
    } catch (error) {
      console.error('Error fetching symptoms:', error);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: { [key: string]: string } = {
      'Calm': '😌',
      'Happy': '😊',
      'Anxious': '😰',
      'Sad': '😢',
      'Irritated': '😤',
      'Energetic': '⚡'
    };
    return moodEmojis[mood] || '😐';
  };

  const getFlowColor = (flow: string) => {
    switch (flow) {
      case 'light': return 'text-pink-400';
      case 'medium': return 'text-pink-500';
      case 'heavy': return 'text-pink-600';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="text-white text-xl sm:text-2xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Symptoms</h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg">Your logged symptoms history</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 pb-24">
        {symptoms.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg text-center">
            <div className="text-4xl sm:text-6xl mb-4">📝</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Symptoms Yet</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">Start tracking your symptoms to see them here</p>
            <button
              onClick={() => setCurrentScreen('log')}
              className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all text-sm sm:text-base"
            >
              Log Symptoms
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {symptoms.map((symptom) => (
              <div key={symptom.id} className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                      {formatDate(symptom.date)}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(symptom.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {symptom.mood && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl">{getMoodEmoji(symptom.mood)}</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-600">{symptom.mood}</span>
                    </div>
                  )}
                </div>

                {/* Symptoms */}
                {symptom.symptoms.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Symptoms:</h4>
                    <div className="flex flex-wrap gap-2">
                      {symptom.symptoms.map((s, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-pink-100 text-pink-800 text-xs sm:text-sm rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flow and Spotting */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Menstrual Flow:</h4>
                    <span className={`text-xs sm:text-sm font-medium capitalize ${getFlowColor(symptom.menstrual_flow)}`}>
                      {symptom.menstrual_flow}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Spotting:</h4>
                    <span className="text-xs sm:text-sm font-medium text-gray-600 capitalize">
                      {symptom.spotting}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex justify-around max-w-md mx-auto">
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-lg sm:text-xl">🏠</span>
            <span className="text-xs sm:text-sm text-gray-400">Home</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('cycles')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-lg sm:text-xl">📅</span>
            <span className="text-xs sm:text-sm text-gray-400">Cycles</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-lg sm:text-xl">📝</span>
            <span className="text-xs sm:text-sm text-purple-500 font-medium">Symptoms</span>
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

export default SymptomsScreen;
