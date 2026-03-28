// src/stores/useCreditStore.ts
// CREATYNG — Credit system store (Zustand + Supabase realtime)

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
  loading: boolean;
  transactions: CreditTransaction[];
  _realtimeChannel: ReturnType<typeof supabase.channel> | null;

  /** Fetch real credits from profiles.credits */
  fetchCredits: () => Promise<void>;

  /** Subscribe to realtime changes on profiles table */
  subscribeRealtime: (userId: string) => void;

  /** Unsubscribe from realtime */
  unsubscribeRealtime: () => void;

  /** Debit credits via Edge Function (returns remaining or throws) */
  debitCredits: (amount: number, description: string, referenceId?: string) => Promise<number>;

  /** Local-only helpers for optimistic UI */
  setCredits: (n: number) => void;
  addCreditsLocal: (amount: number, description: string) => void;
  getBalance: () => number;
}

export const useCreditStore = create<CreditStore>()((set, get) => ({
  credits: 0,
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
        .select('credits')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        set({ credits: data.credits ?? 0 });
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
          const newCredits = payload.new?.credits;
          if (typeof newCredits === 'number') {
            set({ credits: newCredits });
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
      // Check for 402 insufficient credits
      const parsed = typeof error === 'object' && 'context' in error
        ? error
        : null;
      throw parsed || new Error('debit_failed');
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
