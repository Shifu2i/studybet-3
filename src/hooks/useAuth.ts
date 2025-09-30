import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    setUsername(storedUsername);
    setLoading(false);
  }, []);

  const signIn = async (usernameInput: string) => {
    try {
      localStorage.setItem('username', usernameInput);
      setUsername(usernameInput);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('username');
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
