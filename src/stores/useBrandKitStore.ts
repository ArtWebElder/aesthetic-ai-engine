// src/stores/useBrandKitStore.ts
// CREATYNG — MASTER SPEC DIFF 16.2
// Store Zustand para Brand Kits. CRUD via Supabase (quando disponível).
// Fallback: localStorage para sessão offline.

import { create } from "zustand";
import type { BrandKit, BrandKitDraft } from "@/types/brandKit";
import { DEFAULT_BRAND_KIT_DRAFT } from "@/types/brandKit";

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

// ─── CHAVE DE STORAGE LOCAL ───────────────────────────────────────────────────

const LS_KEY = "creatyng_brand_kits";

function loadFromLS(): BrandKit[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as BrandKit[];
  } catch { /* */ }
  return [];
}

function saveToLS(kits: BrandKit[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(kits));
  } catch { /* */ }
}

function generateId(): string {
  return crypto.randomUUID();
}

// ─── STORE ────────────────────────────────────────────────────────────────────

export const useBrandKitStore = create<BrandKitStore>((set, get) => ({
  kits: [],
  loading: false,

  // ── Carregar kits ─────────────────────────────────────────────────────────────

  loadKits: async () => {
    set({ loading: true, error: undefined });
    try {
      // TODO: substituir por Supabase quando configurado
      // const { data, error } = await supabase.from('brand_kits').select('*').order('created_at')
      // if (error) throw error
      // const kits = data.map(brandKitFromRow)
      const kits = loadFromLS();
      set({ kits, loading: false });
    } catch (err) {
      set({ loading: false, error: String(err) });
    }
  },

  // ── Criar kit ────────────────────────────────────────────────────────────────

  createKit: async (draft) => {
    const now = new Date().toISOString();
    const kit: BrandKit = {
      ...draft,
      id: generateId(),
      userId: "local",              // substituir por auth.user.id
      createdAt: now,
      updatedAt: now,
    };

    // TODO: Supabase insert
    const kits = [...get().kits, kit];
    saveToLS(kits);
    set({ kits });
    return kit;
  },

  // ── Atualizar kit ────────────────────────────────────────────────────────────

  updateKit: async (id, patch) => {
    const kits = get().kits.map((k) =>
      k.id === id
        ? { ...k, ...patch, updatedAt: new Date().toISOString() }
        : k
    );
    // TODO: Supabase update
    saveToLS(kits);
    set({ kits });
  },

  // ── Deletar kit ──────────────────────────────────────────────────────────────

  deleteKit: async (id) => {
    const kits = get().kits.filter((k) => k.id !== id);
    // TODO: Supabase delete
    saveToLS(kits);
    set({ kits, activeKitId: get().activeKitId === id ? undefined : get().activeKitId });
  },

  // ── Definir como default ─────────────────────────────────────────────────────

  setDefault: async (id) => {
    const kits = get().kits.map((k) => ({
      ...k,
      isDefault: k.id === id,
      updatedAt: k.id === id ? new Date().toISOString() : k.updatedAt,
    }));
    // TODO: Supabase update (enforce_single_default_kit trigger faz isso no banco)
    saveToLS(kits);
    set({ kits });
  },

  // ── Seleção ativa ─────────────────────────────────────────────────────────────

  setActiveKit: (id) => set({ activeKitId: id }),

  getActiveKit: () => {
    const { kits, activeKitId } = get();
    if (activeKitId) return kits.find((k) => k.id === activeKitId);
    return kits.find((k) => k.isDefault);
  },
}));
