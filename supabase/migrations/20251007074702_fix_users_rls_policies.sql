/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop overly permissive policies that use USING (true)
    - Add proper restrictive policies that check auth.uid()
    - Allow authenticated users to read their own data
    - Allow authenticated users to update their own data
    - Allow authenticated users to insert their own profile
    
  2. Security
    - All policies now check auth.uid() matches user id
    - No more USING (true) which allows anyone to access everything
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can create user profile" ON users;

-- Create proper restrictive policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
