import { useState } from 'react';
import {
  CreditCard, Coins, Zap, Users, Building2, Check, X,
  RefreshCw, Sparkles, TrendingUp, Calendar,
} from 'lucide-react';
import { Button, Badge, KPICard, ProgressBar } from '@/components/creatyng';
import { mockCredits } from '@/lib/mocks/data';
import { useI18n } from '@/i18n';

/* ── Static data ──────────────────────────────────────── */
const PLANS = [
  {
    id: 'free',
    nameKey: 'billing.plan_name.free',
    price: 0,
    creditsKey: 'billing.plan_credits.free',
    Icon: Sparkles,
    current: false,
    features: [
      { key: 'billing.feature.10_credits', ok: true },
      { key: 'billing.feature.all_templates', ok: true },
      { key: 'billing.feature.hd_export', ok: true },
      { key: 'billing.feature.priority_generation', ok: false },
      { key: 'billing.feature.4k_export', ok: false },
    ],
  },
  {
    id: 'pro',
    nameKey: 'billing.plan_name.pro',
    price: 29,
    creditsKey: 'billing.plan_credits.pro',
    Icon: Zap,
    current: true,
    features: [
      { key: 'billing.feature.500_credits', ok: true },
      { key: 'billing.feature.all_templates', ok: true },
      { key: 'billing.feature.2k_export', ok: true },
      { key: 'billing.feature.priority_generation', ok: true },
      { key: 'billing.feature.byok', ok: true },
    ],
  },
  {
    id: 'team',
    nameKey: 'billing.plan_name.team',
    price: 79,
    creditsKey: 'billing.plan_credits.team',
    Icon: Users,
    current: false,
    features: [
      { key: 'billing.feature.1500_credits', ok: true },
      { key: 'billing.feature.all_templates', ok: true },
      { key: 'billing.feature.4k_export', ok: true },
      { key: 'billing.feature.priority_generation', ok: true },
      { key: 'billing.feature.team_seats', ok: true },
    ],
  },
  {
    id: 'enterprise',
    nameKey: 'billing.plan_name.enterprise',
    price: 0,
    creditsKey: 'billing.plan_credits.enterprise',
    Icon: Building2,
    current: false,
    features: [
      { key: 'billing.feature.unlimited_credits', ok: true },
      { key: 'billing.feature.all_templates', ok: true },
      { key: 'billing.feature.4k_export', ok: true },
      { key: 'billing.feature.api_access', ok: true },
      { key: 'billing.feature.team_seats', ok: true },
    ],
  },
];

const HISTORY = [
  { id: 'h1', action: 'billing.hist.generation', type: 'generation', credits: -1, date: '2026-03-10' },
  { id: 'h2', action: 'billing.hist.generation', type: 'generation', credits: -1, date: '2026-03-10' },
  { id: 'h3', action: 'billing.hist.recharge', type: 'recharge', credits: +100, date: '2026-03-09' },
  { id: 'h4', action: 'billing.hist.generation', type: 'generation', credits: -1, date: '2026-03-08' },
  { id: 'h5', action: 'billing.hist.renewal', type: 'renewal', credits: +500, date: '2026-03-01' },
];

const HISTORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  generation: Sparkles,
  recharge: RefreshCw,
  renewal: Calendar,
};

/* ── Component ────────────────────────────────────────── */
const Billing = () => {
  const { t } = useI18n();
  const [tab, setTab] = useState<'plans' | 'usage'>('plans');

  const totalCredits = 500;
  const usedCredits = totalCredits - mockCredits.current;

  return (
    <div className="min-h-full px-6 py-7 max-w-5xl mx-auto space-y-7">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold text-foreground">{t('billing.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('billing.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex p-0.5 bg-muted rounded-xl w-fit animate-fade-up" style={{ animationDelay: '40ms' }}>
        {(['plans', 'usage'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              tab === tb ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(`billing.tab.${tb}`)}
          </button>
        ))}
      </div>

      {tab === 'plans' ? (
        <>
          {/* Credit summary card */}
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{t('billing.current_plan')}: <span className="text-primary">Pro</span></span>
                <span className="text-muted-foreground text-xs">{t('billing.renews_in', { days: '18' })}</span>
              </div>
              <ProgressBar value={usedCredits} max={totalCredits} label={t('billing.credits_used', { used: String(usedCredits), total: String(totalCredits) })} showValue />
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              {t('billing.recharge')}
            </Button>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-card border rounded-2xl p-5 flex flex-col transition-all duration-200 ${
                  plan.current
                    ? 'border-creatyng-accent shadow-[0_0_0_2px_rgba(255,113,61,0.15)]'
                    : 'border-border hover:border-primary/30 hover:shadow-md'
                }`}
              >
                {plan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="accent" className="text-[10px] shadow-sm">{t('billing.current_plan_badge')}</Badge>
                  </div>
                )}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${plan.current ? 'bg-creatyng-accent-pale' : 'bg-muted'}`}>
                  <plan.Icon className={`w-4 h-4 ${plan.current ? 'text-creatyng-accent' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t(plan.nameKey)}</h3>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {plan.price === 0 && plan.id === 'enterprise'
                    ? t('billing.price.custom')
                    : plan.price === 0
                    ? t('billing.price.free')
                    : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t(plan.creditsKey)}</p>

                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.key} className="flex items-center gap-2 text-xs">
                      {f.ok
                        ? <Check className="w-3.5 h-3.5 text-creatyng-success shrink-0" />
                        : <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
                      <span className={f.ok ? 'text-foreground' : 'text-muted-foreground/50 line-through'}>
                        {t(f.key)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.current ? 'primary' : 'outline'}
                  size="sm"
                  className="mt-5 w-full"
                  disabled={plan.current || plan.id === 'enterprise'}
                >
                  {plan.current ? t('billing.current') : plan.id === 'enterprise' ? t('billing.contact') : t('billing.upgrade')}
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <KPICard
              label={t('billing.kpi.remaining')}
              value={mockCredits.current}
              icon={<Coins className="w-4 h-4" />}
              trend={12}
            />
            <KPICard
              label={t('billing.kpi.generations')}
              value={47}
              icon={<Sparkles className="w-4 h-4" />}
              trend={5}
            />
            <KPICard
              label={t('billing.kpi.avg_daily')}
              value="1.5"
              icon={<TrendingUp className="w-4 h-4" />}
              trend={-2}
            />
          </div>

          {/* History table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">{t('billing.history.title')}</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-left font-medium">{t('billing.history.col.action')}</th>
                  <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">{t('billing.history.col.type')}</th>
                  <th className="px-5 py-3 text-right font-medium">{t('billing.history.col.credits')}</th>
                  <th className="px-5 py-3 text-right font-medium hidden md:table-cell">{t('billing.history.col.date')}</th>
                </tr>
              </thead>
              <tbody>
                {HISTORY.map((h) => {
                  const Icon = HISTORY_ICONS[h.type] ?? Sparkles;
                  return (
                    <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <span className="text-foreground">{t(h.action)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <Badge variant={h.type === 'recharge' || h.type === 'renewal' ? 'success' : 'default'} className="text-[10px]">
                          {h.type}
                        </Badge>
                      </td>
                      <td className={`px-5 py-3 text-right font-medium tabular-nums ${h.credits > 0 ? 'text-creatyng-success' : 'text-foreground'}`}>
                        {h.credits > 0 ? `+${h.credits}` : h.credits}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground hidden md:table-cell">{h.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Billing;
