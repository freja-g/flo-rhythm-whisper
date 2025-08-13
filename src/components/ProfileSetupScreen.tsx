import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ProfileSetupScreen: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentScreen } = useApp();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    profilePhoto: '',
    periodLength: 5,
    cycleLength: 28,
    lastPeriodDate: ''
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, profilePhoto: urlData.publicUrl }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: formData.name,
          profile_photo: formData.profilePhoto,
          period_length: formData.periodLength,
          cycle_length: formData.cycleLength,
          last_period_date: formData.lastPeriodDate
        });
      
      if (error) {
        console.error('Error updating profile:', error);
        alert('Error saving your profile. Please try again.');
        return;
      }
      
      setCurrentScreen('dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-6 text-center">
        <h1 className="text-2xl font-bold text-white">Complete Your Profile</h1>
        <p className="text-white/90 mt-1">Let's personalize your experience</p>
      </div>

      {/* Form */}
      <div className="p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    {formData.profilePhoto ? (
                      <img 
                        src={formData.profilePhoto} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-white">📷</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('profile-photo-input')?.click()}
                    className="absolute -bottom-2 -right-2 bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 transition-colors"
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? '⏳' : '📷'}
                  </button>
                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-600">Add a profile photo</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-3">Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Period Length */}
              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  Period Length (days)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={formData.periodLength}
                    onChange={(e) => setFormData({...formData, periodLength: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    {formData.periodLength} days
                  </span>
                </div>
              </div>

              {/* Cycle Length */}
              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  Cycle Length (days)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="21"
                    max="35"
                    value={formData.cycleLength}
                    onChange={(e) => setFormData({...formData, cycleLength: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                    {formData.cycleLength} days
                  </span>
                </div>
              </div>

              {/* Last Period Date */}
              <div>
                <label className="block text-gray-700 font-medium mb-3">
                  Start Date of Last Period
                </label>
                <input
                  type="date"
                  value={formData.lastPeriodDate}
                  onChange={(e) => setFormData({...formData, lastPeriodDate: e.target.value})}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || uploadingPhoto}
                className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupScreen;
