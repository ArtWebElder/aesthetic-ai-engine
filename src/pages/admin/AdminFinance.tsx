import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { adminService } from '@/services/adminService';
import { TrendingUp, Wallet, Users } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { useI18n } from '@/i18n';

interface FinanceStats {
  mrr: number;
  revenueTotal: number;
  conversion: number;
  payers: number;
  totalUsers: number;
}

const CHART_STYLE = { fontSize: 11, fill: '#8e8e96' };

const TX_TYPE_STYLES: Record<string, React.CSSProperties> = {
  purchase: { background: 'rgba(99,102,241,0.08)', color: '#6366f1' },
  subscription: { background: 'rgba(16,185,129,0.08)', color: '#10B981' },
  subscription_renewal: { background: 'rgba(16,185,129,0.08)', color: '#10B981' },
  admin_bonus: { background: 'rgba(245,158,11,0.10)', color: '#d97706' },
  bonus: { background: 'rgba(245,158,11,0.10)', color: '#d97706' },
  admin_debit: { background: 'rgba(239,68,68,0.08)', color: '#EF4444' },
  debit: { background: 'rgba(20,20,23,0.05)', color: '#8e8e96' },
  refund: { background: 'rgba(239,68,68,0.08)', color: '#EF4444' },
};
const TX_LABEL_KEYS: Record<string, string> = {
  purchase: 'admin.finance.tx.recharge',
  subscription: 'admin.finance.tx.subscription',
  subscription_renewal: 'admin.fin.tx.renewal',
  admin_bonus: 'admin.fin.tx.bonus',
  bonus: 'admin.fin.tx.bonus',
  admin_debit: 'admin.fin.tx.adjustment',
  debit: 'admin.fin.tx.consumption',
  refund: 'admin.finance.tx.refund',
};

const cardStyle: React.CSSProperties = { background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 3px rgba(20,20,23,0.04)' };
const tooltipStyle = { background: '#ffffff', border: '1px solid rgba(20,20,23,0.08)', borderRadius: 8, color: '#141417', fontSize: 12, boxShadow: '0 4px 16px rgba(20,20,23,0.08)' };
const thStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#8e8e96', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid rgba(20,20,23,0.06)' };
const tdStyle: React.CSSProperties = { padding: '11px 20px', fontSize: 13, color: '#141417', borderBottom: '1px solid rgba(20,20,23,0.04)' };

export default function AdminFinance() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinanceStats>({ mrr: 0, revenueTotal: 0, conversion: 0, payers: 0, totalUsers: 0 });
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [transactions, setTransactions] = useState<Array<{ user: string; type: string; amount: number; date: string }>>([]);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const mrrCount = useAnimatedCounter(stats.mrr);
  const revenueCount = useAnimatedCounter(stats.revenueTotal);
  const convCount = useAnimatedCounter(Math.round(stats.conversion * 10));

  useEffect(() => {
    Promise.all([
      adminService.fetchDashboardKPIs(),
      adminService.fetchRevenueByPeriod(365),
      adminService.fetchCreditLedger(12),
    ]).then(([kpis, rev, ledger]) => {
      const payers = (kpis.totalPro ?? 0) + (kpis.totalTeam ?? 0);
      const conversion = kpis.totalUsers > 0 ? (payers / kpis.totalUsers) * 100 : 0;
      setStats({ mrr: Math.round(kpis.mrr), revenueTotal: Math.round(kpis.totalRevenue), conversion, payers, totalUsers: kpis.totalUsers });
      setRevenue(rev.map(r => ({ month: r.date, revenue: r.revenue })));
      setTransactions(ledger);
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
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#8e8e96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.fin.mrr_label')}</span>
            <TrendingUp style={{ width: 16, height: 16, color: '#10B981' }} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#141417', lineHeight: 1 }}>R$ {mrrCount.toLocaleString('pt-BR')}</span>
          <span style={{ fontSize: 11.5, color: '#8e8e96', fontWeight: 500 }}>{t('admin.fin.mrr_sub')}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#8e8e96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.fin.revenue_total')}</span>
            <Wallet style={{ width: 16, height: 16, color: '#6366f1' }} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#141417', lineHeight: 1 }}>R$ {revenueCount.toLocaleString('pt-BR')}</span>
          <span style={{ fontSize: 11.5, color: '#8e8e96', fontWeight: 500 }}>{t('admin.fin.revenue_sub')}</span>
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#8e8e96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('admin.fin.conversion_label')}</span>
            <Users style={{ width: 16, height: 16, color: '#ff713d' }} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#141417', lineHeight: 1 }}>{(convCount / 10).toFixed(1)}%</span>
          <span style={{ fontSize: 11.5, color: '#8e8e96', fontWeight: 500 }}>{t('admin.fin.conversion_sub', { payers: stats.payers, total: stats.totalUsers })}</span>
        </div>
      </div>

      {/* Revenue Chart */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#141417', marginBottom: 8 }}>{t('admin.finance.revenue_history')}</div>
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
      <div style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, overflow: 'hidden', overflowX: 'auto', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(20,20,23,0.06)', fontSize: 13, fontWeight: 600, color: '#141417' }}>{t('admin.fin.ledger_title')}</div>
        <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse' }}>
          <thead><tr>
            {[t('admin.generations.col.user'), t('admin.fin.col.type'), t('admin.users.columns.credits'), t('admin.col.date')].map((h) => (
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
                <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, ...(TX_TYPE_STYLES[tx.type] ?? {}) }}>{TX_LABEL_KEYS[tx.type] ? t(TX_LABEL_KEYS[tx.type]) : tx.type}</span></td>
                <td style={{ ...tdStyle, fontWeight: 600, color: tx.amount < 0 ? '#EF4444' : '#10B981' }}>
                  {tx.amount < 0 ? `${tx.amount} cr` : `+${tx.amount} cr`}
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
