// src/lib/brandKitStorage.ts
// CREATYNG — PRE.2 Camada de abstração de storage para Brand Kit
// Troque a implementação ativa sem tocar no store.

import type { BrandKit, BrandKitDraft } from "@/types/brandKit";

// ─── INTERFACE ────────────────────────────────────────────────────────────────

export interface BrandKitStorage {
  load(): Promise<BrandKit[]>;
  create(draft: BrandKitDraft): Promise<BrandKit>;
  update(id: string, patch: Partial<BrandKitDraft>): Promise<BrandKit>;
  remove(id: string): Promise<void>;
  setDefault(id: string): Promise<BrandKit[]>;
}

// ─── IMPL: localStorage ───────────────────────────────────────────────────────

const LS_KEY = "creatyng_brand_kits";

function generateId(): string {
  return crypto.randomUUID();
}

function readLS(): BrandKit[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as BrandKit[];
  } catch { /* */ }
  return [];
}

function writeLS(kits: BrandKit[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(kits));
  } catch { /* */ }
}

export const localStorageBrandKitStorage: BrandKitStorage = {
  async load() {
    return readLS();
  },

  async create(draft) {
    const now = new Date().toISOString();
    const kit: BrandKit = {
      ...draft,
      id: generateId(),
      userId: "local",
      createdAt: now,
      updatedAt: now,
    };
    const kits = [...readLS(), kit];
    writeLS(kits);
    return kit;
  },

  async update(id, patch) {
    const kits = readLS();
    const idx = kits.findIndex((k) => k.id === id);
    if (idx === -1) throw new Error(`BrandKit ${id} not found`);
    kits[idx] = { ...kits[idx], ...patch, updatedAt: new Date().toISOString() };
    writeLS(kits);
    return kits[idx];
  },

  async remove(id) {
    const kits = readLS().filter((k) => k.id !== id);
    writeLS(kits);
  },

  async setDefault(id) {
    const kits = readLS().map((k) => ({
      ...k,
      isDefault: k.id === id,
      updatedAt: k.id === id ? new Date().toISOString() : k.updatedAt,
    }));
    writeLS(kits);
    return kits;
  },
};

// ─── IMPL: Supabase (stub — substituir quando Supabase estiver configurado) ───

export const supabaseBrandKitStorage: BrandKitStorage = {
  async load() {
    // TODO: const { data, error } = await supabase.from('brand_kits').select('*').order('created_at')
    // if (error) throw error
    // return data.map(brandKitFromRow)
    throw new Error("Supabase storage not configured");
  },

  async create(_draft) {
    // TODO: const { data, error } = await supabase.from('brand_kits').insert(brandKitToRow(draft)).select().single()
    // if (error) throw error
    // return brandKitFromRow(data)
    throw new Error("Supabase storage not configured");
  },

  async update(_id, _patch) {
    // TODO: const { data, error } = await supabase.from('brand_kits').update({ ...patch, updated_at: new Date() }).eq('id', id).select().single()
    // if (error) throw error
    // return brandKitFromRow(data)
    throw new Error("Supabase storage not configured");
  },

  async remove(_id) {
    // TODO: const { error } = await supabase.from('brand_kits').delete().eq('id', id)
    // if (error) throw error
    throw new Error("Supabase storage not configured");
  },

  async setDefault(_id) {
    // TODO: trigger enforce_single_default_kit faz isso no banco
    // const { error } = await supabase.from('brand_kits').update({ is_default: true }).eq('id', id)
    // if (error) throw error
    // return load()
    throw new Error("Supabase storage not configured");
  },
};

// ─── IMPLEMENTAÇÃO ATIVA ──────────────────────────────────────────────────────
// Trocar para supabaseBrandKitStorage quando Supabase estiver configurado.

export const brandKitStorage: BrandKitStorage = localStorageBrandKitStorage;
