import { useState, useEffect } from 'react';
import { getCurrentUser, setCurrentUser, removeCurrentUser, getUserByUsername, createUser } from '../lib/storage';

export const useAuth = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUsername = getCurrentUser();
    setUsername(storedUsername);
    setLoading(false);
  }, []);

  const signIn = async (usernameInput: string) => {
    try {
      // Check if user exists
      let user = getUserByUsername(usernameInput);
      
      if (!user) {
        // Create new user if doesn't exist
        user = createUser({ username: usernameInput });
      }
      
      setCurrentUser(usernameInput);
      setUsername(usernameInput);
      return { error: null };
    } catch (error: any) {
      return { error: error };
    }
  };

  const signOut = async () => {
    try {
      removeCurrentUser();
      setUsername(null);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  return {
    username,
    loading,
    signIn,
    signOut,
  };
};