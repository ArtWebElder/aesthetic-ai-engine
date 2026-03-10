import { useEffect, useState } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { adminService } from '@/services/adminService';
import { TrendingUp, Users, Image, AlertTriangle } from 'lucide-react';

interface OverviewStats {
  mrr: number;
  activeUsers: number;
  gensToday: number;
  errorRate: number;
}

interface KPICardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

function KPICard({ icon: Icon, label, value, change, positive }: KPICardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
          <Icon className="h-4 w-4 text-white/40" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className={`text-xs font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

const CHART_STYLE = {
  fontSize: 11,
  fill: 'rgba(255,255,255,0.3)',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<OverviewStats>({ mrr: 8400, activeUsers: 127, gensToday: 379, errorRate: 2.1 });
  const [mrrData, setMrrData] = useState<{ month: string; mrr: number }[]>([]);
  const [featureData, setFeatureData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [dailyData, setDailyData] = useState<{ day: string; count: number }[]>([]);
  const [logs, setLogs] = useState<typeof import('@/services/adminService').MOCK_LOGS>([]);

  useEffect(() => {
    adminService.getOverviewStats().then(setStats);
    adminService.getMRRHistory().then(setMrrData);
    adminService.getFeatureUsage().then(setFeatureData);
    adminService.getDailyGens().then(setDailyData);
    adminService.getGenerationLogs().then(({ logs }) => setLogs(logs.slice(0, 5)));
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={TrendingUp}
          label="MRR"
          value={`R$ ${stats.mrr.toLocaleString('pt-BR')}`}
          change="+12.5% este mês"
          positive
        />
        <KPICard
          icon={Users}
          label="Usuários Ativos"
          value={String(stats.activeUsers)}
          change="+8 esta semana"
          positive
        />
        <KPICard
          icon={Image}
          label="Gerações Hoje"
          value={String(stats.gensToday)}
          change="+15% vs ontem"
          positive
        />
        <KPICard
          icon={AlertTriangle}
          label="Taxa de Erro"
          value={`${stats.errorRate}%`}
          change="-0.3% vs ontem"
          positive
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* MRR Area Chart — 50% width = 2/4 */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Receita Mensal (MRR)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff713d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff713d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff' }}
                formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'MRR']}
              />
              <Area type="monotone" dataKey="mrr" stroke="#ff713d" fill="url(#mrrGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — 25% = 1/4 */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Features mais usadas</h3>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={featureData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3}>
                {featureData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff' }}
                formatter={(v: number) => [`${v}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {featureData.map((f) => (
              <div key={f.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
                  <span className="text-white/40 text-[10px]">{f.name}</span>
                </div>
                <span className="text-white/60 text-[10px] font-medium">{f.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart — 25% = 1/4 */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">Gerações por dia</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData}>
              <XAxis dataKey="day" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff' }}
              />
              <Bar dataKey="count" fill="#818cf8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latest generations table */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Últimas gerações</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Usuário', 'Feature', 'Status', 'Créditos', 'Duração', 'Hora'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-white/30 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60 font-semibold">
                      {log.userName.charAt(0)}
                    </div>
                    <span className="text-white/70 text-xs">{log.userName}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-[#ff713d]/10 text-[#ff713d] text-[10px] font-medium">{log.feature}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    log.status === 'success' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                  }`}>{log.status === 'success' ? 'Sucesso' : 'Erro'}</span>
                </td>
                <td className="px-5 py-3 text-white/50 text-xs">{log.credits > 0 ? log.credits : '—'}</td>
                <td className="px-5 py-3 text-white/50 text-xs">{log.duration}</td>
                <td className="px-5 py-3 text-white/30 text-xs">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
