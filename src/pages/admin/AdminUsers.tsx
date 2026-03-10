import { useEffect, useState } from 'react';
import { Search, Download, Pencil, Ban, Trash2 } from 'lucide-react';
import { adminService, MOCK_USERS } from '@/services/adminService';
import { Skeleton } from '@/components/creatyng';

type User = typeof MOCK_USERS[number];

const PLAN_COLORS: Record<string, string> = {
  Free: 'bg-white/10 text-white/40',
  Pro: 'bg-indigo-400/10 text-indigo-400',
  Team: 'bg-[#ff713d]/10 text-[#ff713d]',
};

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-white/[0.05] text-white/30',
  admin: 'bg-amber-400/10 text-amber-400',
  superadmin: 'bg-red-400/10 text-red-400',
};

const PAGE_SIZE = 10;

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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nome ou email..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-white/20"
          />
        </div>

        <div className="flex gap-1.5">
          {['all', 'Free', 'Pro', 'Team'].map((f) => (
            <button
              key={f}
              onClick={() => { setPlanFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                planFilter === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'
              }`}
            >
              {f === 'all' ? 'Todos' : f}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] text-white/40 text-xs hover:text-white/60 hover:border-white/10 transition-colors ml-auto">
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Nome', 'Email', 'Plano', 'Créditos', 'Role', 'Cadastro', 'Ações'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-white/30 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((user) => {
              const creditPct = Math.round((user.credits / user.totalCredits) * 100);
              return (
                <tr key={user.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60 font-semibold shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <span className="text-white/70 text-xs font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PLAN_COLORS[user.plan]}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#ff713d]"
                          style={{ width: `${creditPct}%` }}
                        />
                      </div>
                      <span className="text-white/40 text-[10px]">{user.credits}/{user.totalCredits}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLORS[user.role] ?? ROLE_COLORS.user}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/30 text-[10px]">{user.createdAt}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-md text-white/30 hover:text-amber-400 hover:bg-amber-400/5 transition-colors" title="Suspender">
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-400/5 transition-colors" title="Deletar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-white/30 text-xs">
          Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs text-white/40 border border-white/[0.06] hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 rounded-lg text-xs transition-colors ${
                p === page ? 'bg-white/10 text-white' : 'text-white/30 hover:bg-white/[0.03] hover:text-white/60'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="px-3 py-1.5 rounded-lg text-xs text-white/40 border border-white/[0.06] hover:bg-white/[0.03] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
