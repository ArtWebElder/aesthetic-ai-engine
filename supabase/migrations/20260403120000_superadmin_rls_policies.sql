-- ============================================================================
-- Superadmin RLS policies
-- Allows users with role='superadmin' in profiles to read/manage all data
-- needed by the admin panel.
-- ============================================================================

-- Helper function: returns true if the current authenticated user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'superadmin'
  );
$$;

-- ============================================================================
-- PROFILES — ensure RLS is on + superadmin can see all + users see own
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can read own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can update their own profile
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can insert their own profile (for ensureProfile on first login)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Superadmin can read ALL profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin reads all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Superadmin reads all profiles"
      ON public.profiles FOR SELECT
      USING (public.is_superadmin());
  END IF;
END $$;

-- Superadmin can update ALL profiles (change plan, role, credits)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin updates all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Superadmin updates all profiles"
      ON public.profiles FOR UPDATE
      USING (public.is_superadmin());
  END IF;
END $$;

-- ============================================================================
-- CREDIT_HISTORY — superadmin can read all + insert
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin reads all credit_history' AND tablename = 'credit_history') THEN
    CREATE POLICY "Superadmin reads all credit_history"
      ON public.credit_history FOR SELECT
      USING (public.is_superadmin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin inserts credit_history' AND tablename = 'credit_history') THEN
    CREATE POLICY "Superadmin inserts credit_history"
      ON public.credit_history FOR INSERT
      WITH CHECK (public.is_superadmin());
  END IF;
END $$;

-- ============================================================================
-- PAYMENTS — superadmin can read all
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin reads all payments' AND tablename = 'payments') THEN
    CREATE POLICY "Superadmin reads all payments"
      ON public.payments FOR SELECT
      USING (public.is_superadmin());
  END IF;
END $$;

-- ============================================================================
-- GENERATIONS — enable RLS + policies
-- ============================================================================
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Users can read their own generations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own generations' AND tablename = 'generations') THEN
    CREATE POLICY "Users can read own generations"
      ON public.generations FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can insert their own generations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own generations' AND tablename = 'generations') THEN
    CREATE POLICY "Users can insert own generations"
      ON public.generations FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Superadmin can read ALL generations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin reads all generations' AND tablename = 'generations') THEN
    CREATE POLICY "Superadmin reads all generations"
      ON public.generations FOR SELECT
      USING (public.is_superadmin());
  END IF;
END $$;

-- ============================================================================
-- ADMIN_NOTIFICATIONS — superadmin can manage (read + insert + update + delete)
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin manages admin_notifications' AND tablename = 'admin_notifications') THEN
    CREATE POLICY "Superadmin manages admin_notifications"
      ON public.admin_notifications FOR ALL
      USING (public.is_superadmin())
      WITH CHECK (public.is_superadmin());
  END IF;
END $$;

-- ============================================================================
-- NOTIFICATIONS — superadmin can manage
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmin manages notifications' AND tablename = 'notifications') THEN
    CREATE POLICY "Superadmin manages notifications"
      ON public.notifications FOR ALL
      USING (public.is_superadmin())
      WITH CHECK (public.is_superadmin());
  END IF;
END $$;
