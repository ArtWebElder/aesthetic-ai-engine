-- Subscription system columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_renews_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_credits INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_credits INTEGER DEFAULT 0;

-- Migrate existing credits to bonus_credits (they were purchased, not plan-based)
UPDATE profiles SET bonus_credits = credits WHERE credits > 0 AND bonus_credits = 0;

-- Update debit_credits_atomic to debit plan_credits first, then bonus_credits
CREATE OR REPLACE FUNCTION debit_credits_atomic(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
DECLARE
  v_plan INTEGER;
  v_bonus INTEGER;
  v_total INTEGER;
  v_from_plan INTEGER;
  v_from_bonus INTEGER;
BEGIN
  SELECT plan_credits, bonus_credits INTO v_plan, v_bonus
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_total := COALESCE(v_plan, 0) + COALESCE(v_bonus, 0);

  IF v_total < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Debit from plan_credits first
  v_from_plan := LEAST(COALESCE(v_plan, 0), p_amount);
  v_from_bonus := p_amount - v_from_plan;

  UPDATE profiles
  SET plan_credits = COALESCE(plan_credits, 0) - v_from_plan,
      bonus_credits = COALESCE(bonus_credits, 0) - v_from_bonus,
      credits = COALESCE(plan_credits, 0) - v_from_plan + COALESCE(bonus_credits, 0) - v_from_bonus
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
