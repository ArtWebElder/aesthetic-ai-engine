// src/stores/useCreditStore.ts
// CREATYNG — Credit system store (Zustand + localStorage)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CreditTransaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  date: string;
}

interface CreditStore {
  credits: number;
  transactions: CreditTransaction[];
  deductCredits: (amount: number, description: string) => boolean;
  addCredits: (amount: number, description: string) => void;
  getBalance: () => number;
}

export const useCreditStore = create<CreditStore>()(
  persist(
    (set, get) => ({
      credits: 100,
      transactions: [],

      deductCredits: (amount, description) => {
        const current = get().credits;
        if (current < amount) return false;
        set((state) => ({
          credits: state.credits - amount,
          transactions: [
            {
              id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              type: 'debit',
              amount,
              description,
              date: new Date().toISOString(),
            },
            ...state.transactions,
          ].slice(0, 100),
        }));
        return true;
      },

      addCredits: (amount, description) =>
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
    }),
    { name: 'creatyng-credits' }
  )
);
