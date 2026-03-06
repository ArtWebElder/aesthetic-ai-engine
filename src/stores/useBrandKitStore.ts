// src/stores/useBrandKitStore.ts
// CREATYNG — MASTER SPEC DIFF 16.2 + PRE.2
// Store Zustand para Brand Kits.
// Storage via camada de abstração em src/lib/brandKitStorage.ts
// Para migrar para Supabase: trocar `brandKitStorage` por `supabaseBrandKitStorage`.

import { create } from "zustand";
import type { BrandKit, BrandKitDraft } from "@/types/brandKit";
import { brandKitStorage } from "@/lib/brandKitStorage";

interface BrandKitStore {
  kits: BrandKit[];
  activeKitId?: string;
  loading: boolean;
  error?: string;

  // CRUD
  loadKits: () => Promise<void>;
  createKit: (draft: BrandKitDraft) => Promise<BrandKit>;
  updateKit: (id: string, patch: Partial<BrandKitDraft>) => Promise<void>;
  deleteKit: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;

  // Seleção ativa (pré-carregar no wizard)
  setActiveKit: (id: string | undefined) => void;
  getActiveKit: () => BrandKit | undefined;
}

export const useBrandKitStore = create<BrandKitStore>((set, get) => ({
  kits: [],
  loading: false,

  loadKits: async () => {
    set({ loading: true, error: undefined });
    try {
      const kits = await brandKitStorage.load();
      set({ kits, loading: false });
    } catch (err) {
      set({ loading: false, error: String(err) });
    }
  },

  createKit: async (draft) => {
    const kit = await brandKitStorage.create(draft);
    set({ kits: [...get().kits, kit] });
    return kit;
  },

  updateKit: async (id, patch) => {
    const updated = await brandKitStorage.update(id, patch);
    set({ kits: get().kits.map((k) => (k.id === id ? updated : k)) });
  },

  deleteKit: async (id) => {
    await brandKitStorage.remove(id);
    set({
      kits: get().kits.filter((k) => k.id !== id),
      activeKitId: get().activeKitId === id ? undefined : get().activeKitId,
    });
  },

  setDefault: async (id) => {
    const kits = await brandKitStorage.setDefault(id);
    set({ kits });
  },

  setActiveKit: (id) => set({ activeKitId: id }),

  getActiveKit: () => {
    const { kits, activeKitId } = get();
    if (activeKitId) return kits.find((k) => k.id === activeKitId);
    return kits.find((k) => k.isDefault);
  },
}));
