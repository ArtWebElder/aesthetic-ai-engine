// src/stores/useCreditStore.ts
// CREATYNG — Credit system store (Zustand + Supabase realtime)
// credits = plan_credits + bonus_credits

import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';

export interface CreditTransaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  date: string;
}

interface CreditStore {
  credits: number;
  planCredits: number;
  bonusCredits: number;
  plan: string;
  planRenewsAt: string | null;
  loading: boolean;
  transactions: CreditTransaction[];
  _realtimeChannel: ReturnType<typeof supabase.channel> | null;

  fetchCredits: () => Promise<void>;
  subscribeRealtime: (userId: string) => void;
  unsubscribeRealtime: () => void;
  debitCredits: (amount: number, description: string, referenceId?: string) => Promise<number>;
  setCredits: (n: number) => void;
  addCreditsLocal: (amount: number, description: string) => void;
  getBalance: () => number;
}

export const useCreditStore = create<CreditStore>()((set, get) => ({
  credits: 0,
  planCredits: 0,
  bonusCredits: 0,
  plan: 'free',
  planRenewsAt: null,
  loading: true,
  transactions: [],
  _realtimeChannel: null,

  fetchCredits: async () => {
    try {
      set({ loading: true });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ loading: false }); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('credits, plan_credits, bonus_credits, plan, plan_renews_at')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        let pc = data.plan_credits ?? 0;
        let bc = data.bonus_credits ?? 0;
        // BUG 5 fix: if both plan_credits and bonus_credits are 0 but legacy
        // credits column has a balance, treat it as bonus_credits
        if (pc === 0 && bc === 0 && (data.credits ?? 0) > 0) {
          bc = data.credits;
        }
        const total = pc + bc;
        set({
          credits: total,
          planCredits: pc,
          bonusCredits: bc,
          plan: data.plan ?? 'free',
          planRenewsAt: data.plan_renews_at ?? null,
        });
      }
    } catch (e) {
      console.warn('[CreditStore] fetchCredits failed:', e);
    } finally {
      set({ loading: false });
    }
  },

  subscribeRealtime: (userId: string) => {
    const existing = get()._realtimeChannel;
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase
      .channel('profiles-credits')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const p = payload.new;
          if (p) {
            let pc = p.plan_credits ?? get().planCredits;
            let bc = p.bonus_credits ?? get().bonusCredits;
            // BUG 5 fix: legacy credits column fallback
            if (pc === 0 && bc === 0 && (p.credits ?? 0) > 0) {
              bc = p.credits;
            }
            const total = pc + bc;
            set({
              credits: total,
              planCredits: pc,
              bonusCredits: bc,
              plan: p.plan ?? get().plan,
              planRenewsAt: p.plan_renews_at ?? get().planRenewsAt,
            });
          }
        }
      )
      .subscribe();

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    const channel = get()._realtimeChannel;
    if (channel) {
      supabase.removeChannel(channel);
      set({ _realtimeChannel: null });
    }
  },

  debitCredits: async (amount, description, referenceId) => {
    const { data, error } = await supabase.functions.invoke('debit-credits', {
      body: { amount, description, reference_id: referenceId },
    });

    if (error) {
      let errBody: Record<string, unknown> | null = null;
      try {
        if (typeof error === 'object' && 'context' in error) {
          errBody = await (error as { context: Response }).context.json();
        }
      } catch { /* ignore parse failures */ }

      if (errBody?.error === 'insufficient_credits') {
        const err = new Error('insufficient_credits') as Error & { current: number; required: number };
        err.current = (errBody.current as number) ?? 0;
        err.required = (errBody.required as number) ?? amount;
        throw err;
      }
      throw new Error((errBody?.error as string) || 'debit_failed');
    }

    if (data?.error === 'insufficient_credits') {
      const err = new Error('insufficient_credits') as Error & { current: number; required: number };
      err.current = data.current;
      err.required = data.required;
      throw err;
    }

    if (data?.success) {
      set({
        credits: data.remaining,
        planCredits: data.remaining_plan ?? get().planCredits,
        bonusCredits: data.remaining_bonus ?? get().bonusCredits,
        transactions: [
          {
            id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'debit',
            amount,
            description,
            date: new Date().toISOString(),
          },
          ...get().transactions,
        ].slice(0, 100),
      });
      return data.remaining;
    }

    throw new Error(data?.error || 'debit_failed');
  },

  setCredits: (n) => set({ credits: n }),

  addCreditsLocal: (amount, description) =>
    set((state) => ({
      credits: state.credits + amount,
      bonusCredits: state.bonusCredits + amount,
      transactions: [
        {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'credit',
          amount,
          description,
          date: new Date().toISOString(),
        },
        ...state.transactions,
      ].slice(0, 100),
    })),

  getBalance: () => get().credits,
}));
