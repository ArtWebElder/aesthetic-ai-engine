import { useState } from 'react';
import { CreditCard, Coins, Key, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatCard from '@/components/StatCard';
import { mockCredits } from '@/lib/mocks/data';
import { useI18n } from '@/i18n';

const creditPacks = [
  { amount: 50, price: 5 },
  { amount: 150, price: 12 },
  { amount: 300, price: 20 },
];

const Billing = () => {
  const [buyOpen, setBuyOpen] = useState(false);
  const { t } = useI18n();
  const plans = [
    { name: t('billing.plan.starter'), price: 19, credits: 100, features: [t('billing.feature.100_credits'), t('billing.feature.all_templates'), t('billing.feature.hd_export')] },
    { name: t('billing.plan.pro'), price: 49, credits: 500, features: [t('billing.feature.500_credits'), t('billing.feature.priority_generation'), t('billing.feature.2k_export'), t('billing.feature.byok')] },
    { name: t('billing.plan.business'), price: 99, credits: 1500, features: [t('billing.feature.1500_credits'), t('billing.feature.api_access'), t('billing.feature.4k_export'), t('billing.feature.team_seats')] },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">{t('billing.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('billing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard title={t('billing.current_plan')} value={t('billing.plan.starter')} icon={CreditCard} subtitle={t('billing.per_month', { price: 19 })} />
        <StatCard title={t('billing.credits')} value={mockCredits.current} icon={Coins} subtitle={t('billing.remaining')} />
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">{t('billing.plans')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plans.map((plan, i) => (
            <div key={plan.name} className={`bg-card border rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/[0.04] ${i === 1 ? 'border-primary/40' : 'border-border/50'}`}>
              <h3 className="font-heading font-semibold">{plan.name}</h3>
              <p className="text-2xl font-heading font-bold mt-1">${plan.price}<span className="text-sm text-muted-foreground font-normal">{t('billing.mo_suffix')}</span></p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={i === 1 ? 'default' : 'outline'} size="sm" className="w-full mt-4" disabled>
                {i === 0 ? t('billing.current') : t('billing.upgrade')}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Buy credits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold">{t('billing.buy_credits')}</h2>
          <Button variant="outline" size="sm" onClick={() => setBuyOpen(true)}>{t('billing.buy')}</Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {creditPacks.map((pack) => (
            <button key={pack.amount} className="bg-card border border-border/50 rounded-xl p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/[0.04]" onClick={() => setBuyOpen(true)}>
              <p className="text-xl font-heading font-bold">{pack.amount}</p>
              <p className="text-xs text-muted-foreground">{t('billing.credits_unit')}</p>
              <p className="text-sm font-medium mt-2">${pack.price}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* BYOK */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">{t('billing.byok_title')}</h2>
        <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('billing.byok_subtitle')}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('billing.provider')}</Label>
            <Select defaultValue="openai">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="replicate">Replicate</SelectItem>
                <SelectItem value="stability">Stability AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t('billing.api_key')}</Label>
            <Input type="password" placeholder={t("billing.api_key_placeholder")} />
          </div>
          <Button variant="outline" size="sm" disabled>{t('billing.save_key')}</Button>
        </div>
      </div>

      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="glass-surface-strong sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">{t('billing.buy_credits')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {creditPacks.map((pack) => (
              <button key={pack.amount} className="w-full bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-muted/30">
                <span className="font-medium">{t('billing.credit_pack', { amount: pack.amount })}</span>
                <span className="text-sm">${pack.price}</span>
              </button>
            ))}
            <Button className="w-full mt-2" disabled>{t('billing.pay_with_stripe')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
