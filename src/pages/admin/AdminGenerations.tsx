import { useEffect, useState, useCallback } from 'react';
import { adminService, type AdminGeneration } from '@/services/adminService';
import { ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';

const STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', success: '#10b981', completed: '#10b981', error: '#ef4444' };
const PAGE_SIZE = 20;

export default function AdminGenerations() {
  const [generations, setGenerations] = useState<AdminGeneration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { generations: g, total: t } = await adminService.fetchGenerations(page, PAGE_SIZE);
    setGenerations(g);
    setTotal(t);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa' }}>Gerações</h1>
          <p style={{ fontSize: 13, color: '#71717a' }}>{total} gerações no total</p>
        </div>
      </div>

      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #27272a' }}>
              {['ID', 'Usuário', 'Provider', 'Status', 'Créditos', 'Duração', 'Tamanho', 'Data'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#71717a', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}><td colSpan={8} style={{ padding: 10 }}><Skeleton style={{ height: 20 }} /></td></tr>
            )) : generations.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>
                <Image size={24} style={{ margin: '0 auto 8px', color: '#3f3f46' }} />
                Nenhuma geração encontrada
              </td></tr>
            ) : generations.map(g => (
              <tr key={g.id} style={{ borderBottom: '1px solid #1e1e22' }}>
                <td style={{ padding: '10px 14px', color: '#52525b', fontFamily: 'monospace', fontSize: 11 }}>{g.id?.slice(0, 8)}</td>
                <td style={{ padding: '10px 14px', color: '#a1a1aa' }}>{g.user_email || g.user_id?.slice(0, 8) || '—'}</td>
                <td style={{ padding: '10px 14px', color: '#fafafa', fontSize: 12 }}>{g.provider || '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: `${STATUS_COLORS[g.status] || '#52525b'}20`, color: STATUS_COLORS[g.status] || '#52525b' }}>{g.status}</span>
                </td>
                <td style={{ padding: '10px 14px', color: '#a1a1aa', fontFamily: 'monospace' }}>{g.credits_used || 0}</td>
                <td style={{ padding: '10px 14px', color: '#71717a', fontSize: 12 }}>{g.duration_ms ? `${(g.duration_ms / 1000).toFixed(1)}s` : '—'}</td>
                <td style={{ padding: '10px 14px', color: '#71717a', fontSize: 12 }}>{g.width && g.height ? `${g.width}×${g.height}` : '—'}</td>
                <td style={{ padding: '10px 14px', color: '#71717a', fontSize: 12 }}>{new Date(g.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, color: '#71717a', fontSize: 12 }}>
        <span>Página {page} de {totalPages}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 10px', borderRadius: 6, background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.3 : 1 }}><ChevronLeft size={14} /></button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 10px', borderRadius: 6, background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.3 : 1 }}><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
