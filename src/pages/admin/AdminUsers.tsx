import { useEffect, useState } from 'react';
import { Search, Download, Pencil, Ban, Trash2 } from 'lucide-react';
import { adminService, MOCK_USERS } from '@/services/adminService';
import { Skeleton } from '@/components/creatyng';

type User = typeof MOCK_USERS[number];

const PLAN_STYLES: Record<string, React.CSSProperties> = {
  Free: { background: 'rgba(20,20,23,0.06)', color: '#8e8e96' },
  Pro: { background: 'rgba(99,102,241,0.08)', color: '#6366f1' },
  Team: { background: 'rgba(255,113,61,0.08)', color: '#ff713d' },
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
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminService.getUsers().then(({ users, total }) => {
      setUsers(users);
      setTotal(total);
      setTimeout(() => setLoading(false), 600);
    });
  }, []);

  void total;

  if (loading) {
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

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#b5b5bb' }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nome ou email..."
            style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(20,20,23,0.1)', borderRadius: 8, paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, fontSize: 13, color: '#141417', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'Free', 'Pro', 'Team'].map((f) => (
            <button key={f} onClick={() => { setPlanFilter(f); setPage(1); }} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
              background: planFilter === f ? '#FFF0EA' : 'transparent',
              border: planFilter === f ? '1px solid rgba(255,113,61,0.2)' : '1px solid transparent',
              color: planFilter === f ? '#ff713d' : '#8e8e96',
            }}>
              {f === 'all' ? 'Todos' : f}
            </button>
          ))}
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(20,20,23,0.08)', background: '#ffffff', color: '#8e8e96', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
          <Download style={{ width: 14, height: 14 }} />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>
            {['Nome', 'Email', 'Plano', 'Créditos', 'Role', 'Cadastro', 'Ações'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paginated.map((user) => {
              const creditPct = Math.round((user.credits / user.totalCredits) * 100);
              return (
                <tr key={user.id} style={{ transition: 'background 100ms' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(20,20,23,0.015)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(20,20,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#5a5a60', flexShrink: 0 }}>{user.name.charAt(0)}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#141417' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#8e8e96', fontSize: 12 }}>{user.email}</td>
                  <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, ...(PLAN_STYLES[user.plan] ?? PLAN_STYLES.Free) }}>{user.plan}</span></td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(20,20,23,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${creditPct}%`, height: '100%', borderRadius: 2, background: '#ff713d' }} />
                      </div>
                      <span style={{ fontSize: 10.5, color: '#8e8e96' }}>{user.credits}/{user.totalCredits}</span>
                    </div>
                  </td>
                  <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, ...(ROLE_STYLES[user.role] ?? ROLE_STYLES.user) }}>{user.role}</span></td>
                  <td style={{ ...tdStyle, color: '#b5b5bb', fontSize: 11 }}>{user.createdAt}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {[
                        { Icon: Pencil, title: 'Editar', hoverColor: '#5a5a60' },
                        { Icon: Ban, title: 'Suspender', hoverColor: '#F59E0B' },
                        { Icon: Trash2, title: 'Deletar', hoverColor: '#EF4444' },
                      ].map(({ Icon, title, hoverColor }) => (
                        <button key={title} title={title} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(20,20,23,0.06)', background: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b5b5bb', transition: 'all 120ms' }}
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
        <span style={{ fontSize: 11.5, color: '#8e8e96' }}>
          Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11.5, border: '1px solid rgba(20,20,23,0.08)', background: '#ffffff', color: '#8e8e96', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.3 : 1, fontFamily: 'inherit' }}>Anterior</button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 28, height: 28, borderRadius: 7, fontSize: 11.5, border: 'none', background: p === page ? '#FFF0EA' : 'transparent', color: p === page ? '#ff713d' : '#8e8e96', cursor: 'pointer', fontFamily: 'inherit', fontWeight: p === page ? 600 : 400 }}>{p}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11.5, border: '1px solid rgba(20,20,23,0.08)', background: '#ffffff', color: '#8e8e96', cursor: page === pageCount ? 'default' : 'pointer', opacity: page === pageCount ? 0.3 : 1, fontFamily: 'inherit' }}>Próximo</button>
        </div>
      </div>
    </div>
  );
}
