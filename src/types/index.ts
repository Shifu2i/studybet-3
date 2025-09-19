export interface User {
  id: string;
  username: string;
  email: string;
  tokens: number;
  created_at: string;
  last_daily_reset: string;
}

export interface SpinResult {
  id: string;
  user_id: string;
  tokens_won: number;
  question: string;
  answer: string;
  topic: string;
  created_at: string;
}

export interface Question {
  id: string;
  topic: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface WheelSegment {
  id: number;
  label: string;
  tokens: number;
  color: string;
  probability: number;
}