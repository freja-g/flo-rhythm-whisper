import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';

interface Goal {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

const ProfileScreen: React.FC = () => {
  const { user, setUser, setCurrentScreen } = useApp();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showHealthReports, setShowHealthReports] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [newGoal, setNewGoal] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchProfilePhoto();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchProfilePhoto = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('profile_photo')
        .eq('id', user.id)
        .single();

      if (data?.profile_photo) {
        setProfilePhoto(data.profile_photo);
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfilePhoto(data.publicUrl);
      alert('Profile photo updated successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!user || !newGoal.title.trim()) return;

    try {
      const { error } = await supabase
        .from('goals')
        .insert([
          {
            user_id: user.id,
            title: newGoal.title,
            description: newGoal.description
          }
        ]);

      if (error) throw error;

      setNewGoal({ title: '', description: '' });
      fetchGoals();
      alert('Goal added successfully!');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      fetchGoals();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your data.')) return;
    
    if (!user) return;

    setLoading(true);
    try {
      // Delete user data from all tables
      await supabase.from('goals').delete().eq('user_id', user.id);
      await supabase.from('symptoms').delete().eq('user_id', user.id);
      await supabase.from('cycles').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // Delete auth user
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;

      // Clear local storage
      localStorage.clear();
      setUser(null);
      setCurrentScreen('splash');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHealthReports = () => {
    setShowHealthReports(true);
  };

  const handleTermsAndConditions = () => {
    setShowTermsModal(true);
  };

  if (!user) return null;

  const profileOptions = [
    { title: 'My Goals', icon: '🎯', color: 'text-blue-600', action: () => setShowGoalsModal(true) },
    { title: 'Health Reports', icon: '📊', color: 'text-purple-600', action: handleHealthReports },
    { title: 'Terms & Conditions', icon: '📄', color: 'text-gray-600', action: handleTermsAndConditions },
    { title: 'Delete Account', icon: '🗑️', color: 'text-red-600', action: handleDeleteProfile }
  ];

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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Profile</h1>
            <p className="text-white/90 text-sm sm:text-base lg:text-lg">Manage your account</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl text-white">👤</span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-pink-500 text-white rounded-full p-2 cursor-pointer hover:bg-pink-600">
                <span className="text-xs">📷</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-600 text-sm sm:text-base">{user.email}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 text-sm sm:text-base">Period Length</span>
              <span className="font-medium text-sm sm:text-base">{user.periodLength} days</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 text-sm sm:text-base">Cycle Length</span>
              <span className="font-medium text-sm sm:text-base">{user.cycleLength} days</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 text-sm sm:text-base">Last Period</span>
              <span className="font-medium text-sm sm:text-base">{formatDate(user.lastPeriodDate)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 text-sm sm:text-base">Member Since</span>
              <span className="font-medium text-sm sm:text-base">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {profileOptions.map((option, index) => (
            <button
              key={option.title}
              onClick={option.action}
              disabled={loading}
              className={`w-full p-4 sm:p-5 flex items-center space-x-4 hover:bg-gray-50 transition-colors disabled:opacity-50 ${
                index !== profileOptions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className={`text-lg sm:text-xl ${option.color}`}>{option.icon}</span>
              <span className="flex-1 text-left font-medium text-gray-800 text-sm sm:text-base">
                {option.title}
              </span>
              <span className="text-gray-400">→</span>
            </button>
          ))}
        </div>

        {/* App Info */}
        <div className="text-center text-gray-500 text-xs sm:text-sm">
          <p>FloMentor v1.0</p>
          <p>Your personal menstrual health companion</p>
        </div>
      </div>

      {/* Goals Modal */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold">My Goals</h3>
              <button
                onClick={() => setShowGoalsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            {/* Add New Goal */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Goal title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                className="w-full p-2 border rounded mb-2 text-sm"
              />
              <textarea
                placeholder="Goal description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                className="w-full p-2 border rounded mb-2 text-sm resize-none"
                rows={2}
              />
              <button
                onClick={handleAddGoal}
                className="w-full bg-pink-500 text-white py-2 rounded text-sm hover:bg-pink-600"
              >
                Add Goal
              </button>
            </div>

            {/* Goals List */}
            <div className="space-y-3">
              {goals.length === 0 ? (
                <p className="text-gray-500 text-center text-sm">No goals yet. Add your first goal above!</p>
              ) : (
                goals.map((goal) => (
                  <div key={goal.id} className="p-3 bg-pink-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-pink-800 text-sm">{goal.title}</h4>
                        {goal.description && (
                          <p className="text-xs text-pink-600 mt-1">{goal.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Added {formatDate(goal.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-red-500 hover:text-red-700 ml-2 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Health Reports Modal */}
      {showHealthReports && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Health Reports</h3>
            <div className="space-y-4">
              <div className="text-center py-8">
                <span className="text-6xl">📊</span>
                <h4 className="text-lg font-medium mt-4">No Reports Yet</h4>
                <p className="text-gray-600 text-sm">Keep tracking your cycle to generate personalized health reports</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium mb-2">Available Reports:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cycle Pattern Analysis</li>
                  <li>• Symptom Trends</li>
                  <li>• Mood Tracking Summary</li>
                  <li>• Health Insights</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowHealthReports(false)}
              className="mt-4 w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Terms & Conditions</h3>
            <div className="text-sm text-gray-700 space-y-3">
              <p><strong>1. Acceptance of Terms</strong></p>
              <p>By using FloMentor, you agree to these terms and conditions.</p>
              
              <p><strong>2. Privacy</strong></p>
              <p>Your health data is stored securely in our database and is not shared with third parties.</p>
              
              <p><strong>3. Medical Disclaimer</strong></p>
              <p>FloMentor is for informational purposes only and should not replace professional medical advice.</p>
              
              <p><strong>4. Data Accuracy</strong></p>
              <p>You are responsible for the accuracy of the information you input.</p>
              
              <p><strong>5. Updates</strong></p>
              <p>We may update these terms from time to time. Continued use constitutes acceptance.</p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="mt-4 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
          <button 
            onClick={() => setCurrentScreen('symptoms')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-lg sm:text-xl">📝</span>
            <span className="text-xs sm:text-sm text-gray-400">Symptoms</span>
          </button>
          <button 
            onClick={() => setCurrentScreen('tips')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-lg sm:text-xl">💡</span>
            <span className="text-xs sm:text-sm text-gray-400">Tips</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-lg sm:text-xl">👤</span>
            <span className="text-xs sm:text-sm text-purple-500 font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
