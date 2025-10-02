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

    // Reset to 100 tokens daily if balance is below 100
    if (lastReset !== today) {
      if (user.balance < 100) {
        await updateTokens(100, today);
      } else {
        // Just update the reset date without changing balance
        const updatedUser = updateUser(username, { last_daily_reset: today });
        if (updatedUser) {
          setProfile(updatedUser);
        }
      }
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
    
    // Ensure tokens are properly added to current balance
    const newTotal = profile.balance + tokensToAdd;
    
    // Update both balance and total winnings
    const updatedUser = updateUser(username!, { 
      balance: newTotal,
      total_winnings: profile.total_winnings + tokensToAdd,
      games_played: profile.games_played + 1
    });
    
    if (updatedUser) {
      setProfile(updatedUser);
    }
  };

  return {
    profile,
    loading,
    updateTokens,
    addTokens,
    refetch: fetchProfile,
  };
};