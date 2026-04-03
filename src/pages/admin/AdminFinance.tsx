import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService, type AdminPayment } from '@/services/adminService';
import { ChevronLeft, ChevronRight, DollarSign, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';

const STATUS_COLORS: Record<string, string> = {
  paid: '#10b981', pending: '#f59e0b', failed: '#ef4444', refunded: '#8b5cf6',
};
const PAGE_SIZE = 20;

export default function AdminFinance() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [revenue, setRevenue] = useState<Array<{ date: string; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      adminService.fetchPayments(page, PAGE_SIZE, statusFilter),
      adminService.fetchRevenueByPeriod(30),
    ]);
    setPayments(p.payments);
    setTotal(p.total);
    setRevenue(r);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount_cents || 0), 0) / 100;
  const totalCredits = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.credits || 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', marginBottom: 16 }}>Financeiro</h1>

      {/* Quick stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 16, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><DollarSign size={14} style={{ color: '#10b981' }} /><span style={{ fontSize: 11, color: '#71717a' }}>Receita (página)</span></div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fafafa' }}>R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 16, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><CreditCard size={14} style={{ color: '#ff713d' }} /><span style={{ fontSize: 11, color: '#71717a' }}>Créditos vendidos</span></div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fafafa' }}>{totalCredits}</span>
        </div>
      </div>

      {/* Revenue chart */}
      {revenue.length > 0 && (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 12 }}>Receita (30 dias)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenue}>
              <XAxis dataKey="date" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: 8, color: '#fafafa', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {['all', 'paid', 'pending', 'failed', 'refunded'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
            border: statusFilter === s ? '1px solid #ff713d' : '1px solid #27272a',
            background: statusFilter === s ? '#ff713d15' : 'transparent',
            color: statusFilter === s ? '#ff713d' : '#71717a',
          }}>{s === 'all' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #27272a' }}>
              {['Data', 'Usuário', 'Provider', 'Valor', 'Créditos', 'Status', 'ID Externo'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#71717a', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={7} style={{ padding: 10 }}><Skeleton style={{ height: 20 }} /></td></tr>
            )) : payments.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>Nenhum pagamento encontrado</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                <td style={{ padding: '10px 14px', color: '#a1a1aa', fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '10px 14px', color: '#fafafa' }}>{p.user_name || p.user_email || p.user_id?.slice(0, 8)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: p.provider === 'stripe' ? '#6366f120' : '#10b98120', color: p.provider === 'stripe' ? '#6366f1' : '#10b981' }}>
                    {p.provider === 'stripe' ? 'Cartão' : p.provider === 'asaas' ? 'Pix' : p.provider || '—'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', color: '#fafafa', fontFamily: 'monospace' }}>R$ {((p.amount_cents || 0) / 100).toFixed(2)}</td>
                <td style={{ padding: '10px 14px', color: '#a1a1aa' }}>{p.credits || 0}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${STATUS_COLORS[p.status] || '#52525b'}20`, color: STATUS_COLORS[p.status] || '#52525b' }}>{p.status}</span>
                </td>
                <td style={{ padding: '10px 14px', color: '#52525b', fontSize: 11, fontFamily: 'monospace' }}>{p.external_id?.slice(0, 16) || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, color: '#71717a', fontSize: 12 }}>
        <span>{total} pagamento{total !== 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 10px', borderRadius: 6, background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.3 : 1 }}><ChevronLeft size={14} /></button>
          <span style={{ padding: '6px 12px' }}>{page}/{totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 10px', borderRadius: 6, background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.3 : 1 }}><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
