import { useState, useEffect } from 'react';
import { User } from '../types';
import { getUserByUsername, updateUser } from '../lib/storage';
import { useAuth } from './useAuth';

export const useUserProfile = () => {
  const { username } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchProfile();
      checkDailyReset();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [username]);

  const fetchProfile = async () => {
    if (!username) return;

    try {
      const user = getUserByUsername(username);
      if (user) {
        setProfile(user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDailyReset = async () => {
    if (!username) return;

    const user = getUserByUsername(username);
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const lastReset = user.last_daily_reset;

    if (lastReset !== today && user.balance < 100) {
      await updateTokens(100, today);
    }
  };

  const updateTokens = async (newTokens: number, resetDate?: string) => {
    if (!username) return;

    try {
      const updateData: any = { balance: newTokens };
      if (resetDate) {
        updateData.last_daily_reset = resetDate;
      }

      const updatedUser = updateUser(username, updateData);
      if (updatedUser) {
        setProfile(updatedUser);
      }
    } catch (error) {
      console.error('Error updating tokens:', error);
    }
  };

  const addTokens = async (tokensToAdd: number) => {
    if (!profile) return;
    const newTotal = profile.balance + tokensToAdd;
    await updateTokens(newTotal);
  };

  return {
    profile,
    loading,
    updateTokens,
    addTokens,
    refetch: fetchProfile,
  };
};