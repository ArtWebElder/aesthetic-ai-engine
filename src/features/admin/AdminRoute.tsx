import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Dev bypass: VITE_DEV_ADMIN=true skips role check
  const devAdmin = import.meta.env.VITE_DEV_ADMIN === 'true';

  useEffect(() => {
    if (devAdmin) {
      setLoading(false);
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setRole(data?.role ?? 'user');
        setLoading(false);
      })
      .catch(() => {
        setRole('user');
        setLoading(false);
      });
  }, [user, devAdmin]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#141417] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff713d] to-[#FF9B70] flex items-center justify-center animate-pulse">
            <span className="text-white font-extrabold text-lg">C</span>
          </div>
          <span className="text-white/40 text-sm font-medium">Verificando acesso...</span>
        </div>
      </div>
    );
  }

  if (!devAdmin && !user) return <Navigate to="/login" replace />;
  if (!devAdmin && role !== 'superadmin') return <Navigate to="/app/dashboard" replace />;

  return <>{children}</>;
}
