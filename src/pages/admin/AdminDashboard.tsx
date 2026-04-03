import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService, type DashboardKPIs } from '@/services/adminService';
import { TrendingUp, Users, Image, DollarSign, UserPlus, Zap, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

function KPICard({ icon: Icon, label, value, prefix = '', suffix = '', color = '#ff713d' }: {
  icon: React.ElementType; label: string; value: number; prefix?: string; suffix?: string; color?: string;
}) {
  const animated = useAnimatedCounter(value);
  return (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span style={{ fontSize: 12, color: '#71717a', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#fafafa' }}>
        {prefix}{animated.toLocaleString('pt-BR')}{suffix}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenue, setRevenue] = useState<Array<{ date: string; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [k, r] = await Promise.all([
        adminService.fetchDashboardKPIs(),
        adminService.fetchRevenueByPeriod(30),
      ]);
      setKpis(k);
      setRevenue(r);
    } catch (e) {
      setError(String((e as Error)?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton style={{ height: 32, width: 200 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} style={{ height: 100, borderRadius: 12 }} />)}
        </div>
        <Skeleton style={{ height: 200, borderRadius: 12 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: '#ef4444' }}>
        <p>Erro ao carregar dashboard: {error}</p>
        <button onClick={loadData} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: '#27272a', color: '#fafafa', border: 'none', cursor: 'pointer' }}>Tentar novamente</button>
      </div>
    );
  }

  if (!kpis) return null;

  const planData = [
    { name: 'Free', value: kpis.totalFree, color: '#71717a' },
    { name: 'Pro', value: kpis.totalPro, color: '#ff713d' },
    { name: 'Team', value: kpis.totalTeam, color: '#7c3aed' },
  ];
  const planTotal = kpis.totalUsers || 1;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa' }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#71717a' }}>Visão geral do Creatyng</p>
        </div>
        <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#27272a', border: '1px solid #3f3f46', color: '#a1a1aa', fontSize: 12, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <KPICard icon={Users} label="Total Usuários" value={kpis.totalUsers} />
        <KPICard icon={UserPlus} label="Novos (7d)" value={kpis.newUsersWeek} color="#10b981" />
        <KPICard icon={Zap} label="Ativos (7d)" value={kpis.activeUsersWeek} color="#3b82f6" />
        <KPICard icon={Image} label="Gerações" value={kpis.totalGenerations} color="#8b5cf6" />
        <KPICard icon={DollarSign} label="Receita Total" value={kpis.totalRevenue} prefix="R$ " color="#10b981" />
        <KPICard icon={TrendingUp} label="MRR" value={Math.round(kpis.mrr)} prefix="R$ " color="#ff713d" />
        <KPICard icon={Zap} label="Créditos Consumidos" value={kpis.totalCreditsConsumed} color="#f59e0b" />
        <KPICard icon={UserPlus} label="Novos Hoje" value={kpis.newUsersToday} color="#ec4899" />
      </div>

      {/* Plan Distribution Bar */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 12 }}>Distribuição de Planos</h3>
        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 }}>
          {planData.map(p => (
            <div key={p.name} style={{ width: `${(p.value / planTotal) * 100}%`, background: p.color, minWidth: p.value > 0 ? 4 : 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          {planData.map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#a1a1aa' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
              {p.name}: {p.value} ({Math.round((p.value / planTotal) * 100)}%)
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Chart (last 30 days) */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 12 }}>Receita (últimos 30 dias)</h3>
        {revenue.length === 0 ? (
          <p style={{ fontSize: 13, color: '#52525b', textAlign: 'center', padding: 32 }}>Sem dados de receita ainda</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue}>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: 8, color: '#fafafa', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#ff713d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
