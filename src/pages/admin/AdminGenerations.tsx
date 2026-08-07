import { useEffect, useState } from 'react';
import { adminService, type AdminGeneration } from '@/services/adminService';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { useI18n } from '@/i18n';

type Log = AdminGeneration & { userName?: string; feature?: string; tokens?: number; duration?: string; time?: string };

const FEATURE_STYLES: Record<string, React.CSSProperties> = {
  'Ecom Banner': { background: 'hsl(var(--brand) / 0.08)', color: 'hsl(var(--brand))' },
  'Social Post': { background: 'rgba(99,102,241,0.08)', color: '#6366f1' },
  'Photoshoot': { background: 'rgba(245,158,11,0.08)', color: '#F59E0B' },
};

const PROVIDER_STYLES: Record<string, React.CSSProperties> = {
  'Gemini Pro': { background: 'rgba(96,165,250,0.08)', color: '#60a5fa' },
  'Gemini Flash': { background: 'rgba(14,165,233,0.08)', color: '#0EA5E9' },
  'Replicate': { background: 'rgba(192,132,252,0.08)', color: '#c084fc' },
};

const thStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid hsl(var(--border))' };
const tdStyle: React.CSSProperties = { padding: '10px 16px', fontSize: 12, color: 'hsl(var(--foreground))', borderBottom: '1px solid hsl(var(--muted))' };

export default function AdminGenerations() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    adminService.fetchGenerations(1, 50).then(({ generations, total }) => {
      setLogs(generations.map(g => ({
        ...g,
        userName: g.user_email || g.user_id?.slice(0, 8) || '—',
        feature: g.provider || '—',
        tokens: 0,
        duration: g.duration_ms ? `${(g.duration_ms / 1000).toFixed(1)}s` : '—',
        time: g.created_at ? new Date(g.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
        status: g.status === 'completed' ? 'success' : g.status,
      })));
      setTotal(total);
      setTimeout(() => setLoading(false), 400);
    });
  }, []);

  const filtered = logs.filter((l) => statusFilter === 'all' || l.status === statusFilter);
  const successCount = logs.filter((l) => l.status === 'success').length;
  const errorCount = logs.filter((l) => l.status === 'error').length;
  const avgDurationRaw = logs
    .filter((l) => l.duration !== '—')
    .map((l) => parseFloat(l.duration))
    .reduce((a, b, _, arr) => a + b / arr.length, 0);

  const totalCount = useAnimatedCounter(total);
  const successPct = useAnimatedCounter(logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map((i) => <Skeleton key={i} height="80px" rounded className="rounded-xl" />)}
        </div>
        <Skeleton height="40px" rounded className="rounded-lg w-64" />
        <Skeleton height="400px" rounded className="rounded-xl" />
      </div>
    );
  }

  const kpiCard: React.CSSProperties = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-sm)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14 }}>
        <div style={kpiCard}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock style={{ width: 16, height: 16, color: 'hsl(var(--muted-foreground))' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('admin.generations.total_today')}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>{totalCount.toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div style={kpiCard}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(16,185,129,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: '#10B981' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('admin.generations.success_pct')}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>{successPct}%</p>
          </div>
        </div>
        <div style={kpiCard}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle style={{ width: 16, height: 16, color: '#6366f1' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{t('admin.generations.avg_duration')}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>{avgDurationRaw.toFixed(1)}s</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {(['all', 'success', 'error'] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
            background: statusFilter === f ? '#FFF0EA' : 'transparent',
            border: statusFilter === f ? '1px solid hsl(var(--brand) / 0.2)' : '1px solid transparent',
            color: statusFilter === f ? 'hsl(var(--brand))' : '#8e8e96',
          }}>
            {f === 'all' ? `${t('admin.generations.filter.all')} (${logs.length})` : f === 'success' ? `${t('admin.generations.filter.success')} (${successCount})` : `${t('admin.generations.filter.error')} (${errorCount})`}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 14, overflow: 'hidden', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
          <thead><tr>
            {[t('admin.generations.col.id'), t('admin.generations.col.user'), t('admin.generations.col.feature'), t('admin.generations.col.status'), t('admin.generations.col.credits'), t('admin.generations.col.tokens'), t('admin.generations.col.provider'), t('admin.generations.col.duration'), t('admin.generations.col.time')].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} style={{ transition: 'background 100ms' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'hsl(var(--muted))'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
              >
                <td style={{ ...tdStyle, color: '#b5b5bb', fontFamily: 'monospace', fontSize: 10 }}>{log.id}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#5a5a60' }}>{log.userName.charAt(0)}</div>
                    <span style={{ color: '#5a5a60', fontSize: 12 }}>{log.userName}</span>
                  </div>
                </td>
                <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, ...(FEATURE_STYLES[log.feature] ?? { background: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }) }}>{log.feature}</span></td>
                <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: log.status === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: log.status === 'success' ? '#10B981' : '#EF4444' }}>{log.status === 'success' ? t('admin.status.success') : t('admin.status.error')}</span></td>
                <td style={{ ...tdStyle, color: 'hsl(var(--muted-foreground))' }}>{log.credits > 0 ? log.credits : '—'}</td>
                <td style={{ ...tdStyle, color: 'hsl(var(--muted-foreground))' }}>{log.tokens > 0 ? log.tokens.toLocaleString() : '—'}</td>
                <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, ...(PROVIDER_STYLES[log.provider] ?? { background: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }) }}>{log.provider}</span></td>
                <td style={{ ...tdStyle, color: 'hsl(var(--muted-foreground))' }}>{log.duration}</td>
                <td style={{ ...tdStyle, color: '#b5b5bb', fontSize: 11 }}>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
