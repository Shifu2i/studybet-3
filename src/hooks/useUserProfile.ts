import { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
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
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        await createProfile();
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!username) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            username,
            balance: 1000,
            last_daily_reset: new Date().toISOString().split('T')[0],
          },
        ])
        .select()
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const checkDailyReset = async () => {
    if (!username || !profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastReset = profile.last_daily_reset;

    if (lastReset !== today && profile.balance < 1000) {
      await updateTokens(1000, today);
    }
  };

  const updateTokens = async (newTokens: number, resetDate?: string) => {
    if (!username || !profile) return;

    try {
      const updateData: any = { balance: newTokens };
      if (resetDate) {
        updateData.last_daily_reset = resetDate;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('username', username)
        .select()
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
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
