import { User } from '../types';

// Local storage keys
const USERS_KEY = 'spinning_wheel_users';
const CURRENT_USER_KEY = 'spinning_wheel_current_user';

export interface StoredUser extends User {
  email?: string;
  password?: string;
}

// Get all users from localStorage
export const getUsers = (): StoredUser[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

// Save users to localStorage
export const saveUsers = (users: StoredUser[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Get current user
export const getCurrentUser = (): string | null => {
  return localStorage.getItem(CURRENT_USER_KEY);
};

// Set current user
export const setCurrentUser = (username: string): void => {
  localStorage.setItem(CURRENT_USER_KEY, username);
};

// Remove current user
export const removeCurrentUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Get user by username
export const getUserByUsername = (username: string): StoredUser | null => {
  const users = getUsers();
  return users.find(user => user.username === username) || null;
};

// Create new user
export const createUser = (userData: Partial<StoredUser>): StoredUser => {
  const users = getUsers();
  
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    username: userData.username || '',
    balance: 100, // Start with 100 tokens
    last_daily_reset: new Date().toISOString().split('T')[0],
    total_winnings: 0,
    games_played: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

// Update user
export const updateUser = (username: string, updates: Partial<StoredUser>): StoredUser | null => {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.username === username);
  
  if (userIndex === -1) return null;
  
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  saveUsers(users);
  return users[userIndex];
};

// Get leaderboard (top users by balance)
export const getLeaderboard = (limit: number = 10): StoredUser[] => {
  const users = getUsers();
  return users
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
};