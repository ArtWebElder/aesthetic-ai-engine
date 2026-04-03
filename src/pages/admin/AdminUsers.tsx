import { useEffect, useState, useCallback } from 'react';
import { adminService, type AdminUser } from '@/services/adminService';
import { Search, ChevronLeft, ChevronRight, Plus, Minus, X, Shield } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';

const PLAN_COLORS: Record<string, string> = { free: '#71717a', pro: '#ff713d', team: '#7c3aed' };
const PAGE_SIZE = 15;

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [creditModal, setCreditModal] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState('');
  const [creditMode, setCreditMode] = useState<'add' | 'remove'>('add');
  const [detailModal, setDetailModal] = useState<AdminUser | null>(null);
  const [userHistory, setUserHistory] = useState<Array<Record<string, unknown>>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { users: u, total: t } = await adminService.fetchUsers(page, PAGE_SIZE, search || undefined, planFilter);
    setUsers(u);
    setTotal(t);
    setLoading(false);
  }, [page, search, planFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleSaveCredits() {
    if (!creditModal) return;
    const amount = creditMode === 'add' ? Math.abs(creditAmount) : -Math.abs(creditAmount);
    await adminService.updateUserCredits(creditModal.id, amount, creditReason);
    setCreditModal(null);
    setCreditAmount(0);
    setCreditReason('');
    load();
  }

  async function handleChangePlan(userId: string, plan: string) {
    await adminService.updateUserPlan(userId, plan);
    load();
    if (detailModal?.id === userId) setDetailModal({ ...detailModal, plan });
  }

  async function handleToggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'superadmin' ? 'user' : 'superadmin';
    await adminService.updateUserRole(userId, newRole);
    load();
    if (detailModal?.id === userId) setDetailModal({ ...detailModal, role: newRole });
  }

  async function openDetail(user: AdminUser) {
    setDetailModal(user);
    const history = await adminService.fetchUserCreditHistory(user.id, 20);
    setUserHistory(history);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', marginBottom: 16 }}>Usuários</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por email ou nome..." style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid #27272a', background: '#18181b', color: '#fafafa', fontSize: 13 }} />
        </div>
        {['all', 'free', 'pro', 'team'].map(f => (
          <button key={f} onClick={() => { setPlanFilter(f); setPage(1); }} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            border: planFilter === f ? '1px solid #ff713d' : '1px solid #27272a',
            background: planFilter === f ? '#ff713d15' : '#18181b',
            color: planFilter === f ? '#ff713d' : '#a1a1aa',
          }}>{f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #27272a' }}>
              {['Nome', 'Email', 'Plano', 'Créditos', 'Role', 'Cadastro', 'Ações'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#71717a', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={7} style={{ padding: 10 }}><Skeleton style={{ height: 24 }} /></td></tr>
            )) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>Nenhum usuário encontrado</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                <td style={{ padding: '10px 14px', color: '#fafafa', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a1a1aa' }}>
                      {(u.name || u.email || '?').charAt(0).toUpperCase()}
                    </div>
                    {u.name || '—'}
                  </div>
                </td>
                <td style={{ padding: '10px 14px', color: '#a1a1aa' }}>{u.email}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${PLAN_COLORS[u.plan] || '#52525b'}20`, color: PLAN_COLORS[u.plan] || '#52525b' }}>{(u.plan || 'free').toUpperCase()}</span>
                </td>
                <td style={{ padding: '10px 14px', color: '#fafafa', fontFamily: 'monospace', fontSize: 12 }}>
                  {u.credits ?? 0} <span style={{ color: '#52525b', fontSize: 10 }}>({u.plan_credits ?? 0}+{u.bonus_credits ?? 0})</span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  {u.role === 'superadmin' ? <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: '#ef444420', color: '#ef4444' }}>SUPER ADMIN</span> : <span style={{ color: '#52525b', fontSize: 11 }}>user</span>}
                </td>
                <td style={{ padding: '10px 14px', color: '#71717a', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setCreditModal(u); setCreditAmount(50); setCreditMode('add'); }} title="Ajustar créditos" style={{ padding: '4px 8px', borderRadius: 6, background: '#27272a', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 11 }}>🎫</button>
                    <button onClick={() => openDetail(u)} title="Ver detalhes" style={{ padding: '4px 8px', borderRadius: 6, background: '#27272a', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 11 }}>👤</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, color: '#71717a', fontSize: 12 }}>
        <span>{total} usuário{total !== 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 10px', borderRadius: 6, background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.3 : 1 }}><ChevronLeft size={14} /></button>
          <span style={{ padding: '6px 12px' }}>{page}/{totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 10px', borderRadius: 6, background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.3 : 1 }}><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* Credit Modal */}
      {creditModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }} onClick={() => setCreditModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 24, width: 380, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fafafa' }}>Ajustar Créditos</h3>
              <button onClick={() => setCreditModal(null)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 16 }}>{creditModal.name || creditModal.email} — Saldo: {creditModal.credits}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setCreditMode('add')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: creditMode === 'add' ? '1px solid #10b981' : '1px solid #27272a', background: creditMode === 'add' ? '#10b98115' : 'transparent', color: creditMode === 'add' ? '#10b981' : '#71717a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Plus size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Adicionar</button>
              <button onClick={() => setCreditMode('remove')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: creditMode === 'remove' ? '1px solid #ef4444' : '1px solid #27272a', background: creditMode === 'remove' ? '#ef444415' : 'transparent', color: creditMode === 'remove' ? '#ef4444' : '#71717a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Minus size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Remover</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[10, 50, 100, 500].map(n => (
                <button key={n} onClick={() => setCreditAmount(n)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: creditAmount === n ? '1px solid #ff713d' : '1px solid #27272a', background: creditAmount === n ? '#ff713d15' : 'transparent', color: creditAmount === n ? '#ff713d' : '#a1a1aa', fontSize: 12, cursor: 'pointer' }}>{n}</button>
              ))}
            </div>
            <input type="number" value={creditAmount} onChange={e => setCreditAmount(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #27272a', background: '#09090b', color: '#fafafa', fontSize: 13, marginBottom: 10 }} />
            <input value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="Motivo (opcional)" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #27272a', background: '#09090b', color: '#fafafa', fontSize: 13, marginBottom: 16 }} />
            <button onClick={handleSaveCredits} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: creditMode === 'add' ? '#10b981' : '#ef4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              {creditMode === 'add' ? `+ ${creditAmount} créditos` : `- ${creditAmount} créditos`}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }} onClick={() => setDetailModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 16, padding: 24, width: 480, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fafafa' }}>Detalhes do Usuário</h3>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, fontSize: 12 }}>
              <div><span style={{ color: '#52525b' }}>Email:</span> <span style={{ color: '#fafafa' }}>{detailModal.email}</span></div>
              <div><span style={{ color: '#52525b' }}>Nome:</span> <span style={{ color: '#fafafa' }}>{detailModal.name || '—'}</span></div>
              <div><span style={{ color: '#52525b' }}>Plano:</span> <span style={{ color: PLAN_COLORS[detailModal.plan] || '#52525b', fontWeight: 600 }}>{(detailModal.plan || 'free').toUpperCase()}</span></div>
              <div><span style={{ color: '#52525b' }}>Créditos:</span> <span style={{ color: '#fafafa' }}>{detailModal.credits} (plan: {detailModal.plan_credits}, bonus: {detailModal.bonus_credits})</span></div>
              <div><span style={{ color: '#52525b' }}>Cadastro:</span> <span style={{ color: '#a1a1aa' }}>{new Date(detailModal.created_at).toLocaleDateString('pt-BR')}</span></div>
              <div><span style={{ color: '#52525b' }}>Role:</span> <span style={{ color: detailModal.role === 'superadmin' ? '#ef4444' : '#a1a1aa' }}>{detailModal.role}</span></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#52525b', marginBottom: 6 }}>Alterar Plano:</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {['free', 'pro', 'team'].map(p => (
                  <button key={p} onClick={() => handleChangePlan(detailModal.id, p)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: detailModal.plan === p ? `1px solid ${PLAN_COLORS[p]}` : '1px solid #27272a', background: detailModal.plan === p ? `${PLAN_COLORS[p]}15` : 'transparent', color: detailModal.plan === p ? PLAN_COLORS[p] : '#71717a' }}>{p.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <button onClick={() => handleToggleRole(detailModal.id, detailModal.role)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, marginBottom: 16, border: '1px solid #27272a', background: detailModal.role === 'superadmin' ? '#ef444415' : 'transparent', color: detailModal.role === 'superadmin' ? '#ef4444' : '#71717a', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              <Shield size={14} /> {detailModal.role === 'superadmin' ? 'Remover Super Admin' : 'Tornar Super Admin'}
            </button>
            <p style={{ fontSize: 12, color: '#52525b', marginBottom: 6 }}>Histórico de Créditos:</p>
            {userHistory.length === 0 ? (
              <p style={{ fontSize: 12, color: '#3f3f46', padding: 12 }}>Sem histórico</p>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #27272a', borderRadius: 8 }}>
                {userHistory.map((h, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid #1e1e22', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: '#a1a1aa' }}>{(h.description as string) || (h.type as string)}</span>
                    <span style={{ color: (h.amount as number) >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>{(h.amount as number) >= 0 ? '+' : ''}{h.amount as number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
