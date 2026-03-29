import { useState, useEffect } from 'react';
import {
  Sparkles, Zap, Users, Building2, Check, Plus, TrendingUp, Clock, X,
} from 'lucide-react';
import RechargeCreditsModal from '@/components/creatyng/RechargeCreditsModal';
import { useCreditStore } from '@/stores/useCreditStore';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { supabase } from '@/services/supabaseClient';

/* ── Plans ───────────────────────────────────────────── */
const PLANS = [
  {
    id: 'free', name: 'Free', price: 'R$ 0', period: '/mês', credits: '50',
    desc: 'Para conhecer a plataforma', accent: '#8e8e96',
    Icon: Sparkles,
    features: ['50 créditos únicos', '2 templates disponíveis', 'Export PNG', "Marca d'água Creatyng"],
    missing: ['Chat AI', 'Brand Kit', 'Multi-formato', 'Suporte prioritário'],
  },
  {
    id: 'pro', name: 'Pro', price: 'R$ 49,90', period: '/mês', credits: '500',
    desc: 'Para criadores individuais', popular: true, accent: '#ff713d',
    Icon: Zap,
    features: ['500 créditos / mês', 'Recarga avulsa', 'Todos os templates', 'Export PNG, JPG, WebP', "Sem marca d'água", 'Chat AI ilimitado', 'Brand Kit básico'],
    missing: ['Multi-formato', 'Suporte prioritário'],
  },
  {
    id: 'team', name: 'Team', price: 'R$ 149,90', period: '/mês', credits: '2.000',
    desc: 'Para equipes e agências', accent: '#7C3AED',
    Icon: Users,
    features: ['2.000 créditos / mês', 'Recarga avulsa', 'Todos os templates', 'Todos os formatos', "Sem marca d'água", 'Chat AI ilimitado', 'Brand Kit completo', 'Até 5 colaboradores', 'Suporte prioritário'],
    missing: [],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 'Sob consulta', period: '', credits: 'Ilimitado',
    desc: 'Para grandes operações', accent: 'hsl(var(--foreground))',
    Icon: Building2,
    features: ['Créditos ilimitados', 'API dedicada', 'White-label', 'SSO & compliance', 'Gerente de conta', 'SLA garantido', 'Colaboradores ilimitados', 'Onboarding dedicado'],
    missing: [],
  },
];

/* ── History (placeholder) ─────────────────────────────── */
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
  const [subLoading, setSubLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const { user } = useAuth();
  const { t } = useI18n();
  const credits = useCreditStore((s) => s.credits);
  const planCredits = useCreditStore((s) => s.planCredits);
  const bonusCredits = useCreditStore((s) => s.bonusCredits);
  const plan = useCreditStore((s) => s.plan);
  const planRenewsAt = useCreditStore((s) => s.planRenewsAt);
  const fetchCredits = useCreditStore((s) => s.fetchCredits);
  const subscribeRealtime = useCreditStore((s) => s.subscribeRealtime);
  const unsubscribeRealtime = useCreditStore((s) => s.unsubscribeRealtime);

  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    if (user) {
      fetchCredits();
      subscribeRealtime(user.id);
      return () => unsubscribeRealtime();
    }
  }, [user, fetchCredits, subscribeRealtime, unsubscribeRealtime]);

  const currentPlan = plan || 'free';
  const totalCredits = currentPlan === 'team' ? 2000 : currentPlan === 'pro' ? 500 : 50;
  const currentCredits = credits ?? 0;
  const usedCredits = Math.max(0, totalCredits - planCredits);
  const pct = Math.round((usedCredits / totalCredits) * 100);

  // Days until renewal
  const daysUntilRenewal = planRenewsAt
    ? Math.max(0, Math.ceil((new Date(planRenewsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  async function handleSubscribe(planId: string) {
    setSubError(null);
    setSubLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error: fnErr } = await supabase.functions.invoke('create-subscription', {
        body: { plan: planId },
      });
      if (fnErr) {
        const errBody = typeof fnErr === 'object' && 'context' in fnErr
          ? await (fnErr as { context: { json: () => Promise<Record<string, string>> } }).context.json().catch(() => null)
          : null;
        throw new Error(errBody?.error || data?.error || 'subscription_error');
      }
      if (!data?.url) throw new Error(data?.error || 'no_checkout_url');
      window.location.href = data.url;
    } catch (err: unknown) {
      setSubError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm(t('billing.cancel_confirm'))) return;
    setCancelLoading(true);
    setSubError(null);
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error: fnErr } = await supabase.functions.invoke('cancel-subscription', {});
      if (fnErr) {
        const errBody = typeof fnErr === 'object' && 'context' in fnErr
          ? await (fnErr as { context: { json: () => Promise<Record<string, string>> } }).context.json().catch(() => null)
          : null;
        throw new Error(errBody?.error || data?.error || 'cancel_error');
      }
      // Refresh profile
      fetchCredits();
    } catch (err: unknown) {
      setSubError(err instanceof Error ? err.message : String(err));
    } finally {
      setCancelLoading(false);
    }
  }

  function getPlanCta(p: typeof PLANS[number]) {
    if (p.id === currentPlan) return t('billing.cta.current');
    if (p.id === 'enterprise') return t('billing.cta.contact_sales');
    if (p.id === 'free' && currentPlan !== 'free') return t('billing.cta.downgrade');
    return `${t('billing.cta.subscribe')} ${p.name}`;
  }

  function handlePlanClick(p: typeof PLANS[number]) {
    if (p.id === currentPlan) return;
    if (p.id === 'enterprise') {
      window.open('mailto:contato@creatyng.com?subject=Enterprise Plan', '_blank');
    } else if (p.id === 'free') {
      handleCancel();
    } else {
      handleSubscribe(p.id);
    }
  }

  return (
    <div style={{
      fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
      minHeight: '100%', color: 'hsl(var(--foreground))', padding: '28px 36px 48px',
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
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 3 }}>{t('billing.page_title')}</h1>
          <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>{t('billing.page_subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'hsl(var(--muted))', borderRadius: 8, padding: 3 }}>
          {[{ id: 'plans' as const, label: t('billing.tab.plans') }, { id: 'usage' as const, label: t('billing.tab.usage') }].map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', fontFamily: 'inherit',
              background: tab === tb.id ? 'hsl(var(--card))' : 'transparent',
              color: tab === tb.id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              fontWeight: tab === tb.id ? 600 : 400,
              fontSize: 13, cursor: 'pointer',
              boxShadow: tab === tb.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 150ms',
            }}>{tb.label}</button>
          ))}
        </div>
      </div>

      {tab === 'plans' && (
        <>
          {/* Usage summary card */}
          <div style={{
            background: 'hsl(var(--card))', borderRadius: 14, border: '1px solid hsl(var(--border))',
            padding: '20px 24px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            animation: ready ? 'fdUp 450ms 60ms ease both' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('billing.summary.current_plan')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: currentPlan === 'team' ? '#7C3AED' : currentPlan === 'pro' ? '#ff713d' : '#8e8e96' }}>
                    {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                  </span>
                  {currentPlan !== 'free' && (
                    <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--primary) / 0.1)', padding: '2px 8px', borderRadius: 5, fontWeight: 500 }}>
                      {currentPlan === 'team' ? 'R$ 149,90/mês' : 'R$ 49,90/mês'}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: 'hsl(var(--border))' }} />
              <div>
                <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('billing.summary.credits_used')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 700 }}>{currentCredits}</span>
                  <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                    ({t('billing.summary.plan_label')}: {planCredits} + {t('billing.summary.bonus_label')}: {bonusCredits})
                  </span>
                </div>
                <div style={{ width: 180, height: 6, borderRadius: 3, background: 'hsl(var(--muted))', marginTop: 6 }}>
                  <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #ff713d, #FF9B70)', transition: 'width 600ms ease' }} />
                </div>
              </div>
              {daysUntilRenewal !== null && (
                <>
                  <div style={{ width: 1, height: 40, background: 'hsl(var(--border))' }} />
                  <div>
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('billing.summary.renews_in')}</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{daysUntilRenewal} {t('billing.summary.days')}</div>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {currentPlan !== 'free' && (
                <button
                  onClick={() => setShowReloadModal(true)}
                  style={{
                    padding: '9px 20px', borderRadius: 9, border: '1.5px solid #ff713d',
                    background: 'hsl(var(--primary) / 0.1)', color: '#ff713d', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Plus size={15} /> {t('billing.summary.recharge')}
                </button>
              )}
              {currentPlan !== 'free' && (
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  style={{
                    padding: '9px 16px', borderRadius: 9, border: '1px solid hsl(var(--border))',
                    background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500,
                    cursor: cancelLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    opacity: cancelLoading ? 0.6 : 1,
                  }}
                >
                  {cancelLoading ? '...' : t('billing.cancel_plan')}
                </button>
              )}
            </div>
          </div>

          {/* Subscription error */}
          {subError && (
            <div style={{
              marginBottom: 16, padding: '10px 16px', borderRadius: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{subError}</span>
              <button onClick={() => setSubError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X size={14} /></button>
            </div>
          )}

          {/* Plan cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
            animation: ready ? 'fdUp 450ms 140ms ease both' : 'none',
          }}>
            {PLANS.map((p, i) => {
              const isCurrent = p.id === currentPlan;
              const isLoading = subLoading === p.id;
              return (
                <div key={p.id} style={{
                  background: 'hsl(var(--card))', borderRadius: 14, overflow: 'hidden',
                  border: isCurrent ? '2px solid #ff713d' : '1px solid hsl(var(--border))',
                  boxShadow: isCurrent ? '0 4px 20px rgba(255,113,61,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                  position: 'relative', display: 'flex', flexDirection: 'column',
                  animation: ready ? `scIn 340ms ${140 + i * 50}ms ease both` : 'none',
                }}>
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12, padding: '3px 10px', borderRadius: 6,
                      background: '#ff713d', color: '#fff', fontSize: 10, fontWeight: 600,
                    }}>{t('billing.current_plan_badge')}</div>
                  )}
                  <div style={{ padding: '22px 20px 0' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, marginBottom: 14,
                      background: p.id === 'free' ? 'hsl(var(--muted))' : p.id === 'pro' ? 'hsl(var(--primary) / 0.1)' : p.id === 'team' ? 'rgba(124,58,237,0.08)' : 'hsl(var(--muted))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.accent,
                    }}>
                      <p.Icon size={18} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{p.name}</h3>
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>{p.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 4 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: p.accent }}>{p.price}</span>
                      <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{p.period}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 18 }}>
                      <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{p.credits}</span> {p.id === 'free' ? t('billing.one_time_credits') : t('billing.credits_per_month')}
                    </div>
                  </div>
                  {/* Features */}
                  <div style={{ padding: '0 20px 20px', flex: 1 }}>
                    <div style={{ height: 1, background: 'hsl(var(--border))', marginBottom: 16 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {p.features.map((f, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                          <Check size={16} color="#10B981" /><span>{f}</span>
                        </div>
                      ))}
                      {p.missing.map((f, j) => (
                        <div key={`m${j}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'hsl(var(--muted-foreground))' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          <span style={{ textDecoration: 'line-through' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* CTA */}
                  <div style={{ padding: '0 20px 20px' }}>
                    <button
                      onClick={() => handlePlanClick(p)}
                      disabled={isCurrent || isLoading}
                      style={{
                        width: '100%', padding: '10px 0', borderRadius: 9,
                        cursor: isCurrent || isLoading ? 'default' : 'pointer',
                        fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all 180ms',
                        opacity: isLoading ? 0.7 : 1,
                        ...(isCurrent ? {
                          border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))',
                        } : p.id === 'enterprise' ? {
                          border: '1.5px solid hsl(var(--foreground))', background: 'transparent', color: 'hsl(var(--foreground))',
                        } : {
                          border: 'none', background: `linear-gradient(135deg, ${p.accent}, ${p.accent}BB)`, color: '#fff',
                          boxShadow: `0 3px 10px ${p.accent}33`,
                        }),
                      }}>
                      {isLoading ? t('billing.subscribing') : getPlanCta(p)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'usage' && (
        <div style={{ animation: ready ? 'fdUp 450ms 60ms ease both' : 'none' }}>
          {/* KPI cards */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
            {[
              { label: t('billing.kpi.remaining'), value: String(currentCredits), sub: `${t('billing.summary.plan_label')}: ${planCredits} + ${t('billing.summary.bonus_label')}: ${bonusCredits}`, color: '#ff713d' },
              { label: t('billing.kpi.generations'), value: '—', sub: '', color: '#7C3AED', trend: false },
              { label: t('billing.kpi.avg_daily'), value: '—', sub: '', color: '#10B981' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, background: 'hsl(var(--card))', borderRadius: 12, border: '1px solid hsl(var(--border))',
                padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {s.trend && <TrendingUp size={14} color="#10B981" />}{s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* History table */}
          <div style={{ background: 'hsl(var(--card))', borderRadius: 14, border: '1px solid hsl(var(--border))', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>{t('billing.history.title')}</h3>
            </div>
            {HISTORY.map((h, i) => (
              <div key={i} style={{
                padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: i < HISTORY.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                transition: 'background 120ms',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'}
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
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{h.action}</div>
                    <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>{h.date}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 600, fontFamily: 'monospace',
                  color: h.credits > 0 ? '#10B981' : 'hsl(var(--muted-foreground))',
                }}>
                  {h.credits > 0 ? '+' : ''}{h.credits}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <RechargeCreditsModal
        open={showReloadModal}
        onClose={() => setShowReloadModal(false)}
        currentCredits={currentCredits}
        totalCredits={totalCredits}
      />
    </div>
  );
};

export default Billing;
