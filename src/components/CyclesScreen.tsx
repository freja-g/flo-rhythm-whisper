import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { useToast } from '@/hooks/use-toast';
import { Cycle, Symptom } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const CyclesScreen: React.FC = () => {
  const { user } = useAuth();
  const { cycles, setCycles, symptoms, setSymptoms, setCurrentScreen } = useApp();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [spotting, setSpotting] = useState<'none' | 'light' | 'heavy'>('none');
  const [menstrualFlow, setMenstrualFlow] = useState<'light' | 'medium' | 'heavy' | 'none'>('none');

  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editCycleLength, setEditCycleLength] = useState(28);
  const [editPeriodLength, setEditPeriodLength] = useState(5);
  const [editOriginalStartDate, setEditOriginalStartDate] = useState('');

  const { toast } = useToast();

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
    setSelectedSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
  };

  const sortedCycles = cycles.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const handleSaveCycle = async () => {
    if (!startDate) {
      toast({
        title: "Error",
        description: "Please select a start date",
        variant: "destructive"
      });
      return;
    }

    if (!user) return;

    const newCycle: Cycle = {
      id: Date.now().toString(),
      userId: user.id,
      startDate,
      endDate: endDate || undefined,
      length: cycleLength,
      periodLength,
      createdAt: new Date().toISOString()
    };

    setCycles([...cycles, newCycle]);
    
    // Save to database
    try {
      await supabase
        .from('cycles')
        .insert({
          user_id: user.id,
          start_date: startDate,
          end_date: endDate || null,
          cycle_length: cycleLength,
          period_length: periodLength,
        });

      // Update profile's last_period_date to always be the latest
      const allUserCycles = [...cycles, newCycle];
      const latestCycle = allUserCycles
        .filter(c => c.userId === user.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
      
      await supabase
        .from('profiles')
        .update({ last_period_date: latestCycle.startDate })
        .eq('id', user.id);

      // Also create a symptom entry for the cycle start date
      const newSymptom: Symptom = {
        id: (Date.now() + 1).toString(),
        userId: user.id,
        date: startDate,
        mood: selectedMood,
        symptoms: selectedSymptoms,
        spotting,
        menstrualFlow,
        createdAt: new Date().toISOString()
      };
      setSymptoms([...symptoms, newSymptom]);

      await supabase
        .from('symptoms')
        .insert({
          user_id: user.id,
          date: startDate,
          mood: selectedMood,
          symptoms: selectedSymptoms,
          spotting,
          menstrual_flow: menstrualFlow,
        });

      // Trigger profile update event
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error) {
      console.error('Error saving cycle:', error);
    }
    
    toast({
      title: "Success",
      description: "Cycle and symptoms saved successfully!"
    });

    setStartDate('');
    setEndDate('');
    setSelectedMood('');
    setSelectedSymptoms([]);
    setSpotting('none');
    setMenstrualFlow('none');
  };

  const handleDeleteCycle = async (cycleId: string, cycleDate: string) => {
    if (!user) return;

    // Remove from local state
    const updatedCycles = cycles.filter(cycle => cycle.id !== cycleId);
    setCycles(updatedCycles);

    try {
      // Delete from database (assuming we save cycles there)
      await supabase
        .from('cycles')
        .delete()
        .eq('id', cycleId);

      // If this was the most recent cycle, update profile's last_period_date
      if (updatedCycles.length > 0) {
        const mostRecentCycle = updatedCycles.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )[0];
        
        await supabase
          .from('profiles')
          .update({ last_period_date: mostRecentCycle.startDate })
          .eq('id', user.id);
      } else {
        // No cycles left, clear the last_period_date
        await supabase
          .from('profiles')
          .update({ last_period_date: null })
          .eq('id', user.id);
      }

      // Trigger profile update event
      window.dispatchEvent(new CustomEvent('profile-updated'));

      toast({
        title: "Success",
        description: "Cycle deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting cycle:', error);
      toast({
        title: "Error",
        description: "Failed to delete cycle",
        variant: "destructive"
      });
    }
  };

  const openEdit = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setEditStartDate(cycle.startDate);
    setEditCycleLength(cycle.length);
    setEditPeriodLength(cycle.periodLength ?? 5);
    setEditOriginalStartDate(cycle.startDate);
  };

  const handleUpdateCycle = async () => {
    if (!editingCycle || !user) return;

    // Update local state
    const updated = cycles.map(c => c.id === editingCycle.id ? {
      ...c,
      startDate: editStartDate,
      length: editCycleLength,
      periodLength: editPeriodLength,
    } : c);
    setCycles(updated);

    try {
      // Try to update the corresponding DB row by matching on user and original start date
      await supabase
        .from('cycles')
        .update({
          start_date: editStartDate,
          cycle_length: editCycleLength,
          period_length: editPeriodLength,
        })
        .eq('user_id', user.id)
        .eq('start_date', editOriginalStartDate);
    } catch (e) {
      console.error('Failed to update cycle in DB', e);
    }

    toast({ title: 'Updated', description: 'Cycle updated successfully' });
    setEditingCycle(null);
  };

  const calculateNextPeriod = () => {
    if (sortedCycles.length > 0) {
      const lastCycle = sortedCycles[0];
      const lastPeriod = new Date(lastCycle.startDate);
      const nextPeriod = new Date(lastPeriod.getTime() + (lastCycle.length * 24 * 60 * 60 * 1000));
      return formatDate(nextPeriod.toISOString().split('T')[0]);
    }
    return 'Not available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 sm:p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="text-white text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Cycles</h1>
            <p className="text-sm sm:text-base text-white/90">Track your menstrual cycle</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 pb-24">
        {sortedCycles.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No Cycles Yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">Start tracking your menstrual cycle to see history here</p>
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                document.getElementById('cycle-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
            >
              Start Tracking
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Cycle Info */}
            {sortedCycles.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Current Cycle Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Last Period Date</span>
                    <span className="font-medium">{formatDate(sortedCycles[0].startDate)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Cycle Length</span>
                    <span className="font-medium">{sortedCycles[0].length} days</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Next Expected Period</span>
                    <span className="font-medium text-purple-600">{calculateNextPeriod()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cycles History */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Cycle History</h3>
              <div className="space-y-4">
                {sortedCycles.map((cycle, index) => (
                  <div key={cycle.id} className="border-l-4 border-pink-400 pl-4 py-3 bg-pink-50 rounded-r-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {index === 0 ? 'Latest Cycle' : `Cycle ${index + 1}`}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(cycle.startDate)} {cycle.endDate && `- ${formatDate(cycle.endDate)}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          index === 0 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {index === 0 ? 'Latest' : 'Completed'}
                        </span>
                        <button
                          onClick={() => openEdit(cycle)}
                          className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                          title="Edit cycle"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteCycle(cycle.id, cycle.startDate)}
                          className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50"
                          title="Delete cycle"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Cycle Length:</span>
                        <span className="ml-1 font-medium">{cycle.length} days</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Period Length:</span>
                        <span className="ml-1 font-medium">{cycle.periodLength} days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add New Cycle */}
        <div id="cycle-form" className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
            {sortedCycles.length === 0 ? 'Start Tracking Your Cycle' : 'Add New Cycle'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle Length (days)
                </label>
                <input
                  type="number"
                  min="21"
                  max="35"
                  value={cycleLength}
                  onChange={(e) => setCycleLength(Number(e.target.value))}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Length (days)
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={periodLength}
                  onChange={(e) => setPeriodLength(Number(e.target.value))}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base"
                />
              </div>
            </div>

            {/* Symptoms for this cycle start */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Day 1 Symptoms (optional)</h4>

              {/* Mood */}
              <div>
                <div className="text-xs text-gray-500 mb-2">Mood</div>
                <div className="grid grid-cols-3 gap-2">
                  {moods.map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setSelectedMood(m.name)}
                      className={`p-2 rounded-lg border-2 ${selectedMood === m.name ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="text-xl">{m.emoji}</div>
                      <div className="text-xs text-gray-700">{m.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptom tags */}
              <div>
                <div className="text-xs text-gray-500 mb-2">Symptoms</div>
                <div className="grid grid-cols-2 gap-2">
                  {symptomOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSymptomToggle(s)}
                      className={`p-2 rounded-lg border-2 text-xs font-medium ${selectedSymptoms.includes(s) ? 'border-pink-400 bg-pink-50 text-pink-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spotting and Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-2">Spotting</div>
                  <div className="flex gap-2">
                    {['none','light','heavy'].map((opt) => (
                      <button key={opt} type="button" onClick={() => setSpotting(opt as 'none' | 'light' | 'heavy')} className={`flex-1 p-2 rounded-lg border-2 capitalize ${spotting===opt ? 'border-purple-400 bg-purple-50 text-purple-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">Menstrual Flow</div>
                  <div className="flex gap-2">
                    {['none','light','medium','heavy'].map((opt) => (
                      <button key={opt} type="button" onClick={() => setMenstrualFlow(opt as 'light' | 'medium' | 'heavy' | 'none')} className={`flex-1 p-2 rounded-lg border-2 capitalize ${menstrualFlow===opt ? 'border-pink-400 bg-pink-50 text-pink-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveCycle}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              {sortedCycles.length === 0 ? 'Start Tracking' : 'Add Cycle'}
            </button>
          </div>
        </div>

        {/* Edit Cycle Dialog */}
        <Dialog open={!!editingCycle} onOpenChange={(open) => { if (!open) setEditingCycle(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Cycle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" value={editStartDate} onChange={(e)=>setEditStartDate(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cycle Length</label>
                  <input type="number" min={21} max={35} value={editCycleLength} onChange={(e)=>setEditCycleLength(Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period Length</label>
                  <input type="number" min={3} max={10} value={editPeriodLength} onChange={(e)=>setEditPeriodLength(Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <button onClick={()=>setEditingCycle(null)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdateCycle} className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-400 to-purple-400 text-white">Save</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex justify-around">
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">🏠</span>
            <span className="text-xs text-gray-400">Home</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-xl">📅</span>
            <span className="text-xs text-purple-500 font-medium">Cycles</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('symptoms')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">📝</span>
            <span className="text-xs text-gray-400">Symptoms</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('tips')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">💡</span>
            <span className="text-xs text-gray-400">Tips</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('profile')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">👩</span>
            <span className="text-xs text-gray-400">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CyclesScreen;
