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
import AuroraDivider from '@/components/AuroraDivider';
import StatCard from '@/components/StatCard';
import { mockCredits } from '@/lib/mocks/data';

const plans = [
  { name: 'Starter', price: 19, credits: 100, features: ['100 credits/mo', 'All templates', 'HD export'] },
  { name: 'Pro', price: 49, credits: 500, features: ['500 credits/mo', 'Priority generation', '2K export', 'BYOK'] },
  { name: 'Business', price: 99, credits: 1500, features: ['1500 credits/mo', 'API access', '4K export', 'Team seats'] },
];

const creditPacks = [
  { amount: 50, price: 5 },
  { amount: 150, price: 12 },
  { amount: 300, price: 20 },
];

const Billing = () => {
  const [buyOpen, setBuyOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your plan and credits.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Current Plan" value="Starter" icon={CreditCard} subtitle="$19/month" />
        <StatCard title="Credits" value={mockCredits.current} icon={Coins} subtitle="Remaining" />
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {plans.map((plan, i) => (
            <div key={plan.name} className={`glass-surface rounded-lg p-5 hover-lift ${i === 1 ? 'ring-1 ring-primary/30' : ''}`}>
              <h3 className="font-heading font-semibold">{plan.name}</h3>
              <p className="text-2xl font-heading font-bold mt-1">${plan.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={i === 1 ? 'default' : 'outline'} size="sm" className="w-full mt-4" disabled>
                {i === 0 ? 'Current' : 'Upgrade'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Buy credits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold">Buy Credits</h2>
          <Button variant="outline" size="sm" onClick={() => setBuyOpen(true)}>Buy</Button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {creditPacks.map((pack) => (
            <button key={pack.amount} className="glass-surface rounded-lg p-4 text-center hover-lift" onClick={() => setBuyOpen(true)}>
              <p className="text-xl font-heading font-bold">{pack.amount}</p>
              <p className="text-xs text-muted-foreground">credits</p>
              <p className="text-sm font-medium mt-2">${pack.price}</p>
            </button>
          ))}
        </div>
      </div>

      <AuroraDivider />

      {/* BYOK */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-4">Use Your Own Key (BYOK)</h2>
        <div className="glass-surface rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Connect your own AI provider</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Provider</Label>
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
            <Label className="text-xs">API Key</Label>
            <Input type="password" placeholder="sk-..." />
          </div>
          <Button variant="outline" size="sm" disabled>Save Key</Button>
        </div>
      </div>

      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="glass-surface-strong sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Buy Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {creditPacks.map((pack) => (
              <button key={pack.amount} className="w-full glass-surface rounded-lg p-4 flex items-center justify-between hover-lift">
                <span className="font-medium">{pack.amount} credits</span>
                <span className="text-sm">${pack.price}</span>
              </button>
            ))}
            <Button className="w-full mt-2" disabled>Pay with Stripe</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
