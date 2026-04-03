import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { adminService } from '@/services/adminService';
import { TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface FinanceStats {
  mrr: number;
  churnRate: number;
  conversionRate: number;
}

const CHART_STYLE = { fontSize: 11, fill: '#8e8e96' };

const TX_TYPE_STYLES: Record<string, React.CSSProperties> = {
  subscription: { background: 'rgba(16,185,129,0.08)', color: '#10B981' },
  recharge: { background: 'rgba(99,102,241,0.08)', color: '#6366f1' },
  refund: { background: 'rgba(239,68,68,0.08)', color: '#EF4444' },
};
const TX_TYPE_LABELS: Record<string, string> = {
  subscription: 'Assinatura',
  recharge: 'Recarga',
  refund: 'Reembolso',
};

const cardStyle: React.CSSProperties = { background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 3px rgba(20,20,23,0.04)' };
const tooltipStyle = { background: '#ffffff', border: '1px solid rgba(20,20,23,0.08)', borderRadius: 8, color: '#141417', fontSize: 12, boxShadow: '0 4px 16px rgba(20,20,23,0.08)' };
const thStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#8e8e96', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid rgba(20,20,23,0.06)' };
const tdStyle: React.CSSProperties = { padding: '11px 20px', fontSize: 13, color: '#141417', borderBottom: '1px solid rgba(20,20,23,0.04)' };

export default function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinanceStats>({ mrr: 8400, churnRate: 3.2, conversionRate: 12.5 });
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [transactions, setTransactions] = useState<Array<{ user: string; type: string; amount: number; date: string }>>([]);

  const mrrCount = useAnimatedCounter(stats.mrr);
  const churnCount = useAnimatedCounter(Math.round(stats.churnRate * 10));
  const convCount = useAnimatedCounter(Math.round(stats.conversionRate * 10));

  useEffect(() => {
    Promise.all([
      adminService.fetchDashboardKPIs(),
      adminService.fetchRevenueByPeriod(365),
      adminService.fetchPayments(1, 10),
    ]).then(([kpis, rev, pay]) => {
      setStats({ mrr: Math.round(kpis.mrr), churnRate: 0, conversionRate: 0 });
      setRevenue(rev.map(r => ({ month: r.date, revenue: r.revenue })));
      setTransactions(pay.payments.map(p => ({
        user: p.user_name || p.user_email || p.user_id?.slice(0, 8) || '—',
        type: p.status === 'refunded' ? 'refund' : p.credits > 0 && p.amount_cents < 5000 ? 'recharge' : 'subscription',
        amount: (p.amount_cents || 0) / 100 * (p.status === 'refunded' ? -1 : 1),
        date: new Date(p.created_at).toLocaleDateString('pt-BR'),
      })));
      setTimeout(() => setLoading(false), 400);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#8e8e96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MRR</span>
            <TrendingUp style={{ width: 16, height: 16, color: '#10B981' }} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#141417', lineHeight: 1 }}>R$ {mrrCount.toLocaleString('pt-BR')}</span>
          <span style={{ fontSize: 11.5, color: '#10B981', fontWeight: 600 }}>+12.5% este mês</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#8e8e96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Churn Rate</span>
            <TrendingDown style={{ width: 16, height: 16, color: '#EF4444' }} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#141417', lineHeight: 1 }}>{(churnCount / 10).toFixed(1)}%</span>
          <span style={{ fontSize: 11.5, color: '#EF4444', fontWeight: 600 }}>+0.4% vs mês anterior</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#8e8e96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversão Free→Pro</span>
            <Percent style={{ width: 16, height: 16, color: '#6366f1' }} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#141417', lineHeight: 1 }}>{(convCount / 10).toFixed(1)}%</span>
          <span style={{ fontSize: 11.5, color: '#10B981', fontWeight: 600 }}>+2.1% vs mês anterior</span>
        </div>
      </div>

      {/* Revenue Chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#141417', marginBottom: 8 }}>Evolução da Receita (12 meses)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenue}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff713d" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ff713d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={CHART_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']} />
            <Area type="monotone" dataKey="revenue" stroke="#ff713d" fill="url(#revGrad)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions Table */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(20,20,23,0.06)', fontSize: 13, fontWeight: 600, color: '#141417' }}>Últimas transações</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Usuário', 'Tipo', 'Valor', 'Data'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr key={i} style={{ transition: 'background 100ms' }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(20,20,23,0.015)'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
              >
                <td style={{ ...tdStyle, color: '#5a5a60' }}>{tx.user}</td>
                <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, ...(TX_TYPE_STYLES[tx.type] ?? {}) }}>{TX_TYPE_LABELS[tx.type]}</span></td>
                <td style={{ ...tdStyle, fontWeight: 600, color: tx.amount < 0 ? '#EF4444' : '#10B981' }}>
                  {tx.amount < 0 ? `- R$ ${Math.abs(tx.amount).toFixed(2)}` : `+ R$ ${tx.amount.toFixed(2)}`}
                </td>
                <td style={{ ...tdStyle, color: '#b5b5bb', fontSize: 12 }}>{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
