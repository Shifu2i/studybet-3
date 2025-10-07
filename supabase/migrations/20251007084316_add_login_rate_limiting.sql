/*
  # Add Login Rate Limiting Tables

  1. New Tables
    - `login_attempts`
      - `id` (uuid, primary key)
      - `username` (text) - username attempted
      - `ip_address` (text) - optional IP tracking
      - `success` (boolean) - whether attempt was successful
      - `created_at` (timestamptz) - when attempt occurred
      - `user_agent` (text) - optional browser fingerprint
  
  2. Indexes
    - Index on username for fast lookups
    - Index on created_at for cleanup queries
  
  3. Security
    - Enable RLS on login_attempts table
    - Only allow system/authenticated users to insert
    - Users can only view their own attempts
    
  4. Rate Limiting Function
    - Create function to check rate limits (max 5 attempts per 15 minutes)
*/

-- Create login attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  ip_address text,
  success boolean DEFAULT false,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);

-- Enable RLS
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert login attempts (for tracking failed attempts before auth)
CREATE POLICY "Anyone can record login attempts"
  ON login_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own login attempts
CREATE POLICY "Users can view their own login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    username IN (
      SELECT username FROM users WHERE id = auth.uid()
    )
  );

-- Create rate limiting check function
CREATE OR REPLACE FUNCTION check_login_rate_limit(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*)
  INTO attempt_count
  FROM login_attempts
  WHERE username = p_username
    AND success = false
    AND created_at > now() - interval '15 minutes';
  
  -- Return true if under limit (5 attempts), false if over
  RETURN attempt_count < 5;
END;
$$;

-- Create function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_username text,
  p_success boolean DEFAULT false,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO login_attempts (username, success, ip_address, user_agent)
  VALUES (p_username, p_success, p_ip_address, p_user_agent);
END;
$$;

-- Cleanup old login attempts (keep only last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM login_attempts
  WHERE created_at < now() - interval '7 days';
END;
$$;
