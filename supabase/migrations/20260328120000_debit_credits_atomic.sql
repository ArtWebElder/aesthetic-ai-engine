-- RPC: debit_credits_atomic
-- Debita créditos de forma atômica (transacional). Falha se saldo insuficiente.

CREATE OR REPLACE FUNCTION debit_credits_atomic(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
