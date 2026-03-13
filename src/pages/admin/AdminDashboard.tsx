import { useEffect, useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { adminService } from '@/services/adminService';
import { TrendingUp, Users, Image, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface OverviewStats {
  mrr: number;
  activeUsers: number;
  gensToday: number;
  errorRate: number;
}

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

const CHART_STYLE = {
  fontSize: 11,
  fill: '#8e8e96',
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats>({ mrr: 8400, activeUsers: 127, gensToday: 379, errorRate: 2.1 });
  const [mrrData, setMrrData] = useState<{ month: string; mrr: number }[]>([]);
  const [featureData, setFeatureData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [dailyData, setDailyData] = useState<{ day: string; count: number }[]>([]);
  const [logs, setLogs] = useState<typeof import('@/services/adminService').MOCK_LOGS>([]);

  useEffect(() => {
    Promise.all([
      adminService.getOverviewStats(),
      adminService.getMRRHistory(),
      adminService.getFeatureUsage(),
      adminService.getDailyGens(),
      adminService.getGenerationLogs(),
    ]).then(([s, mrr, feat, daily, { logs }]) => {
      setStats(s);
      setMrrData(mrr);
      setFeatureData(feat);
      setDailyData(daily);
      setLogs(logs.slice(0, 5));
      setTimeout(() => setLoading(false), 600);
    });
  }, []);

  if (loading) {
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
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <KPICard icon={TrendingUp} label="MRR" numericValue={stats.mrr} prefix="R$ " change="+12.5% este mês" positive />
        <KPICard icon={Users} label="Usuários Ativos" numericValue={stats.activeUsers} change="+8 esta semana" positive />
        <KPICard icon={Image} label="Gerações Hoje" numericValue={stats.gensToday} change="+15% vs ontem" positive />
        <KPICard icon={AlertTriangle} label="Taxa de Erro" numericValue={Math.round(stats.errorRate * 10)} suffix="%" decimals={1} change="-0.3% vs ontem" positive />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
        {/* MRR Area Chart */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#141417', marginBottom: 14 }}>Receita Mensal (MRR)</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={mrrData}>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: '#141417', marginBottom: 10 }}>Features mais usadas</div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={featureData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3} strokeWidth={0}>
                {featureData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            {featureData.map((f) => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, color: '#5a5a60' }}>{f.name}</span>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 500, color: '#141417' }}>{f.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#141417', marginBottom: 14 }}>Gerações por dia</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData}>
              <XAxis dataKey="day" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#ff713d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latest generations table */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(20,20,23,0.06)', fontSize: 13, fontWeight: 600, color: '#141417' }}>Últimas gerações</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Usuário', 'Feature', 'Status', 'Créditos', 'Duração', 'Hora'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ transition: 'background 100ms' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(20,20,23,0.015)'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
              >
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(20,20,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#5a5a60' }}>
                      {log.userName.charAt(0)}
                    </div>
                    <span style={{ color: '#5a5a60', fontSize: 12 }}>{log.userName}</span>
                  </div>
                </td>
                <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, background: 'rgba(255,113,61,0.08)', color: '#ff713d', fontSize: 10.5, fontWeight: 600 }}>{log.feature}</span></td>
                <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: log.status === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: log.status === 'success' ? '#10B981' : '#EF4444' }}>{log.status === 'success' ? 'Sucesso' : 'Erro'}</span></td>
                <td style={{ ...tdStyle, color: '#8e8e96', fontSize: 12 }}>{log.credits > 0 ? log.credits : '—'}</td>
                <td style={{ ...tdStyle, color: '#8e8e96', fontSize: 12 }}>{log.duration}</td>
                <td style={{ ...tdStyle, color: '#b5b5bb', fontSize: 12 }}>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
