import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, LogIn } from 'lucide-react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

interface AuthFormProps {
  onSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<'username' | 'google'>('username');

  const { signInWithUsername, signInWithGoogle } = useSupabaseAuth();

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to sign in with username:', username.trim());
      await signInWithUsername(username.trim());
      console.log('Sign in successful');
      onSuccess();
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      // Note: Google OAuth will redirect, so onSuccess will be called after redirect
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Advanced Roulette Learning
          </h1>
          <p className="text-white/70">
            Learn while you play - Answer questions to unlock spins
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Auth Mode Toggle */}
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setAuthMode('username')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMode === 'username'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Username
            </button>
            <button
              onClick={() => setAuthMode('google')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                authMode === 'google'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Google
            </button>
          </div>

          {authMode === 'username' ? (
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-3 rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Signing In...' : 'Start Learning'}
              </motion.button>
            </form>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {loading ? 'Signing In...' : 'Continue with Google'}
            </motion.button>
          )}
        </div>

        <div className="mt-6 text-center text-white/60 text-sm">
          <p>Join thousands of learners spinning their way to knowledge!</p>
        </div>
      </motion.div>
    </div>
  );
};