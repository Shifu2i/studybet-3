import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, User } from '../lib/supabase';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useSupabaseAuth: Initializing...');

    // Timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Auth initialization timeout - setting loading to false');
      setLoading(false);
    }, 10000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('Initial session:', session ? 'Found' : 'None');
        clearTimeout(timeout);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        clearTimeout(timeout);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session ? 'Session exists' : 'No session');
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('Profile fetch result:', { data, error });

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      if (!data) {
        console.log('No profile found, creating new profile');
        await createProfile(userId);
      } else {
        console.log('Profile found:', data);
        setProfile(data);
        await checkDailyReset(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setLoading(false);
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

  const validateUsername = (username: string): { valid: boolean; error?: string } => {
    if (!username || username.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
      return { valid: false, error: 'Username must be 20 characters or less' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    return { valid: true };
  };

  const signInWithUsername = async (username: string) => {
    try {
      const sanitizedUsername = username.trim().toLowerCase();

      const validation = validateUsername(sanitizedUsername);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      console.log('Checking rate limit for username:', sanitizedUsername);
      const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
        'check_login_rate_limit',
        { p_username: sanitizedUsername }
      );

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
      }

      if (rateLimitCheck === false) {
        await supabase.rpc('record_login_attempt', {
          p_username: sanitizedUsername,
          p_success: false,
        });
        throw new Error('Too many login attempts. Please try again in 15 minutes.');
      }

      console.log('Starting anonymous sign in...');
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error('Anonymous sign in error:', error);
        await supabase.rpc('record_login_attempt', {
          p_username: sanitizedUsername,
          p_success: false,
        });
        throw error;
      }

      if (!data.user) {
        console.error('No user data returned from anonymous sign in');
        await supabase.rpc('record_login_attempt', {
          p_username: sanitizedUsername,
          p_success: false,
        });
        throw new Error('No user returned');
      }

      console.log('Anonymous sign in successful, user ID:', data.user.id);
      console.log('Creating profile for username:', sanitizedUsername);

      await createProfile(data.user.id, sanitizedUsername);

      await supabase.rpc('record_login_attempt', {
        p_username: sanitizedUsername,
        p_success: true,
      });

      console.log('Profile created successfully');
    } catch (error) {
      console.error('Error in signInWithUsername:', error);
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
    signOut,
    updateTokens,
    refetchProfile: () => profile && fetchProfile(profile.id),
  };
};