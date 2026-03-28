-- Migration: credit_history, payments, notifications, notification_reads
-- Uses IF NOT EXISTS because tables may already exist in remote (created via SQL Editor).

-- ╔══════════════════════════════════════════╗
-- ║  1. credit_history                       ║
-- ╚══════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS credit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'debit', 'bonus', 'refund')),
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_created_at ON credit_history(created_at DESC);

ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'credit_history' AND policyname = 'Users can view own credit history'
  ) THEN
    CREATE POLICY "Users can view own credit history"
      ON credit_history FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'credit_history' AND policyname = 'Service role can insert credit history'
  ) THEN
    CREATE POLICY "Service role can insert credit history"
      ON credit_history FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ╔══════════════════════════════════════════╗
-- ║  2. payments                             ║
-- ╚══════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'asaas')),
  external_id TEXT,
  amount_cents INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view own payments'
  ) THEN
    CREATE POLICY "Users can view own payments"
      ON payments FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Service role can manage payments'
  ) THEN
    CREATE POLICY "Service role can manage payments"
      ON payments FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ╔══════════════════════════════════════════╗
-- ║  3. notifications                        ║
-- ╚══════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'promo')),
  target TEXT NOT NULL DEFAULT 'all' CHECK (target IN ('all', 'free', 'pro', 'team')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_active ON notifications(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Anyone can read active notifications'
  ) THEN
    CREATE POLICY "Anyone can read active notifications"
      ON notifications FOR SELECT
      USING (active = true AND (expires_at IS NULL OR expires_at > now()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service role can manage notifications'
  ) THEN
    CREATE POLICY "Service role can manage notifications"
      ON notifications FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ╔══════════════════════════════════════════╗
-- ║  4. notification_reads                   ║
-- ╚══════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON notification_reads(user_id);

ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_reads' AND policyname = 'Users can view own reads'
  ) THEN
    CREATE POLICY "Users can view own reads"
      ON notification_reads FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_reads' AND policyname = 'Users can mark as read'
  ) THEN
    CREATE POLICY "Users can mark as read"
      ON notification_reads FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
