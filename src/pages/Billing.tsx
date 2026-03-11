import { useState, useEffect } from 'react';
import {
  Sparkles, Zap, Users, Building2, Check, Plus, TrendingUp,
} from 'lucide-react';
import { mockCredits } from '@/lib/mocks/data';
import Modal from '@/components/creatyng/Modal';

/* ── Plans ───────────────────────────────────────────── */
const PLANS = [
  {
    id: 'free', name: 'Free', price: 'R$ 0', period: '/mês', credits: '50',
    desc: 'Para conhecer a plataforma', current: false, accent: '#8e8e96',
    Icon: Sparkles,
    features: ['50 créditos / mês', '2 templates disponíveis', 'Export PNG', "Marca d'água Creatyng"],
    missing: ['Chat AI', 'Brand Kit', 'Multi-formato', 'Suporte prioritário'],
  },
  {
    id: 'pro', name: 'Pro', price: 'R$ 49', period: '/mês', credits: '500',
    desc: 'Para criadores individuais', current: true, popular: true, accent: '#ff713d',
    Icon: Zap,
    features: ['500 créditos / mês', 'Todos os templates', 'Export PNG, JPG, WebP', "Sem marca d'água", 'Chat AI ilimitado', 'Brand Kit básico'],
    missing: ['Multi-formato', 'Suporte prioritário'],
  },
  {
    id: 'team', name: 'Team', price: 'R$ 149', period: '/mês', credits: '2.000',
    desc: 'Para equipes e agências', current: false, accent: '#7C3AED',
    Icon: Users,
    features: ['2.000 créditos / mês', 'Todos os templates', 'Todos os formatos', "Sem marca d'água", 'Chat AI ilimitado', 'Brand Kit completo', 'Até 5 colaboradores', 'Suporte prioritário'],
    missing: [],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 'Sob consulta', period: '', credits: 'Ilimitado',
    desc: 'Para grandes operações', current: false, accent: '#141417',
    Icon: Building2,
    features: ['Créditos ilimitados', 'API dedicada', 'White-label', 'SSO & compliance', 'Gerente de conta', 'SLA garantido', 'Colaboradores ilimitados', 'Onboarding dedicado'],
    missing: [],
  },
];

/* ── History ─────────────────────────────────────────── */
const HISTORY = [
  { date: 'Hoje', action: 'Food/Pop — Burger Artesanal', credits: -5, type: 'gen' },
  { date: 'Hoje', action: 'Chat AI — Refinamento', credits: -1, type: 'chat' },
  { date: 'Ontem', action: 'Pop Design — Açaí Bowl', credits: -8, type: 'gen' },
  { date: 'Ontem', action: 'Food/Pop — Sushi Festival', credits: -5, type: 'gen' },
  { date: '08 Mar', action: 'Recarga avulsa — 200 créditos', credits: 200, type: 'topup' },
  { date: '05 Mar', action: 'Food/Pop — Pizza Weekend', credits: -5, type: 'gen' },
  { date: '01 Mar', action: 'Renovação mensal — Plano Pro', credits: 500, type: 'renew' },
];

/* ── Component ────────────────────────────────────────── */
const Billing = () => {
  const [tab, setTab] = useState<'plans' | 'usage'>('plans');
  const [ready, setReady] = useState(false);
  const [showReloadModal, setShowReloadModal] = useState(false);
  useEffect(() => { setReady(true); }, []);

  const totalCredits = 500;
  const usedCredits = totalCredits - mockCredits.current;
  const pct = Math.round((usedCredits / totalCredits) * 100);

  return (
    <div style={{
      fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
      minHeight: '100%', color: '#141417', padding: '28px 36px 48px',
    }}>
      <style>{`
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
      `}</style>

      {/* Title + Tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
        animation: ready ? 'fdUp 450ms ease both' : 'none',
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 3 }}>Planos & Faturamento</h1>
          <p style={{ fontSize: 13.5, color: '#5a5a60' }}>Gerencie seu plano, créditos e histórico de uso.</p>
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(20,20,23,0.04)', borderRadius: 8, padding: 3 }}>
          {[{ id: 'plans' as const, label: 'Planos' }, { id: 'usage' as const, label: 'Uso & Histórico' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', fontFamily: 'inherit',
              background: tab === t.id ? '#ffffff' : 'transparent',
              color: tab === t.id ? '#141417' : '#8e8e96', fontWeight: tab === t.id ? 600 : 400,
              fontSize: 13, cursor: 'pointer', boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 150ms',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'plans' && (
        <>
          {/* Usage summary card */}
          <div style={{
            background: '#ffffff', borderRadius: 14, border: '1px solid rgba(20,20,23,0.06)',
            padding: '20px 24px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(20,20,23,0.04)',
            animation: ready ? 'fdUp 450ms 60ms ease both' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: '#8e8e96', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plano atual</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#ff713d' }}>Pro</span>
                  <span style={{ fontSize: 12, color: '#8e8e96', background: '#FFF0EA', padding: '2px 8px', borderRadius: 5, fontWeight: 500 }}>R$ 49/mês</span>
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: 'rgba(20,20,23,0.06)' }} />
              <div>
                <div style={{ fontSize: 12, color: '#8e8e96', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Créditos usados</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#141417' }}>{usedCredits}</span>
                  <span style={{ fontSize: 13, color: '#8e8e96' }}>de {totalCredits}</span>
                </div>
                <div style={{ width: 180, height: 6, borderRadius: 3, background: 'rgba(20,20,23,0.06)', marginTop: 6 }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #ff713d, #FF9B70)', transition: 'width 600ms ease' }} />
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: 'rgba(20,20,23,0.06)' }} />
              <div>
                <div style={{ fontSize: 12, color: '#8e8e96', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Renova em</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#141417' }}>22 dias</div>
              </div>
            </div>
            <button
              onClick={() => setShowReloadModal(true)}
              style={{
                padding: '9px 20px', borderRadius: 9, border: '1.5px solid #ff713d',
                background: '#FFF0EA', color: '#ff713d', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Plus size={15} /> Recarregar créditos
            </button>
          </div>

          {/* Plan cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
            animation: ready ? 'fdUp 450ms 140ms ease both' : 'none',
          }}>
            {PLANS.map((p, i) => (
              <div key={p.id} style={{
                background: '#ffffff', borderRadius: 14, overflow: 'hidden',
                border: p.current ? '2px solid #ff713d' : '1px solid rgba(20,20,23,0.06)',
                boxShadow: p.current ? '0 4px 20px rgba(255,113,61,0.12)' : '0 1px 3px rgba(20,20,23,0.04)',
                position: 'relative', display: 'flex', flexDirection: 'column',
                animation: ready ? `scIn 340ms ${140 + i * 50}ms ease both` : 'none',
              }}>
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12, padding: '3px 10px', borderRadius: 6,
                    background: '#ff713d', color: '#fff', fontSize: 10, fontWeight: 600,
                  }}>Seu plano</div>
                )}
                <div style={{ padding: '22px 20px 0' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, marginBottom: 14,
                    background: p.id === 'free' ? '#f5f5f3' : p.id === 'pro' ? '#FFF0EA' : p.id === 'team' ? 'rgba(124,58,237,0.08)' : 'rgba(20,20,23,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.accent,
                  }}>
                    <p.Icon size={18} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#141417', marginBottom: 3 }}>{p.name}</h3>
                  <div style={{ fontSize: 12, color: '#8e8e96', marginBottom: 14 }}>{p.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: p.accent }}>{p.price}</span>
                    <span style={{ fontSize: 13, color: '#8e8e96' }}>{p.period}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#8e8e96', marginBottom: 18 }}>
                    <span style={{ fontWeight: 600, color: '#141417' }}>{p.credits}</span> créditos / mês
                  </div>
                </div>
                {/* Features */}
                <div style={{ padding: '0 20px 20px', flex: 1 }}>
                  <div style={{ height: 1, background: 'rgba(20,20,23,0.06)', marginBottom: 16 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {p.features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#141417' }}>
                        <Check size={16} color="#10B981" /><span>{f}</span>
                      </div>
                    ))}
                    {p.missing.map((f, j) => (
                      <div key={`m${j}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#b5b5bb' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5b5bb" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span style={{ textDecoration: 'line-through' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* CTA */}
                <div style={{ padding: '0 20px 20px' }}>
                  <button style={{
                    width: '100%', padding: '10px 0', borderRadius: 9, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all 180ms',
                    ...(p.current ? {
                      border: '1px solid rgba(20,20,23,0.06)', background: '#f5f5f3', color: '#8e8e96',
                    } : p.id === 'enterprise' ? {
                      border: '1.5px solid #141417', background: 'transparent', color: '#141417',
                    } : {
                      border: 'none', background: `linear-gradient(135deg, ${p.accent}, ${p.accent}BB)`, color: '#fff',
                      boxShadow: `0 3px 10px ${p.accent}33`,
                    }),
                  }}>
                    {p.current ? 'Plano atual' : p.id === 'enterprise' ? 'Falar com vendas' : `Assinar ${p.name}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'usage' && (
        <div style={{ animation: ready ? 'fdUp 450ms 60ms ease both' : 'none' }}>
          {/* KPI cards */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Créditos restantes', value: String(mockCredits.current), sub: `de ${totalCredits} este mês`, color: '#ff713d' },
              { label: 'Gerações este mês', value: '42', sub: '+12% vs mês anterior', color: '#7C3AED', trend: true },
              { label: 'Gasto médio / dia', value: '9.3', sub: 'créditos por dia', color: '#10B981' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, background: '#ffffff', borderRadius: 12, border: '1px solid rgba(20,20,23,0.06)',
                padding: '16px 18px', boxShadow: '0 1px 3px rgba(20,20,23,0.04)',
              }}>
                <div style={{ fontSize: 11, color: '#8e8e96', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: '#8e8e96', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {s.trend && <TrendingUp size={14} color="#10B981" />}{s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* History table */}
          <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid rgba(20,20,23,0.06)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(20,20,23,0.04)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(20,20,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Histórico de uso</h3>
              <button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(20,20,23,0.06)', background: '#ffffff', fontSize: 12, fontWeight: 500, color: '#5a5a60', cursor: 'pointer', fontFamily: 'inherit' }}>Este mês</button>
            </div>
            {HISTORY.map((h, i) => (
              <div key={i} style={{
                padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: i < HISTORY.length - 1 ? '1px solid rgba(20,20,23,0.06)' : 'none',
                transition: 'background 120ms',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(20,20,23,0.015)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: h.credits > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(255,113,61,0.12)',
                    color: h.credits > 0 ? '#10B981' : '#ff713d',
                  }}>
                    {h.credits > 0 ? <Plus size={15} /> : <Sparkles size={15} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#141417' }}>{h.action}</div>
                    <div style={{ fontSize: 11, color: '#b5b5bb', marginTop: 1 }}>{h.date}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
                  color: h.credits > 0 ? '#10B981' : '#5a5a60',
                }}>
                  {h.credits > 0 ? '+' : ''}{h.credits}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Modal open={showReloadModal} onClose={() => setShowReloadModal(false)} title="Recarregar Créditos" size="sm">
        <p style={{ fontSize: 14, color: '#5a5a60', lineHeight: 1.6, marginBottom: 20 }}>
          Em breve! O sistema de recarga estará disponível em breve. Enquanto isso, mantenha seu plano ativo para continuar gerando criativos incríveis.
        </p>
        <button
          onClick={() => setShowReloadModal(false)}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg, #ff713d, #FF9B70)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Entendi
        </button>
      </Modal>
    </div>
  );
};

export default Billing;
