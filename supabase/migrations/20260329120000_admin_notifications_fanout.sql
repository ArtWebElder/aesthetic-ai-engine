-- Migration: admin_notifications + user_notifications fan-out system
-- admin composes → trigger fans out to user_notifications per recipient filter

-- ╔══════════════════════════════════════════╗
-- ║  1. admin_notifications                  ║
-- ╚══════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'promo', 'update', 'billing')),
  recipients TEXT NOT NULL DEFAULT 'all' CHECK (recipients IN ('all', 'free', 'paid', 'specific')),
  specific_user_ids UUID[] DEFAULT '{}',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  send_email BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only service_role / superadmin can read/write
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_notifications' AND policyname = 'Service role manages admin_notifications'
  ) THEN
    CREATE POLICY "Service role manages admin_notifications"
      ON admin_notifications FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ╔══════════════════════════════════════════╗
-- ║  2. user_notifications                   ║
-- ╚══════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_notification_id UUID REFERENCES admin_notifications(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON user_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Users read own user_notifications'
  ) THEN
    CREATE POLICY "Users read own user_notifications"
      ON user_notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update (mark as read) their own notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Users update own user_notifications'
  ) THEN
    CREATE POLICY "Users update own user_notifications"
      ON user_notifications FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Service role can insert (fan-out trigger runs as definer)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'Service role inserts user_notifications'
  ) THEN
    CREATE POLICY "Service role inserts user_notifications"
      ON user_notifications FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ╔══════════════════════════════════════════╗
-- ║  3. Fan-out trigger                      ║
-- ╚══════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION fanout_admin_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.recipients = 'all' THEN
    INSERT INTO user_notifications (user_id, admin_notification_id, type, title, message, pinned, source)
    SELECT id, NEW.id, NEW.type, NEW.title, NEW.message, NEW.pinned, 'admin'
    FROM profiles;
  ELSIF NEW.recipients = 'free' THEN
    INSERT INTO user_notifications (user_id, admin_notification_id, type, title, message, pinned, source)
    SELECT id, NEW.id, NEW.type, NEW.title, NEW.message, NEW.pinned, 'admin'
    FROM profiles WHERE plan = 'free';
  ELSIF NEW.recipients = 'paid' THEN
    INSERT INTO user_notifications (user_id, admin_notification_id, type, title, message, pinned, source)
    SELECT id, NEW.id, NEW.type, NEW.title, NEW.message, NEW.pinned, 'admin'
    FROM profiles WHERE plan != 'free';
  ELSIF NEW.recipients = 'specific' THEN
    INSERT INTO user_notifications (user_id, admin_notification_id, type, title, message, pinned, source)
    SELECT unnest(NEW.specific_user_ids), NEW.id, NEW.type, NEW.title, NEW.message, NEW.pinned, 'admin';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fanout_admin_notification ON admin_notifications;
CREATE TRIGGER trg_fanout_admin_notification
  AFTER INSERT ON admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION fanout_admin_notification();

-- Enable realtime for user_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
