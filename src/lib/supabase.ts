import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  username: string;
  auth_provider: string;
  email?: string;
  current_tokens: number;
  highest_tokens: number;
  display_name?: string;
  profile_avatar?: string;
  last_reset_date: string;
  daily_reset_amount: number;
  winnings_multiplier: number;
  created_at: string;
  last_seen_at: string;
  total_spins: number;
  total_winnings: number;
  ai_correctness_score: number;
  current_streak: number;
  best_streak: number;
}

export interface UserSettings {
  id: string;
  user_id: string;
  wheel_theme: string;
  wheel_type: 'american' | 'european';
  spin_physics: {
    friction: number;
    duration: number;
    force_variation: number;
  };
  bet_board_layout: string;
  ui_theme: string;
  animations_enabled: boolean;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  auto_spin_enabled: boolean;
  max_bet_per_spin?: number;
  preferred_difficulty: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  topic_tags: string[];
  difficulty_range: number[];
  is_active: boolean;
  custom_multipliers?: any;
  created_at: string;
  updated_at: string;
}

export interface BetType {
  id: string;
  name: string;
  description?: string;
  payout_ratio: number;
  is_active: boolean;
  wheel_type: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  course_id?: string;
  course: string;
  topic_tags: string[];
  prompt_text: string;
  difficulty: number;
  allowed_attempts: number;
  time_limit?: number;
  grading_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  spin_id?: string;
  description?: string;
  metadata?: any;
  created_at: string;
}

export interface Spin {
  id: string;
  user_id: string;
  bet_data: any;
  spin_force: number;
  spin_duration: number;
  result_number: string;
  result_color: string;
  total_bet: number;
  total_payout: number;
  net_result: number;
  prompt_id?: string;
  answer_id?: string;
  wheel_type: string;
  physics_data?: any;
  created_at: string;
}

export interface SpinAnswer {
  id: string;
  spin_id: string;
  prompt_id: string;
  user_id: string;
  user_answer: string;
  evaluation?: any;
  is_correct?: boolean;
  score: number;
  time_taken?: number;
  attempt_number: number;
  feedback?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  profile_avatar?: string;
  current_tokens: number;
  highest_tokens: number;
  total_winnings: number;
  ai_correctness_score: number;
  current_streak: number;
  best_streak: number;
  total_spins: number;
  rank_by_tokens?: number;
  rank_by_winnings?: number;
  rank_by_ai_score?: number;
  course_id?: string;
  timeframe: string;
  updated_at: string;
}