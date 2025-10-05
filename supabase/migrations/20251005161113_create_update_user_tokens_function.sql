/*
  # Create update_user_tokens function

  1. New Function
    - `update_user_tokens` - Updates user tokens and creates transaction record
    - Parameters:
      - p_user_id (uuid): User ID
      - p_new_amount (integer): New token amount
      - p_transaction_type (text): Type of transaction (bet, payout, reset, manual)
      - p_description (text): Transaction description
    - Returns: void
    
  2. Security
    - Function runs with invoker's privileges
    - Validates user exists before updating
*/

CREATE OR REPLACE FUNCTION update_user_tokens(
  p_user_id uuid,
  p_new_amount integer,
  p_transaction_type text,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
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

  -- Calculate amount change
  v_amount_change := p_new_amount - v_old_balance;

  -- Update user tokens
  UPDATE users
  SET 
    current_tokens = p_new_amount,
    highest_tokens = GREATEST(highest_tokens, p_new_amount),
    total_winnings = CASE 
      WHEN v_amount_change > 0 THEN total_winnings + v_amount_change
      ELSE total_winnings
    END,
    last_reset_date = CASE
      WHEN p_transaction_type = 'reset' THEN CURRENT_DATE
      ELSE last_reset_date
    END,
    last_seen_at = now()
  WHERE id = p_user_id;

  -- Create transaction record
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    p_user_id,
    p_transaction_type,
    v_amount_change,
    v_old_balance,
    p_new_amount,
    p_description
  );
END;
$$;
