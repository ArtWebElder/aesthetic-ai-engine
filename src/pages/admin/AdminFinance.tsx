import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { adminService, MOCK_TRANSACTIONS } from '@/services/adminService';
import { TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface FinanceStats {
  mrr: number;
  churnRate: number;
  conversionRate: number;
}

const CHART_STYLE = { fontSize: 11, fill: 'rgba(255,255,255,0.3)' };

const TX_TYPE_COLORS: Record<string, string> = {
  subscription: 'bg-emerald-400/10 text-emerald-400',
  recharge: 'bg-indigo-400/10 text-indigo-400',
  refund: 'bg-red-400/10 text-red-400',
};
const TX_TYPE_LABELS: Record<string, string> = {
  subscription: 'Assinatura',
  recharge: 'Recarga',
  refund: 'Reembolso',
};

export default function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinanceStats>({ mrr: 8400, churnRate: 3.2, conversionRate: 12.5 });
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [transactions] = useState(MOCK_TRANSACTIONS);

  const mrrCount = useAnimatedCounter(stats.mrr);
  const churnCount = useAnimatedCounter(Math.round(stats.churnRate * 10));
  const convCount = useAnimatedCounter(Math.round(stats.conversionRate * 10));

  useEffect(() => {
    Promise.all([
      adminService.getFinanceStats(),
      adminService.getRevenueHistory(),
    ]).then(([s, rev]) => {
      setStats(s);
      setRevenue(rev);
      setTimeout(() => setLoading(false), 600);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map((i) => <Skeleton key={i} height="96px" rounded className="rounded-xl" />)}
        </div>
        <Skeleton height="260px" rounded className="rounded-xl" />
        <Skeleton height="280px" rounded className="rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">MRR</span>
            <TrendingUp className="h-4 w-4 text-emerald-400/60" />
          </div>
          <span className="text-2xl font-bold text-white">R$ {mrrCount.toLocaleString('pt-BR')}</span>
          <span className="text-xs text-emerald-400">+12.5% este mês</span>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Churn Rate</span>
            <TrendingDown className="h-4 w-4 text-red-400/60" />
          </div>
          <span className="text-2xl font-bold text-white">{(churnCount / 10).toFixed(1)}%</span>
          <span className="text-xs text-red-400">+0.4% vs mês anterior</span>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Conversão Free→Pro</span>
            <Percent className="h-4 w-4 text-indigo-400/60" />
          </div>
          <span className="text-2xl font-bold text-white">{(convCount / 10).toFixed(1)}%</span>
          <span className="text-xs text-emerald-400">+2.1% vs mês anterior</span>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-5">Evolução da Receita (12 meses)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenue}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff713d" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ff713d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={CHART_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff' }}
              formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#ff713d" fill="url(#revGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Últimas transações</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Usuário', 'Tipo', 'Valor', 'Data'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-white/30 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-white/70 text-xs">{tx.user}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TX_TYPE_COLORS[tx.type]}`}>
                    {TX_TYPE_LABELS[tx.type]}
                  </span>
                </td>
                <td className={`px-5 py-3 text-xs font-medium ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {tx.amount < 0 ? `- R$ ${Math.abs(tx.amount).toFixed(2)}` : `+ R$ ${tx.amount.toFixed(2)}`}
                </td>
                <td className="px-5 py-3 text-white/30 text-xs">{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
