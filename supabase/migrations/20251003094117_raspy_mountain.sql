/*
  # RPC Functions for Advanced Roulette App

  1. Token Management Functions
    - update_user_tokens: Atomic token updates with transaction logging
    - daily_reset_tokens: Handle daily token resets
    - get_user_stats: Comprehensive user statistics

  2. Leaderboard Functions
    - refresh_leaderboard_cache: Update materialized leaderboard
    - get_leaderboard: Flexible leaderboard queries

  3. Analytics Functions
    - get_spin_analytics: Detailed spin statistics
    - get_course_performance: Course-specific performance metrics
*/

-- Function to atomically update user tokens with transaction logging
CREATE OR REPLACE FUNCTION update_user_tokens(
  p_user_id uuid,
  p_new_amount integer,
  p_transaction_type text DEFAULT 'manual',
  p_description text DEFAULT NULL,
  p_spin_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_balance integer;
  v_amount_change integer;
BEGIN
  -- Get current balance
  SELECT current_tokens INTO v_old_balance
  FROM users
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  v_amount_change := p_new_amount - v_old_balance;
  
  -- Update user balance and stats
  UPDATE users 
  SET 
    current_tokens = p_new_amount,
    highest_tokens = GREATEST(highest_tokens, p_new_amount),
    total_winnings = CASE 
      WHEN v_amount_change > 0 AND p_transaction_type IN ('payout', 'partial_payout') 
      THEN total_winnings + v_amount_change 
      ELSE total_winnings 
    END,
    total_spins = CASE 
      WHEN p_transaction_type IN ('bet', 'payout', 'partial_payout') 
      THEN total_spins + 1 
      ELSE total_spins 
    END,
    last_seen_at = now()
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    spin_id,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_transaction_type,
    v_amount_change,
    v_old_balance,
    p_new_amount,
    p_spin_id,
    p_description,
    p_metadata
  );
END;
$$;

-- Function for daily token reset
CREATE OR REPLACE FUNCTION daily_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset tokens for users below their daily minimum
  UPDATE users 
  SET 
    current_tokens = daily_reset_amount,
    last_reset_date = CURRENT_DATE
  WHERE 
    last_reset_date < CURRENT_DATE 
    AND current_tokens < daily_reset_amount;
    
  -- Log reset transactions
  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
  SELECT 
    id,
    'reset',
    daily_reset_amount - current_tokens,
    current_tokens,
    daily_reset_amount,
    'Daily token reset'
  FROM users 
  WHERE 
    last_reset_date < CURRENT_DATE 
    AND current_tokens < daily_reset_amount;
END;
$$;

-- Function to get comprehensive user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_id', u.id,
    'username', u.username,
    'current_tokens', u.current_tokens,
    'highest_tokens', u.highest_tokens,
    'total_spins', u.total_spins,
    'total_winnings', u.total_winnings,
    'ai_correctness_score', u.ai_correctness_score,
    'current_streak', u.current_streak,
    'best_streak', u.best_streak,
    'win_rate', CASE 
      WHEN COUNT(s.id) > 0 
      THEN ROUND((COUNT(CASE WHEN s.net_result > 0 THEN 1 END)::numeric / COUNT(s.id)) * 100, 2)
      ELSE 0 
    END,
    'average_bet', CASE 
      WHEN COUNT(s.id) > 0 
      THEN ROUND(AVG(s.total_bet), 2)
      ELSE 0 
    END,
    'biggest_win', COALESCE(MAX(s.total_payout), 0),
    'total_questions_answered', COUNT(sa.id),
    'questions_correct', COUNT(CASE WHEN sa.is_correct THEN 1 END),
    'favorite_course', (
      SELECT course 
      FROM spins 
      WHERE user_id = p_user_id AND prompt_id IS NOT NULL
      GROUP BY course 
      ORDER BY COUNT(*) DESC 
      LIMIT 1
    )
  ) INTO v_stats
  FROM users u
  LEFT JOIN spins s ON s.user_id = u.id
  LEFT JOIN spin_answers sa ON sa.user_id = u.id
  WHERE u.id = p_user_id
  GROUP BY u.id, u.username, u.current_tokens, u.highest_tokens, u.total_spins, 
           u.total_winnings, u.ai_correctness_score, u.current_streak, u.best_streak;
  
  RETURN v_stats;
END;
$$;

-- Function to refresh leaderboard cache
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache(
  p_timeframe text DEFAULT 'all_time',
  p_course_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_filter timestamptz;
BEGIN
  -- Determine date filter based on timeframe
  CASE p_timeframe
    WHEN 'daily' THEN v_date_filter := CURRENT_DATE;
    WHEN 'weekly' THEN v_date_filter := CURRENT_DATE - INTERVAL '7 days';
    WHEN 'monthly' THEN v_date_filter := CURRENT_DATE - INTERVAL '30 days';
    ELSE v_date_filter := '1900-01-01'::timestamptz;
  END CASE;
  
  -- Clear existing cache for this timeframe/course
  DELETE FROM leaderboard_cache 
  WHERE timeframe = p_timeframe 
    AND (p_course_id IS NULL OR course_id = p_course_id);
  
  -- Rebuild cache
  INSERT INTO leaderboard_cache (
    user_id, username, display_name, profile_avatar,
    current_tokens, highest_tokens, total_winnings,
    ai_correctness_score, current_streak, best_streak,
    total_spins, course_id, timeframe
  )
  SELECT 
    u.id, u.username, u.display_name, u.profile_avatar,
    u.current_tokens, u.highest_tokens, u.total_winnings,
    u.ai_correctness_score, u.current_streak, u.best_streak,
    u.total_spins, p_course_id, p_timeframe
  FROM users u
  WHERE u.created_at >= v_date_filter
  ORDER BY u.current_tokens DESC;
  
  -- Update rankings
  WITH ranked_users AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY current_tokens DESC) as token_rank,
      ROW_NUMBER() OVER (ORDER BY total_winnings DESC) as winnings_rank,
      ROW_NUMBER() OVER (ORDER BY ai_correctness_score DESC) as ai_rank
    FROM leaderboard_cache
    WHERE timeframe = p_timeframe 
      AND (p_course_id IS NULL OR course_id = p_course_id)
  )
  UPDATE leaderboard_cache lc
  SET 
    rank_by_tokens = ru.token_rank,
    rank_by_winnings = ru.winnings_rank,
    rank_by_ai_score = ru.ai_rank,
    updated_at = now()
  FROM ranked_users ru
  WHERE lc.id = ru.id;
END;
$$;

-- Function to get flexible leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_timeframe text DEFAULT 'all_time',
  p_course_id uuid DEFAULT NULL,
  p_ranking_type text DEFAULT 'tokens',
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  profile_avatar text,
  current_tokens integer,
  highest_tokens integer,
  total_winnings integer,
  ai_correctness_score numeric,
  current_streak integer,
  best_streak integer,
  total_spins integer,
  rank_position integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure cache is fresh
  PERFORM refresh_leaderboard_cache(p_timeframe, p_course_id);
  
  RETURN QUERY
  SELECT 
    lc.user_id,
    lc.username,
    lc.display_name,
    lc.profile_avatar,
    lc.current_tokens,
    lc.highest_tokens,
    lc.total_winnings,
    lc.ai_correctness_score,
    lc.current_streak,
    lc.best_streak,
    lc.total_spins,
    CASE p_ranking_type
      WHEN 'tokens' THEN lc.rank_by_tokens
      WHEN 'winnings' THEN lc.rank_by_winnings
      WHEN 'ai_score' THEN lc.rank_by_ai_score
      ELSE lc.rank_by_tokens
    END as rank_position
  FROM leaderboard_cache lc
  WHERE lc.timeframe = p_timeframe
    AND (p_course_id IS NULL OR lc.course_id = p_course_id)
  ORDER BY rank_position
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get detailed spin analytics
CREATE OR REPLACE FUNCTION get_spin_analytics(
  p_user_id uuid DEFAULT NULL,
  p_days_back integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_analytics jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_spins', COUNT(*),
    'total_bet', SUM(total_bet),
    'total_payout', SUM(total_payout),
    'net_result', SUM(net_result),
    'win_rate', ROUND((COUNT(CASE WHEN net_result > 0 THEN 1 END)::numeric / COUNT(*)) * 100, 2),
    'average_bet', ROUND(AVG(total_bet), 2),
    'biggest_win', MAX(total_payout),
    'biggest_loss', MIN(net_result),
    'favorite_numbers', (
      SELECT jsonb_agg(jsonb_build_object('number', result_number, 'count', cnt))
      FROM (
        SELECT result_number, COUNT(*) as cnt
        FROM spins
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
          AND created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
        GROUP BY result_number
        ORDER BY cnt DESC
        LIMIT 5
      ) top_numbers
    ),
    'daily_performance', (
      SELECT jsonb_agg(jsonb_build_object(
        'date', spin_date,
        'spins', spin_count,
        'net_result', daily_net
      ))
      FROM (
        SELECT 
          DATE(created_at) as spin_date,
          COUNT(*) as spin_count,
          SUM(net_result) as daily_net
        FROM spins
        WHERE (p_user_id IS NULL OR user_id = p_user_id)
          AND created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
        GROUP BY DATE(created_at)
        ORDER BY spin_date DESC
      ) daily_stats
    )
  ) INTO v_analytics
  FROM spins
  WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days_back;
  
  RETURN v_analytics;
END;
$$;