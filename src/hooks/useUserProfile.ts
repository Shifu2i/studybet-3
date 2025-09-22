import { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useUserProfile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      fetchProfile();
      checkDailyReset();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [authUser]);

  const fetchProfile = async () => {
    if (!authUser) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create profile
        await createProfile();
      } else if (error) {
        throw error;
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
    if (!authUser) return;

    try {
      const username = authUser.user_metadata?.username || 
                      authUser.email?.split('@')[0] || 
                      'User';

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: authUser.id,
            username,
            balance: 100,
            last_daily_reset: new Date().toISOString().split('T')[0],
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const checkDailyReset = async () => {
    if (!authUser || !profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastReset = profile.last_daily_reset;

    if (lastReset !== today && profile.balance < 100) {
      await updateTokens(100, today);
    }
  };

  const updateTokens = async (newTokens: number, resetDate?: string) => {
    if (!authUser || !profile) return;

    try {
      const updateData: any = { balance: newTokens };
      if (resetDate) {
        updateData.last_daily_reset = resetDate;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', authUser.id)
        .select()
        .single();

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