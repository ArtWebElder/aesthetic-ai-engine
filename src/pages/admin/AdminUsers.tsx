import { useEffect, useState, useCallback } from 'react';
import { Search, Download, Pencil, Ban, Trash2, X, Plus, Minus, Shield } from 'lucide-react';
import { adminService, type AdminUser } from '@/services/adminService';
import { Skeleton } from '@/components/creatyng';

const PLAN_STYLES: Record<string, React.CSSProperties> = {
  free: { background: 'rgba(20,20,23,0.06)', color: '#8e8e96' },
  pro: { background: 'rgba(99,102,241,0.08)', color: '#6366f1' },
  team: { background: 'rgba(255,113,61,0.08)', color: '#ff713d' },
};

const ROLE_STYLES: Record<string, React.CSSProperties> = {
  user: { background: 'rgba(20,20,23,0.04)', color: '#b5b5bb' },
  admin: { background: 'rgba(245,158,11,0.08)', color: '#F59E0B' },
  superadmin: { background: 'rgba(239,68,68,0.08)', color: '#EF4444' },
};

const PAGE_SIZE = 10;
const thStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#8e8e96', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid rgba(20,20,23,0.06)' };
const tdStyle: React.CSSProperties = { padding: '11px 20px', fontSize: 13, color: '#141417', borderBottom: '1px solid rgba(20,20,23,0.04)' };

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Modals
  const [creditModal, setCreditModal] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState(50);
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

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleSaveCredits() {
    if (!creditModal) return;
    const amount = creditMode === 'add' ? Math.abs(creditAmount) : -Math.abs(creditAmount);
    await adminService.updateUserCredits(creditModal.id, amount, creditReason);
    setCreditModal(null);
    setCreditAmount(50);
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

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton height="36px" rounded className="rounded-lg flex-1" />
          <Skeleton height="36px" width="280px" rounded className="rounded-lg" />
        </div>
        <Skeleton height="420px" rounded className="rounded-xl" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#b5b5bb' }} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por nome ou email..."
            style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(20,20,23,0.1)', borderRadius: 8, paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, color: '#141417', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'free', 'pro', 'team'].map((f) => (
            <button key={f} onClick={() => { setPlanFilter(f); setPage(1); }} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
              background: planFilter === f ? '#FFF0EA' : 'transparent',
              border: planFilter === f ? '1px solid rgba(255,113,61,0.2)' : '1px solid transparent',
              color: planFilter === f ? '#ff713d' : '#8e8e96',
            }}>{f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(20,20,23,0.08)', background: '#ffffff', color: '#8e8e96', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
          <Download style={{ width: 14, height: 14 }} /> Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, overflow: 'hidden', overflowX: 'auto', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
        <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Nome', 'Email', 'Plano', 'Créditos', 'Role', 'Cadastro', 'Ações'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#8e8e96', padding: 32 }}>Nenhum usuário encontrado</td></tr>
            ) : users.map((user) => {
              const totalCredits = (user.plan_credits ?? 0) + (user.bonus_credits ?? 0) || 1;
              const creditPct = Math.min(100, Math.round(((user.credits ?? 0) / totalCredits) * 100));
              const planKey = (user.plan || 'free').toLowerCase();
              return (
                <tr key={user.id} style={{ transition: 'background 100ms' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(20,20,23,0.015)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(20,20,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#5a5a60', flexShrink: 0 }}>{(user.name || user.email || '?').charAt(0).toUpperCase()}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#141417' }}>{user.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#8e8e96', fontSize: 12 }}>{user.email}</td>
                  <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, ...(PLAN_STYLES[planKey] ?? PLAN_STYLES.free) }}>{(user.plan || 'free').charAt(0).toUpperCase() + (user.plan || 'free').slice(1)}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(20,20,23,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${creditPct}%`, height: '100%', borderRadius: 2, background: '#ff713d' }} />
                      </div>
                      <span style={{ fontSize: 10.5, color: '#8e8e96' }}>{user.credits ?? 0}/{totalCredits}</span>
                    </div>
                  </td>
                  <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, ...(ROLE_STYLES[user.role] ?? ROLE_STYLES.user) }}>{user.role}</span></td>
                  <td style={{ ...tdStyle, color: '#b5b5bb', fontSize: 11 }}>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {[
                        { Icon: Pencil, title: 'Ajustar créditos', hoverColor: '#5a5a60', onClick: () => { setCreditModal(user); setCreditMode('add'); setCreditAmount(50); } },
                        { Icon: Ban, title: 'Ver detalhes', hoverColor: '#F59E0B', onClick: () => openDetail(user) },
                        { Icon: Trash2, title: 'Deletar', hoverColor: '#EF4444', onClick: () => {} },
                      ].map(({ Icon, title, hoverColor, onClick }) => (
                        <button key={title} title={title} onClick={onClick} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(20,20,23,0.06)', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b5b5bb', transition: 'all 120ms' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = hoverColor; (e.currentTarget as HTMLButtonElement).style.background = `${hoverColor}0A`; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b5b5bb'; (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'; }}
                        ><Icon style={{ width: 13, height: 13 }} /></button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11.5, color: '#8e8e96' }}>Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} de {total}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11.5, border: '1px solid rgba(20,20,23,0.08)', background: '#ffffff', color: '#8e8e96', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.3 : 1, fontFamily: 'inherit' }}>Anterior</button>
          {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 28, height: 28, borderRadius: 7, fontSize: 11.5, border: 'none', background: p === page ? '#FFF0EA' : 'transparent', color: p === page ? '#ff713d' : '#8e8e96', cursor: 'pointer', fontFamily: 'inherit', fontWeight: p === page ? 600 : 400 }}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11.5, border: '1px solid rgba(20,20,23,0.08)', background: '#ffffff', color: '#8e8e96', cursor: page === pageCount ? 'default' : 'pointer', opacity: page === pageCount ? 0.3 : 1, fontFamily: 'inherit' }}>Próximo</button>
        </div>
      </div>

      {/* Credit Modal */}
      {creditModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }} onClick={() => setCreditModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.1)', borderRadius: 16, padding: 24, width: 380, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#141417' }}>Ajustar Créditos</h3>
              <button onClick={() => setCreditModal(null)} style={{ background: 'none', border: 'none', color: '#8e8e96', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#8e8e96', marginBottom: 16 }}>{creditModal.name || creditModal.email} — Saldo: {creditModal.credits}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setCreditMode('add')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: creditMode === 'add' ? '1px solid #10b981' : '1px solid rgba(20,20,23,0.08)', background: creditMode === 'add' ? 'rgba(16,185,129,0.06)' : 'transparent', color: creditMode === 'add' ? '#10b981' : '#8e8e96', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}><Plus size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Adicionar</button>
              <button onClick={() => setCreditMode('remove')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: creditMode === 'remove' ? '1px solid #ef4444' : '1px solid rgba(20,20,23,0.08)', background: creditMode === 'remove' ? 'rgba(239,68,68,0.06)' : 'transparent', color: creditMode === 'remove' ? '#ef4444' : '#8e8e96', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}><Minus size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Remover</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[10, 50, 100, 500].map(n => (
                <button key={n} onClick={() => setCreditAmount(n)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: creditAmount === n ? '1px solid #ff713d' : '1px solid rgba(20,20,23,0.08)', background: creditAmount === n ? '#FFF0EA' : 'transparent', color: creditAmount === n ? '#ff713d' : '#8e8e96', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{n}</button>
              ))}
            </div>
            <input type="number" value={creditAmount} onChange={e => setCreditAmount(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(20,20,23,0.1)', background: '#ffffff', color: '#141417', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <input value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="Motivo (opcional)" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(20,20,23,0.1)', background: '#ffffff', color: '#141417', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }} />
            <button onClick={handleSaveCredits} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: creditMode === 'add' ? '#10b981' : '#ef4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {creditMode === 'add' ? `+ ${creditAmount} créditos` : `- ${creditAmount} créditos`}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }} onClick={() => setDetailModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.1)', borderRadius: 16, padding: 24, width: 480, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#141417' }}>Detalhes do Usuário</h3>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', color: '#8e8e96', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, fontSize: 12 }}>
              <div><span style={{ color: '#8e8e96' }}>Email:</span> <span style={{ color: '#141417' }}>{detailModal.email}</span></div>
              <div><span style={{ color: '#8e8e96' }}>Nome:</span> <span style={{ color: '#141417' }}>{detailModal.name || '—'}</span></div>
              <div><span style={{ color: '#8e8e96' }}>Plano:</span> <span style={{ color: '#ff713d', fontWeight: 600 }}>{(detailModal.plan || 'free').toUpperCase()}</span></div>
              <div><span style={{ color: '#8e8e96' }}>Créditos:</span> <span style={{ color: '#141417' }}>{detailModal.credits} (plan: {detailModal.plan_credits}, bonus: {detailModal.bonus_credits})</span></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#8e8e96', marginBottom: 6 }}>Alterar Plano:</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {['free', 'pro', 'team'].map(p => (
                  <button key={p} onClick={() => handleChangePlan(detailModal.id, p)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: detailModal.plan === p ? '1px solid #ff713d' : '1px solid rgba(20,20,23,0.08)', background: detailModal.plan === p ? '#FFF0EA' : 'transparent', color: detailModal.plan === p ? '#ff713d' : '#8e8e96' }}>{p.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <button onClick={() => handleToggleRole(detailModal.id, detailModal.role)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, marginBottom: 16, border: '1px solid rgba(20,20,23,0.08)', background: detailModal.role === 'superadmin' ? 'rgba(239,68,68,0.06)' : 'transparent', color: detailModal.role === 'superadmin' ? '#ef4444' : '#8e8e96', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Shield size={14} /> {detailModal.role === 'superadmin' ? 'Remover Super Admin' : 'Tornar Super Admin'}
            </button>
            <p style={{ fontSize: 12, color: '#8e8e96', marginBottom: 6 }}>Histórico de Créditos:</p>
            {userHistory.length === 0 ? (
              <p style={{ fontSize: 12, color: '#b5b5bb', padding: 12 }}>Sem histórico</p>
            ) : (
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 8 }}>
                {userHistory.map((h, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(20,20,23,0.04)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: '#5a5a60' }}>{(h.description as string) || (h.type as string)}</span>
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
