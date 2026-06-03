import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Skeleton } from '@/components/creatyng';

type Provider = { name: string; icon: string; tokensToday: number; totalCapacity: number; costEstimate: number };
type TopUser = { name: string; tokens: number; generations: number; cost: number };

// Token tracking not yet in DB — placeholder data for visual consistency
const PLACEHOLDER_PROVIDERS: Provider[] = [
  { name: 'Gemini Pro', icon: '✦', tokensToday: 0, totalCapacity: 50000, costEstimate: 0 },
  { name: 'Gemini Flash', icon: '⚡', tokensToday: 0, totalCapacity: 100000, costEstimate: 0 },
  { name: 'Replicate', icon: '◈', tokensToday: 0, totalCapacity: 40000, costEstimate: 0 },
];
const PLACEHOLDER_TOP_USERS: TopUser[] = [];
const PLACEHOLDER_DAILY: { day: string; geminiPro: number; geminiFlash: number; replicate: number }[] = [
  { day: 'Seg', geminiPro: 0, geminiFlash: 0, replicate: 0 },
  { day: 'Ter', geminiPro: 0, geminiFlash: 0, replicate: 0 },
  { day: 'Qua', geminiPro: 0, geminiFlash: 0, replicate: 0 },
  { day: 'Qui', geminiPro: 0, geminiFlash: 0, replicate: 0 },
  { day: 'Sex', geminiPro: 0, geminiFlash: 0, replicate: 0 },
  { day: 'Sáb', geminiPro: 0, geminiFlash: 0, replicate: 0 },
  { day: 'Dom', geminiPro: 0, geminiFlash: 0, replicate: 0 },
];

const CHART_STYLE = { fontSize: 11, fill: '#8e8e96' };
const tooltipStyle = { background: '#ffffff', border: '1px solid rgba(20,20,23,0.08)', borderRadius: 8, color: '#141417', fontSize: 12, boxShadow: '0 4px 16px rgba(20,20,23,0.08)' };

const thStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#8e8e96', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(20,20,23,0.06)' };
const tdStyle: React.CSSProperties = { padding: '9px 16px', fontSize: 12, color: '#141417', borderBottom: '1px solid rgba(20,20,23,0.04)' };

export default function AdminTokens() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [dailyData, setDailyData] = useState<{ day: string; geminiPro: number; geminiFlash: number; replicate: number }[]>([]);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    // Token tracking not yet in DB — using placeholders
    setProviders(PLACEHOLDER_PROVIDERS);
    setTopUsers(PLACEHOLDER_TOP_USERS);
    setDailyData(PLACEHOLDER_DAILY);
    setTimeout(() => setLoading(false), 400);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} height="148px" rounded className="rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton height="260px" rounded className="rounded-xl" />
          <Skeleton height="260px" rounded className="rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Provider Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14 }}>
        {providers.map((p) => {
          const usePct = Math.round((p.tokensToday / p.totalCapacity) * 100);
          return (
            <div key={p.name} style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(20,20,23,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{p.icon}</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#141417' }}>{p.name}</p>
                  <p style={{ fontSize: 10.5, color: '#8e8e96' }}>Provider de IA</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10.5, color: '#8e8e96' }}>Tokens hoje</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#141417' }}>{p.tokensToday.toLocaleString()}</span>
                </div>
                <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(20,20,23,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${usePct}%`, height: '100%', borderRadius: 3, background: '#ff713d', transition: 'width 600ms ease' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#b5b5bb' }}>{usePct}% do limite</span>
                  <span style={{ fontSize: 10, color: '#b5b5bb' }}>Max: {p.totalCapacity.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(20,20,23,0.06)', paddingTop: 12 }}>
                <span style={{ fontSize: 10.5, color: '#8e8e96' }}>Custo estimado hoje</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>${p.costEstimate.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        {/* Stacked Bar Chart */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#141417', marginBottom: 14 }}>Consumo diário por provedor</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <XAxis dataKey="day" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#8e8e96' }} />
              <Bar dataKey="geminiPro" name="Gemini Pro" stackId="a" fill="#60a5fa" />
              <Bar dataKey="geminiFlash" name="Gemini Flash" stackId="a" fill="#818cf8" />
              <Bar dataKey="replicate" name="Replicate" stackId="a" fill="#c084fc" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Users Ranking */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(20,20,23,0.06)', borderRadius: 14, overflow: 'hidden', overflowX: 'auto', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(20,20,23,0.06)', fontSize: 13, fontWeight: 600, color: '#141417' }}>Top 10 por consumo</div>
          <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse' }}>
            <thead><tr>
              {['#', 'Usuário', 'Tokens', 'Gerações', 'Custo'].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {topUsers.map((u, i) => (
                <tr key={u.name} style={{ transition: 'background 100ms' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(20,20,23,0.015)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, fontWeight: 700, color: i === 0 ? '#ff713d' : '#b5b5bb' }}>{i + 1}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(20,20,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: '#5a5a60', flexShrink: 0 }}>{u.name.charAt(0)}</div>
                      <span style={{ color: '#5a5a60', fontSize: 11 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#8e8e96', fontSize: 11 }}>{u.tokens.toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: '#8e8e96', fontSize: 11 }}>{u.generations}</td>
                  <td style={{ ...tdStyle, color: '#10B981', fontSize: 11, fontWeight: 500 }}>${u.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
