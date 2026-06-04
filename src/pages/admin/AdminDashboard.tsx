import { useEffect, useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { adminService, type DashboardKPIs } from '@/services/adminService';
import { TrendingUp, Users, Image, AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { useI18n } from '@/i18n';

interface KPICardProps {
  icon: React.ElementType;
  label: string;
  numericValue: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change: string;
  positive: boolean;
}

function KPICard({ icon: Icon, label, numericValue, prefix = '', suffix = '', decimals = 0, change, positive }: KPICardProps) {
  const animated = useAnimatedCounter(numericValue);
  const display = decimals > 0
    ? (animated / Math.pow(10, decimals)).toFixed(decimals)
    : animated.toLocaleString('pt-BR');

  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#8e8e96', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(20,20,23,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 15, height: 15, color: '#8e8e96' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#141417', lineHeight: 1 }}>{prefix}{display}{suffix}</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: positive ? '#10B981' : '#EF4444' }}>{change}</span>
      </div>
    </div>
  );
}

const CHART_STYLE = { fontSize: 11, fill: '#8e8e96' };

export default function AdminDashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenueData, setRevenueData] = useState<{ month: string; mrr: number }[]>([]);
  const [recentGens, setRecentGens] = useState<Array<Record<string, unknown>>>([]);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [k, rev, gens] = await Promise.all([
        adminService.fetchDashboardKPIs(),
        adminService.fetchRevenueByPeriod(180),
        adminService.fetchGenerations(1, 5),
      ]);
      setKpis(k);
      setRevenueData(rev.map(r => ({ month: r.date, mrr: r.revenue })));
      setRecentGens(gens.generations as unknown as Array<Record<string, unknown>>);
    } catch (e) {
      console.error('[AdminDashboard] load failed:', e);
    }
    setTimeout(() => setLoading(false), 400);
  }

  useEffect(() => { loadData(); }, []);

  if (loading || !kpis) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => <Skeleton key={i} height="88px" rounded className="rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Skeleton height="220px" rounded className="lg:col-span-2 rounded-xl" />
          <Skeleton height="220px" rounded className="rounded-xl" />
          <Skeleton height="220px" rounded className="rounded-xl" />
        </div>
        <Skeleton height="240px" rounded className="rounded-xl" />
      </div>
    );
  }

  const tooltipStyle = { background: '#ffffff', border: '1px solid rgba(20,20,23,0.08)', borderRadius: 8, color: '#141417', fontSize: 12, boxShadow: '0 4px 16px rgba(20,20,23,0.08)' };
  const cardStyle = { background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' };
  const thStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#8e8e96', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid rgba(20,20,23,0.06)' };
  const tdStyle: React.CSSProperties = { padding: '11px 20px', fontSize: 13, color: '#141417', borderBottom: '1px solid rgba(20,20,23,0.04)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(20,20,23,0.08)', background: '#ffffff', color: '#8e8e96', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={12} /> {t('admin.refresh')}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14 }}>
        <KPICard icon={TrendingUp} label={t('admin.stats.mrr')} numericValue={Math.round(kpis.mrr)} prefix="R$ " change={t('admin.dash.subscribers', { n: kpis.totalPro + kpis.totalTeam })} positive />
        <KPICard icon={Users} label={t('admin.stats.activeUsers')} numericValue={kpis.activeUsersWeek} change={t('admin.dash.this_week', { n: kpis.newUsersWeek })} positive />
        <KPICard icon={Image} label={t('admin.dash.total_gens')} numericValue={kpis.totalGenerations} change={t('admin.dash.today', { n: kpis.newUsersToday })} positive />
        <KPICard icon={AlertTriangle} label={t('admin.dash.total_users')} numericValue={kpis.totalUsers} change={t('admin.dash.free_count', { n: kpis.totalFree })} positive />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: 14 }}>
        {/* MRR Area Chart */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#141417', marginBottom: 14 }}>{t('admin.dash.mrr_chart')}</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueData.length > 0 ? revenueData : [{ month: '—', mrr: 0 }]}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff713d" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ff713d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'MRR']} />
              <Area type="monotone" dataKey="mrr" stroke="#ff713d" fill="url(#mrrGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#141417', marginBottom: 10 }}>{t('admin.dash.plan_distribution')}</div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={[
                { name: 'Free', value: kpis.totalFree || 1, color: '#8e8e96' },
                { name: 'Pro', value: kpis.totalPro || 0, color: '#ff713d' },
                { name: 'Team', value: kpis.totalTeam || 0, color: '#7c3aed' },
              ]} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3} strokeWidth={0}>
                <Cell fill="#8e8e96" />
                <Cell fill="#ff713d" />
                <Cell fill="#7c3aed" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {[
              { name: 'Free', value: kpis.totalFree, color: '#8e8e96' },
              { name: 'Pro', value: kpis.totalPro, color: '#ff713d' },
              { name: 'Team', value: kpis.totalTeam, color: '#7c3aed' },
            ].map((f) => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, color: '#5a5a60' }}>{f.name}</span>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 500, color: '#141417' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#141417', marginBottom: 14 }}>{t('admin.dash.credits_consumed')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#ff713d' }}>{kpis.totalCreditsConsumed.toLocaleString('pt-BR')}</span>
            <span style={{ fontSize: 11, color: '#8e8e96', marginTop: 4 }}>{t('admin.dash.credits_used')}</span>
            <span style={{ fontSize: 11, color: '#10B981', marginTop: 8 }}>{t('admin.dash.total_revenue', { v: kpis.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) })}</span>
          </div>
        </div>
      </div>

      {/* Latest generations table */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, overflow: 'hidden', overflowX: 'auto', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(20,20,23,0.06)', fontSize: 13, fontWeight: 600, color: '#141417' }}>{t('admin.dash.latest_gens')}</div>
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse' }}>
          <thead><tr>
            {[t('admin.generations.col.user'), t('admin.generations.col.provider'), t('admin.generations.col.status'), t('admin.generations.col.credits'), t('admin.generations.col.duration'), t('admin.col.date')].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {recentGens.length === 0 ? (
              <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#8e8e96' }}>{t('admin.dash.no_gens')}</td></tr>
            ) : recentGens.map((g, i) => (
              <tr key={i} style={{ transition: 'background 100ms' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(20,20,23,0.015)'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
              >
                <td style={tdStyle}>
                  <span style={{ color: '#5a5a60', fontSize: 12 }}>{(g.user_email as string) || (g.user_id as string)?.slice(0, 8) || '—'}</span>
                </td>
                <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, background: 'rgba(14,165,233,0.08)', color: '#0EA5E9', fontSize: 10.5, fontWeight: 600 }}>{(g.provider as string) || '—'}</span></td>
                <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: g.status === 'success' || g.status === 'completed' ? 'rgba(16,185,129,0.08)' : g.status === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', color: g.status === 'success' || g.status === 'completed' ? '#10B981' : g.status === 'error' ? '#EF4444' : '#F59E0B' }}>{g.status === 'success' || g.status === 'completed' ? t('admin.status.success') : g.status === 'error' ? t('admin.status.error') : (g.status as string)}</span></td>
                <td style={{ ...tdStyle, color: '#8e8e96', fontSize: 12 }}>{(g.credits_used as number) || '—'}</td>
                <td style={{ ...tdStyle, color: '#8e8e96', fontSize: 12 }}>{(g.duration_ms as number) ? `${((g.duration_ms as number) / 1000).toFixed(1)}s` : '—'}</td>
                <td style={{ ...tdStyle, color: '#b5b5bb', fontSize: 12 }}>{g.created_at ? new Date(g.created_at as string).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
