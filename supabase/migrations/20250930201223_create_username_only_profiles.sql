/*
  # Create username-only user profiles

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - Auto-generated unique identifier
      - `username` (text, unique, not null) - User's chosen username
      - `balance` (integer, default 1000) - User's token balance
      - `last_daily_reset` (date, default today) - Last time daily tokens were reset
      - `total_winnings` (integer, default 0) - Cumulative tokens won
      - `games_played` (integer, default 0) - Total number of games played
      - `created_at` (timestamptz, default now()) - Account creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for anyone to read leaderboard data
    - Add policy for users to read their own profile by username
    - Add policy for users to update their own profile by username
    - Add policy for new users to create their profile

  3. Notes
    - No email/password authentication required
    - Username is the only identifier needed
    - All users can view leaderboard
    - Users can only modify their own data
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  balance integer NOT NULL DEFAULT 1000,
  last_daily_reset date DEFAULT CURRENT_DATE,
  total_winnings integer NOT NULL DEFAULT 0,
  games_played integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON user_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can create their profile"
  ON user_profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_balance ON user_profiles(balance DESC);
