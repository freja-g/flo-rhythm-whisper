
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const LogScreen: React.FC = () => {
  const { user, setCurrentScreen } = useApp();
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [spotting, setSpotting] = useState<'none' | 'light' | 'heavy'>('none');
  const [menstrualFlow, setMenstrualFlow] = useState<'light' | 'medium' | 'heavy' | 'none'>('none');
  const [loading, setLoading] = useState(false);

  const moods = [
    { name: 'Calm', emoji: '😌', color: 'bg-blue-100 text-blue-800' },
    { name: 'Happy', emoji: '😊', color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Anxious', emoji: '😰', color: 'bg-orange-100 text-orange-800' },
    { name: 'Sad', emoji: '😢', color: 'bg-gray-100 text-gray-800' },
    { name: 'Irritated', emoji: '😤', color: 'bg-red-100 text-red-800' },
    { name: 'Energetic', emoji: '⚡', color: 'bg-green-100 text-green-800' }
  ];

  const symptomOptions = [
    'Headache', 'Cramps', 'Diarrhea', 'Bloating', 'Nausea', 
    'Breast Tenderness', 'Fatigue', 'Acne', 'Food Cravings', 'Back Pain'
  ];

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('symptoms')
        .insert([
          {
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            mood: selectedMood,
            symptoms: selectedSymptoms,
            spotting,
            menstrual_flow: menstrualFlow
          }
        ]);

      if (error) throw error;
      
      alert('Symptoms logged successfully!');
      setCurrentScreen('dashboard');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Log Symptoms</h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg">Track how you're feeling today</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
        {/* Mood Selection */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">How's your mood?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.name}
                onClick={() => setSelectedMood(mood.name)}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  selectedMood === mood.name
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl sm:text-3xl mb-1">{mood.emoji}</div>
                <div className="text-xs sm:text-sm font-medium text-gray-700">{mood.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Any symptoms?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symptomOptions.map((symptom) => (
              <button
                key={symptom}
                onClick={() => handleSymptomToggle(symptom)}
                className={`p-3 sm:p-4 rounded-xl border-2 text-sm sm:text-base font-medium transition-all ${
                  selectedSymptoms.includes(symptom)
                    ? 'border-pink-400 bg-pink-50 text-pink-800'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Spotting */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Spotting</h3>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            {['none', 'light', 'heavy'].map((option) => (
              <button
                key={option}
                onClick={() => setSpotting(option as any)}
                className={`flex-1 p-3 sm:p-4 rounded-xl border-2 font-medium capitalize transition-all text-sm sm:text-base ${
                  spotting === option
                    ? 'border-purple-400 bg-purple-50 text-purple-800'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Menstrual Flow */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Menstrual Flow</h3>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            {['none', 'light', 'medium', 'heavy'].map((option) => (
              <button
                key={option}
                onClick={() => setMenstrualFlow(option as any)}
                className={`flex-1 p-3 sm:p-4 rounded-xl border-2 font-medium capitalize transition-all text-sm sm:text-base ${
                  menstrualFlow === option
                    ? 'border-pink-400 bg-pink-50 text-pink-800'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-3 sm:py-4 lg:py-5 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base lg:text-lg"
        >
          {loading ? 'Saving...' : 'Save Log Entry'}
        </button>
      </div>
    </div>
  );
};

export default LogScreen;
