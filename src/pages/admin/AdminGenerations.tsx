import { useEffect, useState } from 'react';
import { adminService, MOCK_LOGS } from '@/services/adminService';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/creatyng';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

type Log = typeof MOCK_LOGS[number];

const FEATURE_COLORS: Record<string, string> = {
  'Ecom Banner': 'bg-[#ff713d]/10 text-[#ff713d]',
  'Social Post': 'bg-indigo-400/10 text-indigo-400',
  'Photoshoot': 'bg-amber-400/10 text-amber-400',
};

const PROVIDER_COLORS: Record<string, string> = {
  'Gemini Pro': 'bg-blue-400/10 text-blue-400',
  'Gemini Flash': 'bg-sky-400/10 text-sky-400',
  'Replicate': 'bg-purple-400/10 text-purple-400',
};

export default function AdminGenerations() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');

  useEffect(() => {
    adminService.getGenerationLogs().then(({ logs, total }) => {
      setLogs(logs);
      setTotal(total);
      setTimeout(() => setLoading(false), 600);
    });
  }, []);

  const filtered = logs.filter((l) => statusFilter === 'all' || l.status === statusFilter);

  const successCount = logs.filter((l) => l.status === 'success').length;
  const errorCount = logs.filter((l) => l.status === 'error').length;
  const avgDurationRaw = logs
    .filter((l) => l.duration !== '—')
    .map((l) => parseFloat(l.duration))
    .reduce((a, b, _, arr) => a + b / arr.length, 0);

  const totalCount = useAnimatedCounter(total);
  const successPct = useAnimatedCounter(logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map((i) => <Skeleton key={i} height="80px" rounded className="rounded-xl" />)}
        </div>
        <Skeleton height="40px" rounded className="rounded-lg w-64" />
        <Skeleton height="400px" rounded className="rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
            <Clock className="h-4 w-4 text-white/40" />
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Total hoje</p>
            <p className="text-xl font-bold text-white">{totalCount.toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-400/10 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Sucesso %</p>
            <p className="text-xl font-bold text-white">{successPct}%</p>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-400/10 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Tempo médio</p>
            <p className="text-xl font-bold text-white">{avgDurationRaw.toFixed(1)}s</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['all', 'success', 'error'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03]'
            }`}
          >
            {f === 'all' ? `Todos (${logs.length})` : f === 'success' ? `Sucesso (${successCount})` : `Erro (${errorCount})`}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['ID', 'Usuário', 'Feature', 'Status', 'Créditos', 'Tokens', 'Provider', 'Duração', 'Hora'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-white/30 text-[10px] font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2.5 text-white/25 text-[10px] font-mono">{log.id}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60 font-semibold shrink-0">
                      {log.userName.charAt(0)}
                    </div>
                    <span className="text-white/60 text-xs">{log.userName}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${FEATURE_COLORS[log.feature] ?? 'bg-white/10 text-white/40'}`}>
                    {log.feature}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    log.status === 'success' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                  }`}>
                    {log.status === 'success' ? 'Sucesso' : 'Erro'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-white/40 text-xs">{log.credits > 0 ? log.credits : '—'}</td>
                <td className="px-4 py-2.5 text-white/40 text-xs">{log.tokens > 0 ? log.tokens.toLocaleString() : '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${PROVIDER_COLORS[log.provider] ?? 'bg-white/10 text-white/40'}`}>
                    {log.provider}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-white/40 text-xs">{log.duration}</td>
                <td className="px-4 py-2.5 text-white/25 text-xs">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
