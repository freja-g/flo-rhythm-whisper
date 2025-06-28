
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const SignUpScreen: React.FC = () => {
  const { setCurrentScreen } = useApp();
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Save user profile data
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                name: formData.name,
                email: formData.email,
                created_at: new Date().toISOString()
              }
            ]);

          if (profileError) throw profileError;
          setCurrentScreen('cycleSetup');
        }
      } else {
        // Sign in user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;
        if (data.user) {
          setCurrentScreen('dashboard');
        }
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 sm:p-6 lg:p-8 text-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">FloMentor</h1>
        <p className="text-white/90 mt-1 text-sm sm:text-base lg:text-lg">Welcome to your wellness journey</p>
      </div>

      {/* Form */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg space-y-4 sm:space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base lg:text-lg">
              {isSignUp ? 'Join thousands of women tracking their health' : 'Sign in to continue your journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {isSignUp && (
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 sm:p-4 lg:p-5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm sm:text-base lg:text-lg"
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 sm:p-4 lg:p-5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm sm:text-base lg:text-lg"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full p-3 sm:p-4 lg:p-5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm sm:text-base lg:text-lg"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold py-3 sm:py-4 lg:py-5 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none text-sm sm:text-base lg:text-lg"
            >
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm sm:text-base lg:text-lg"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;
