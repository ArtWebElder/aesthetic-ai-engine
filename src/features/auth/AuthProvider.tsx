import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';

interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  onboarded: boolean | null;
  emailVerified: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  markOnboarded: () => void;
}

const AuthCtx = createContext<AuthContext | null>(null);

/**
 * Ensure a profiles row exists for the user (upsert on first login).
 * Gives 50 free credits to new accounts.
 * Returns { onboarded } so the app can redirect new users.
 */
async function ensureProfile(user: User): Promise<{ onboarded: boolean }> {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, onboarded')
      .eq('id', user.id)
      .single();

    if (existing) return { onboarded: existing.onboarded !== false };

    const name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User';

    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      name,
      credits: 50,
      plan: 'free',
      onboarded: false,
      role: 'user',
    });

    console.log('[Auth] created profile for', user.email, '(50 free credits)');

    // Send welcome email (fire and forget)
    if (user.email) {
      supabase.functions.invoke('send-email', {
        body: {
          to: user.email,
          template: 'welcome',
          data: { name },
        },
      }).catch((err) => console.warn('[Auth] welcome email failed:', err));
    }

    return { onboarded: false };
  } catch (err) {
    // Non-blocking: profile creation failure shouldn't block the app
    console.warn('[Auth] ensureProfile failed:', err);
    return { onboarded: true }; // assume onboarded on error to not block
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const profileCheckedRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && profileCheckedRef.current !== session.user.id) {
        profileCheckedRef.current = session.user.id;
        ensureProfile(session.user).then(({ onboarded }) => setOnboarded(onboarded));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Recovery link processed → always send the user to set a new password,
      // regardless of which URL the email link landed on.
      if (event === 'PASSWORD_RECOVERY' && !window.location.pathname.startsWith('/reset-password')) {
        window.location.replace('/reset-password');
        return;
      }

      // Create profile on sign-in if it doesn't exist
      if (event === 'SIGNED_IN' && session?.user && profileCheckedRef.current !== session.user.id) {
        profileCheckedRef.current = session.user.id;
        ensureProfile(session.user).then(({ onboarded }) => setOnboarded(onboarded));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app/dashboard` },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return { error };
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const signOut = async () => {
    profileCheckedRef.current = null;
    setOnboarded(null);
    await supabase.auth.signOut();
  };

  const markOnboarded = () => setOnboarded(true);

  // Google OAuth users always have confirmed email; email/password users need confirmation
  const isGoogleUser = user?.app_metadata?.provider === 'google';
  const emailVerified = !user || isGoogleUser || !!user.email_confirmed_at;

  return (
    <AuthCtx.Provider value={{ user, session, loading, onboarded, emailVerified, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPasswordForEmail, updatePassword, signOut, markOnboarded }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
