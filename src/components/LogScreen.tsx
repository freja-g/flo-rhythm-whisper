
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Symptom } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LogScreen: React.FC = () => {
  const { user } = useAuth();
  const { symptoms, setSymptoms, setCurrentScreen } = useApp();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [spotting, setSpotting] = useState<'none' | 'light' | 'heavy'>('none');
  const [menstrualFlow, setMenstrualFlow] = useState<'light' | 'medium' | 'heavy' | 'none'>('none');

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

    const currentDate = new Date().toISOString().split('T')[0];
    const newSymptom: Symptom = {
      id: Date.now().toString(),
      userId: user.id,
      date: currentDate,
      mood: selectedMood,
      symptoms: selectedSymptoms,
      spotting,
      menstrualFlow,
      createdAt: new Date().toISOString()
    };

    setSymptoms([...symptoms, newSymptom]);

    // If user logged menstrual flow (not none), update the profile's last_period_date
    if (menstrualFlow !== 'none') {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ last_period_date: currentDate })
          .eq('id', user.id);
          
        if (!error) {
          toast({
            title: "Period Date Updated",
            description: "Your last period date has been updated based on your logged flow.",
          });
          
          // Trigger profile update event to sync across components
          window.dispatchEvent(new CustomEvent('profile-updated'));
        }
      } catch (error) {
        console.error('Error updating period date:', error);
      }
    }

    // Save symptom to database
    try {
      await supabase
        .from('symptoms')
        .insert({
          user_id: user.id,
          date: currentDate,
          mood: selectedMood,
          symptoms: selectedSymptoms,
          spotting,
          menstrual_flow: menstrualFlow,
        });
    } catch (error) {
      console.error('Error saving symptom:', error);
    }

    setCurrentScreen('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="text-white text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Log Symptoms</h1>
            <p className="text-white/90">Track how you're feeling today</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 pb-24">
        {/* Mood Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">How's your mood?</h3>
          <div className="grid grid-cols-3 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.name}
                onClick={() => setSelectedMood(mood.name)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedMood === mood.name
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{mood.emoji}</div>
                <div className="text-sm font-medium text-gray-700">{mood.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Any symptoms?</h3>
          <div className="grid grid-cols-2 gap-3">
            {symptomOptions.map((symptom) => (
              <button
                key={symptom}
                onClick={() => handleSymptomToggle(symptom)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
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
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spotting</h3>
          <div className="flex space-x-3">
            {['none', 'light', 'heavy'].map((option) => (
              <button
                key={option}
                onClick={() => setSpotting(option as any)}
                className={`flex-1 p-3 rounded-xl border-2 font-medium capitalize transition-all ${
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
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Menstrual Flow</h3>
          <div className="flex space-x-3">
            {['none', 'light', 'medium', 'heavy'].map((option) => (
              <button
                key={option}
                onClick={() => setMenstrualFlow(option as any)}
                className={`flex-1 p-3 rounded-xl border-2 font-medium capitalize transition-all ${
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
          className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          Save Log Entry
        </button>
      </div>
    </div>
  );
};

export default LogScreen;
