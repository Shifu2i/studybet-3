import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, User } from '../lib/supabase';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // User doesn't exist, create profile
        await createProfile(userId);
      } else if (error) {
        throw error;
      } else {
        setProfile(data);
        await checkDailyReset(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string, username?: string) => {
    try {
      const finalUsername = username || `user_${userId.slice(0, 8)}`;

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: finalUsername,
          auth_provider: username ? 'username' : 'google',
          email: user?.email,
          display_name: user?.user_metadata?.full_name || finalUsername,
          profile_avatar: user?.user_metadata?.avatar_url,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Username already taken');
        }
        throw error;
      }

      setProfile(data);

      await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
        });

    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const checkDailyReset = async (userProfile: User) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (userProfile.last_reset_date !== today && userProfile.current_tokens < userProfile.daily_reset_amount) {
      await updateTokens(userProfile.daily_reset_amount, 'reset', 'Daily token reset');
    }
  };

  const signInWithUsername = async (username: string) => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      if (!data.user) throw new Error('No user returned');

      await createProfile(data.user.id, username);
    } catch (error) {
      console.error('Error signing in with username:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateTokens = async (newAmount: number, type: string = 'manual', description?: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase.rpc('update_user_tokens', {
        p_user_id: profile.id,
        p_new_amount: newAmount,
        p_transaction_type: type,
        p_description: description,
      });

      if (error) throw error;
      
      // Refresh profile
      await fetchProfile(profile.id);
    } catch (error) {
      console.error('Error updating tokens:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading,
    signInWithUsername,
    signInWithGoogle,
    signOut,
    updateTokens,
    refetchProfile: () => profile && fetchProfile(profile.id),
  };
};