import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminService, MOCK_PROVIDERS, MOCK_TOP_USERS } from '@/services/adminService';

type Provider = typeof MOCK_PROVIDERS[number];
type TopUser = typeof MOCK_TOP_USERS[number];

const CHART_STYLE = { fontSize: 11, fill: 'rgba(255,255,255,0.3)' };

export default function AdminTokens() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [dailyData, setDailyData] = useState<{ day: string; geminiPro: number; geminiFlash: number; replicate: number }[]>([]);

  useEffect(() => {
    adminService.getTokenStats().then(({ providers, topUsers }) => {
      setProviders(providers);
      setTopUsers(topUsers);
    });
    adminService.getDailyTokensByProvider().then(setDailyData);
  }, []);

  return (
    <div className="space-y-6">
      {/* Provider Cards */}
      <div className="grid grid-cols-3 gap-4">
        {providers.map((p) => {
          const usePct = Math.round((p.tokensToday / p.totalCapacity) * 100);
          return (
            <div key={p.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-lg">
                  {p.icon}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-semibold">{p.name}</p>
                  <p className="text-white/30 text-[10px]">Provider de IA</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[10px]">Tokens hoje</span>
                  <span className="text-white/70 text-xs font-medium">{p.tokensToday.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#ff713d] transition-all"
                    style={{ width: `${usePct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/25 text-[10px]">{usePct}% do limite</span>
                  <span className="text-white/25 text-[10px]">Max: {p.totalCapacity.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
                <span className="text-white/30 text-[10px]">Custo estimado hoje</span>
                <span className="text-emerald-400 text-xs font-medium">${p.costEstimate.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Stacked Bar Chart */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-5">Consumo diário por provedor</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <XAxis dataKey="day" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e1e24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }} />
              <Bar dataKey="geminiPro" name="Gemini Pro" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
              <Bar dataKey="geminiFlash" name="Gemini Flash" stackId="a" fill="#818cf8" radius={[0, 0, 0, 0]} />
              <Bar dataKey="replicate" name="Replicate" stackId="a" fill="#c084fc" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Users Ranking */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Top 10 por consumo</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['#', 'Usuário', 'Tokens', 'Gerações', 'Custo'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-white/25 text-[10px] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={u.name} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2 text-white/20 text-[10px]">{i + 1}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/50 font-semibold shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-white/60 text-[11px]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-white/50 text-[11px]">{u.tokens.toLocaleString()}</td>
                  <td className="px-4 py-2 text-white/40 text-[11px]">{u.generations}</td>
                  <td className="px-4 py-2 text-emerald-400/80 text-[11px]">${u.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
