/*
  # Fix Transactions Table RLS Policies

  1. Changes
    - Fix SELECT policy to check user_id matches auth.uid()
    - Fix INSERT policy to check user_id matches auth.uid()
    
  2. Security
    - Users can only view their own transactions
    - Users can only create transactions for themselves
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
DROP POLICY IF EXISTS "System can create transactions" ON transactions;

-- Create proper policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
