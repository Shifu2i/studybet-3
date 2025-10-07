/*
  # Fix User Settings RLS Policies

  1. Changes
    - Drop overly broad "ALL" policy
    - Create separate policies for SELECT, INSERT, UPDATE
    - Ensure all policies check auth.uid() matches user_id
    
  2. Security
    - Users can only access their own settings
    - Properly checks authentication
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their settings" ON user_settings;

-- Create proper policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
