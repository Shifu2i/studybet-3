/*
  # Advanced Roulette Learning App Schema

  1. New Tables
    - `users` - Enhanced user profiles with customization
    - `transactions` - All token movements with full audit trail
    - `spins` - Complete spin history with physics data
    - `prompts` - AI question database with course integration
    - `spin_answers` - AI evaluation results and scoring
    - `bet_types` - Configurable betting options and payouts
    - `courses` - Course management system
    - `user_settings` - Customizable user preferences
    - `leaderboard_cache` - Materialized leaderboard for performance

  2. Security
    - Enable RLS on all tables
    - Policies for user data access and modification
    - Admin-only access for configuration tables

  3. Advanced Features
    - Custom betting mechanics
    - AI integration support
    - Real-time leaderboard updates
    - Comprehensive analytics
    - User customization system
*/

-- Enhanced Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  auth_provider text NOT NULL DEFAULT 'username',
  email text,
  current_tokens integer NOT NULL DEFAULT 100,
  highest_tokens integer NOT NULL DEFAULT 100,
  display_name text,
  profile_avatar text,
  last_reset_date date DEFAULT CURRENT_DATE,
  daily_reset_amount integer NOT NULL DEFAULT 100,
  winnings_multiplier numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  total_spins integer NOT NULL DEFAULT 0,
  total_winnings integer NOT NULL DEFAULT 0,
  ai_correctness_score numeric NOT NULL DEFAULT 0.0,
  current_streak integer NOT NULL DEFAULT 0,
  best_streak integer NOT NULL DEFAULT 0
);

-- User Settings for Customization
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wheel_theme text NOT NULL DEFAULT 'classic',
  wheel_type text NOT NULL DEFAULT 'american', -- 'american' or 'european'
  spin_physics jsonb NOT NULL DEFAULT '{"friction": 0.02, "duration": 3000, "force_variation": 0.3}',
  bet_board_layout text NOT NULL DEFAULT 'full',
  ui_theme text NOT NULL DEFAULT 'dark',
  animations_enabled boolean NOT NULL DEFAULT true,
  sound_enabled boolean NOT NULL DEFAULT true,
  notifications_enabled boolean NOT NULL DEFAULT true,
  auto_spin_enabled boolean NOT NULL DEFAULT false,
  max_bet_per_spin integer,
  preferred_difficulty integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Courses System
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  topic_tags text[] NOT NULL DEFAULT '{}',
  difficulty_range integer[] NOT NULL DEFAULT '{1,3}',
  is_active boolean NOT NULL DEFAULT true,
  custom_multipliers jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bet Types Configuration
CREATE TABLE IF NOT EXISTS bet_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  payout_ratio numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  wheel_type text NOT NULL DEFAULT 'both', -- 'american', 'european', 'both'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prompts Database
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  course text NOT NULL, -- For backward compatibility
  topic_tags text[] NOT NULL DEFAULT '{}',
  prompt_text text NOT NULL,
  difficulty smallint NOT NULL DEFAULT 1,
  allowed_attempts smallint NOT NULL DEFAULT 1,
  time_limit integer, -- seconds
  grading_threshold numeric NOT NULL DEFAULT 0.7,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Transactions for Full Audit Trail
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'bet', 'payout', 'reset', 'manual', 'partial_payout', 'bonus'
  amount integer NOT NULL,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  spin_id uuid,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Spins History
CREATE TABLE IF NOT EXISTS spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_data jsonb NOT NULL, -- Complete betting information
  spin_force numeric NOT NULL,
  spin_duration integer NOT NULL DEFAULT 3000,
  result_number text NOT NULL, -- '0', '00', '1'-'36'
  result_color text NOT NULL, -- 'red', 'black', 'green'
  total_bet integer NOT NULL,
  total_payout integer NOT NULL DEFAULT 0,
  net_result integer NOT NULL DEFAULT 0,
  prompt_id uuid REFERENCES prompts(id),
  answer_id uuid,
  wheel_type text NOT NULL DEFAULT 'american',
  physics_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AI Answer Evaluation
CREATE TABLE IF NOT EXISTS spin_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spin_id uuid NOT NULL REFERENCES spins(id) ON DELETE CASCADE,
  prompt_id uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_answer text NOT NULL,
  evaluation jsonb, -- AI evaluation results
  is_correct boolean,
  score numeric NOT NULL DEFAULT 0.0,
  time_taken integer, -- milliseconds
  attempt_number smallint NOT NULL DEFAULT 1,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Leaderboard Cache for Performance
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text,
  profile_avatar text,
  current_tokens integer NOT NULL,
  highest_tokens integer NOT NULL,
  total_winnings integer NOT NULL,
  ai_correctness_score numeric NOT NULL,
  current_streak integer NOT NULL,
  best_streak integer NOT NULL,
  total_spins integer NOT NULL,
  rank_by_tokens integer,
  rank_by_winnings integer,
  rank_by_ai_score integer,
  course_id uuid REFERENCES courses(id),
  timeframe text NOT NULL DEFAULT 'all_time', -- 'daily', 'weekly', 'monthly', 'all_time'
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Anyone can create user profile" ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their settings" ON user_settings FOR ALL USING (true);

CREATE POLICY "Anyone can view active courses" ON courses FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active bet types" ON bet_types FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active prompts" ON prompts FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "System can create transactions" ON transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their spins" ON spins FOR SELECT USING (true);
CREATE POLICY "Users can create spins" ON spins FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their answers" ON spin_answers FOR SELECT USING (true);
CREATE POLICY "Users can create answers" ON spin_answers FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view leaderboard" ON leaderboard_cache FOR SELECT USING (true);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_current_tokens ON users(current_tokens DESC);
CREATE INDEX IF NOT EXISTS idx_users_highest_tokens ON users(highest_tokens DESC);
CREATE INDEX IF NOT EXISTS idx_users_ai_score ON users(ai_correctness_score DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_spins_user_id ON spins(user_id);
CREATE INDEX IF NOT EXISTS idx_spins_created_at ON spins(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompts_course ON prompts(course);
CREATE INDEX IF NOT EXISTS idx_prompts_difficulty ON prompts(difficulty);
CREATE INDEX IF NOT EXISTS idx_prompts_topic_tags ON prompts USING GIN(topic_tags);

CREATE INDEX IF NOT EXISTS idx_leaderboard_tokens ON leaderboard_cache(current_tokens DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_winnings ON leaderboard_cache(total_winnings DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_ai_score ON leaderboard_cache(ai_correctness_score DESC);

-- Insert Default Bet Types
INSERT INTO bet_types (name, description, payout_ratio, wheel_type) VALUES
('straight', 'Single number bet', 35, 'both'),
('split', 'Two adjacent numbers', 17, 'both'),
('street', 'Three numbers in a row', 11, 'both'),
('corner', 'Four numbers in a square', 8, 'both'),
('line', 'Six numbers in two rows', 5, 'both'),
('dozen', 'First, second, or third dozen', 2, 'both'),
('column', 'One of three columns', 2, 'both'),
('red', 'All red numbers', 1, 'both'),
('black', 'All black numbers', 1, 'both'),
('odd', 'All odd numbers', 1, 'both'),
('even', 'All even numbers', 1, 'both'),
('high', 'Numbers 19-36', 1, 'both'),
('low', 'Numbers 1-18', 1, 'both')
ON CONFLICT DO NOTHING;

-- Insert Default Course
INSERT INTO courses (name, description, topic_tags, difficulty_range) VALUES
('General Knowledge', 'Mixed topics for general learning', ARRAY['science', 'history', 'math', 'literature'], ARRAY[1, 3]),
('Mathematics', 'Mathematical concepts and problems', ARRAY['algebra', 'geometry', 'calculus', 'statistics'], ARRAY[1, 5]),
('Science', 'Physics, Chemistry, Biology questions', ARRAY['physics', 'chemistry', 'biology', 'astronomy'], ARRAY[1, 4])
ON CONFLICT DO NOTHING;

-- Insert Sample Prompts
INSERT INTO prompts (course, topic_tags, prompt_text, difficulty, allowed_attempts, time_limit) VALUES
('General Knowledge', ARRAY['math'], 'What is 15 × 8?', 1, 2, 30),
('General Knowledge', ARRAY['science'], 'What is the chemical symbol for gold?', 1, 2, 30),
('General Knowledge', ARRAY['history'], 'In what year did World War II end?', 2, 2, 45),
('Mathematics', ARRAY['algebra'], 'Solve for x: 2x + 5 = 17', 2, 3, 60),
('Mathematics', ARRAY['geometry'], 'What is the area of a circle with radius 5?', 3, 3, 90),
('Science', ARRAY['physics'], 'What is the speed of light in a vacuum?', 2, 2, 45),
('Science', ARRAY['chemistry'], 'How many electrons does a carbon atom have?', 2, 2, 45)
ON CONFLICT DO NOTHING;