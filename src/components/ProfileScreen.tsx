
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '../utils/dateUtils';
import { useOfflineData } from '../hooks/useOfflineData';
import { OfflineStorageService } from '../services/offlineStorage';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPopup } from './ui/notification-popup';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Profile } from '../types';

const ProfileScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const { user, signOut } = useAuth();
  const { isOnline } = useOfflineData();
  const offlineStorage = OfflineStorageService.getInstance();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showHealthReports, setShowHealthReports] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  const {
    notificationsEnabled,
    notificationStats,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    showPopup,
    popupData,
    snoozePopup,
    dismissPopup,
    getSettings,
    updateSettings
  } = useNotifications(profile);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    // Listen for profile updates to sync across components
    const handleProfileUpdate = () => {
      if (user) {
        fetchProfile();
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, [user]);

  const fetchProfile = async () => {
    try {
      if (!navigator.onLine) {
        // Use offline data when offline
        const offlineData = offlineStorage.getProfile(user?.id || '');
        if (offlineData) {
          setProfile(offlineData);
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Try to load from offline storage as fallback
        const offlineData = offlineStorage.getProfile(user?.id || '');
        if (offlineData) {
          setProfile(offlineData);
        }
      } else {
        setProfile(data);
        // Save to offline storage
        offlineStorage.saveProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
      // Try to load from offline storage as fallback
      const offlineData = offlineStorage.getProfile(user?.id || '');
      if (offlineData) {
        setProfile(offlineData);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  );

  if (!profile) return null;

  const handleDeleteProfile = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteProfile = async () => {
    try {
      setShowDeleteDialog(false);
      
      if (isOnline) {
        // Online: Delete from database immediately
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user?.id);

        if (profileError) {
          console.error('Error deleting profile:', profileError);
          alert('Error deleting profile. Please try again.');
          return;
        }

        // Delete user cycles
        await supabase
          .from('cycles')
          .delete()
          .eq('user_id', user?.id);

        // Delete user symptoms
        await supabase
          .from('symptoms')
          .delete()
          .eq('user_id', user?.id);

        // Delete user goals
        await supabase
          .from('goals')
          .delete()
          .eq('user_id', user?.id);

        // Delete profile picture from storage if exists
        if (profile?.profile_photo) {
          await supabase.storage
            .from('profile-pictures')
            .remove([`${user?.id}/profile.jpg`, `${user?.id}/profile.png`, `${user?.id}/profile.jpeg`]);
        }
      } else {
        // Offline: Store deletion request locally
        const deleteRequest = {
          userId: user?.id,
          timestamp: new Date().toISOString(),
          type: 'ACCOUNT_DELETION'
        };
        
        // Store the deletion request in localStorage
        localStorage.setItem('pendingAccountDeletion', JSON.stringify(deleteRequest));
        
        // Clear all offline data immediately
        localStorage.removeItem('flo-rhythm-offline-data');
        
        alert('Account deletion queued. Your data will be removed from the server when you\'re back online.');
      }

      // Sign out user and return to splash
      await signOut();
      setCurrentScreen('splash');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => prev ? { ...prev, profile_photo: urlData.publicUrl } : null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error uploading profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleMyGoals = () => {
    setShowGoalsModal(true);
  };


  const handleHealthReports = () => {
    setShowHealthReports(true);
  };

  const handleTermsAndConditions = () => {
    setShowTermsModal(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentScreen('splash');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  const handleNotifications = () => {
    setShowNotificationsModal(true);
  };

  const profileOptions = [
    { title: 'My Goals', icon: '🎯', color: 'text-blue-600', action: handleMyGoals },
    { title: 'Notifications', icon: '🔔', color: 'text-purple-600', action: handleNotifications },
    { title: 'Health Reports', icon: '📊', color: 'text-purple-600', action: handleHealthReports },
    { title: 'Terms & Conditions', icon: '📄', color: 'text-gray-600', action: handleTermsAndConditions },
    { title: 'Sign Out', icon: '🚪', color: 'text-orange-600', action: handleSignOut },
    { title: 'Delete Profile', icon: '🗑️', color: 'text-red-600', action: handleDeleteProfile }
  ];

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
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-white/90">Manage your account</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 pb-24">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {profile.profile_photo ? (
                  <img 
                    src={profile.profile_photo} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-white">👩</span>
                )}
              </div>
              <button
                onClick={() => document.getElementById('profile-picture-input')?.click()}
                className="absolute -bottom-2 -right-2 bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600 transition-colors"
                disabled={uploading}
              >
                {uploading ? '⏳' : '📷'}
              </button>
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
            <p className="text-gray-600">{profile.email}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Period Length</span>
              <span className="font-medium">{profile.period_length || 5} days</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Cycle Length</span>
              <span className="font-medium">{profile.cycle_length || 28} days</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Last Period</span>
              <span className="font-medium">{profile.last_period_date ? formatDate(profile.last_period_date) : 'Not set'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium">{formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {profileOptions.map((option, index) => (
            <button
              key={option.title}
              onClick={option.action}
              className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${
                index !== profileOptions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span className={`text-xl ${option.color}`}>{option.icon}</span>
              <span className="flex-1 text-left font-medium text-gray-800">
                {option.title}
              </span>
              <span className="text-gray-400">→</span>
            </button>
          ))}
        </div>

        {/* App Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>FloMentor v1.0</p>
          <p>Your personal menstrual health companion</p>
        </div>
      </div>

      {/* Goals Modal */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">My Goals</h3>
            <div className="space-y-3">
              <div className="p-3 bg-pink-50 rounded-lg">
                <h4 className="font-medium text-pink-800">Track Cycle Regularly</h4>
                <p className="text-sm text-pink-600">Log symptoms and moods daily</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Understand Patterns</h4>
                <p className="text-sm text-blue-600">Identify cycle patterns and symptoms</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">Improve Wellness</h4>
                <p className="text-sm text-green-600">Use insights for better health</p>
              </div>
            </div>
            <button
              onClick={() => setShowGoalsModal(false)}
              className="mt-4 w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition-colors"
            >
              Close
            </button>
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
              <p>Your health data is stored locally on your device and is not shared with third parties.</p>
              
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

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">🔔</span>
              Notification Settings
            </h3>
            
            <div className="space-y-6">
              {/* Notification Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Permission:</span>
                    <span className={`ml-1 font-medium ${
                      notificationStats.permission === 'granted' ? 'text-green-600' : 
                      notificationStats.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {notificationStats.permission === 'granted' ? 'Granted' : 
                       notificationStats.permission === 'denied' ? 'Denied' : 'Not Set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Scheduled:</span>
                    <span className="ml-1 font-medium">{notificationStats.scheduled}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Snoozed:</span>
                    <span className="ml-1 font-medium">{notificationStats.snoozed}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-1 font-medium ${notificationStats.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                      {notificationStats.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enable/Disable Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Period Reminders</h4>
                  <p className="text-sm text-gray-600">Get notified before your period starts</p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      enableNotifications(getSettings().daysBefore);
                    } else {
                      disableNotifications();
                    }
                  }}
                />
              </div>

              {notificationsEnabled && (
                <>
                  {/* Days Before Setting */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Remind me {getSettings().daysBefore} days before
                    </label>
                    <Slider
                      value={[getSettings().daysBefore]}
                      onValueChange={(value) => updateSettings({ daysBefore: value[0] })}
                      max={7}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 day</span>
                      <span>7 days</span>
                    </div>
                  </div>

                  {/* Snooze Duration */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Snooze duration: {getSettings().snoozeDuration} hours
                    </label>
                    <Slider
                      value={[getSettings().snoozeDuration]}
                      onValueChange={(value) => updateSettings({ snoozeDuration: value[0] })}
                      max={72}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1 hour</span>
                      <span>72 hours</span>
                    </div>
                  </div>

                  {/* Reminder Time */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={getSettings().reminderTime}
                      onChange={(e) => updateSettings({ reminderTime: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                  </div>

                  {/* Additional Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Weekly Reminders</h5>
                        <p className="text-xs text-gray-600">Get weekly check-in reminders</p>
                      </div>
                      <Switch
                        checked={getSettings().weeklyReminder}
                        onCheckedChange={(checked) => updateSettings({ weeklyReminder: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Ovulation Reminders</h5>
                        <p className="text-xs text-gray-600">Get notified during fertile window</p>
                      </div>
                      <Switch
                        checked={getSettings().ovulationReminder}
                        onCheckedChange={(checked) => updateSettings({ ovulationReminder: checked })}
                      />
                    </div>
                  </div>

                  {/* Test Notification */}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={sendTestNotification}
                      variant="outline"
                      className="w-full"
                    >
                      Send Test Notification
                    </Button>
                  </div>

                  {/* Auto-calculation info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-1">Smart Period Tracking</h5>
                    <p className="text-sm text-blue-600">
                      The app automatically calculates missed periods based on your cycle pattern and updates dates accordingly.
                    </p>
                  </div>
                </>
              )}

              {!notificationsEnabled && (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <span className="text-4xl mb-2 block">🔕</span>
                  <p className="text-sm text-gray-600">
                    Enable notifications to receive period reminders and never miss important dates.
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowNotificationsModal(false)}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              {!notificationsEnabled && (
                <Button
                  onClick={() => enableNotifications(5)}
                  className="flex-1"
                >
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <span className="text-6xl">⚠️</span>
              <h3 className="text-xl font-bold mt-4 text-red-600">Delete Account</h3>
              <p className="text-gray-600 mt-2">Are you sure you want to delete your account? This action cannot be undone and will permanently remove:</p>
              <ul className="text-sm text-gray-600 mt-3 text-left space-y-1">
                <li>• Your profile information</li>
                <li>• All cycle data</li>
                <li>• Symptom tracking history</li>
                <li>• Personal goals</li>
                <li>• Profile pictures</li>
              </ul>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProfile}
                className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Popup */}
      <NotificationPopup
        title={popupData.title}
        message={popupData.message}
        onSnooze={snoozePopup}
        onDismiss={dismissPopup}
        isVisible={showPopup}
      />

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
          <button 
            onClick={() => setCurrentScreen('cycles')}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-gray-400 text-xl">📅</span>
            <span className="text-xs text-gray-400">Cycles</span>
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
          <button className="flex flex-col items-center space-y-1">
            <span className="text-purple-500 text-xl">👩</span>
            <span className="text-xs text-purple-500 font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
