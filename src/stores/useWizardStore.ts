// src/stores/useWizardStore.ts
// CREATYNG — MASTER SPEC DIFF 9.1
// Store Zustand do wizard. Usa WizardState do src/types/preset.ts.
// NUNCA criar estado paralelo ao WizardState aqui.

import { create } from "zustand";
import type { WizardState, PresetConfig, SubjectProfile, VisualDNA, CachedGeneration } from "@/types/preset";
import { buildActiveConfig, applyPresetOverride, getSuggestedTextPreset } from "@/lib/presetUtils";

interface WizardStore extends WizardState {
  // ── Navegação ────────────────────────────────────────────────────────────────
  currentStep: 1 | 2 | 3;
  goToStep: (step: 1 | 2 | 3) => void;
  goNext: () => void;
  goBack: () => void;

  // ── Preset ───────────────────────────────────────────────────────────────────
  selectImagePreset: (presetId: string) => void;
  selectTextPreset: (presetId: string) => void;
  /** key usa dot notation: 'text.headlineFont', 'colors.primary' */
  setPresetOverride: (key: string, value: unknown) => void;

  // ── Subject ──────────────────────────────────────────────────────────────────
  setSubject: (base64: string, thumbnail: string) => void;
  setSubjectProfile: (profile: SubjectProfile) => void;

  // ── Textos ───────────────────────────────────────────────────────────────────
  setHeadline: (text: string) => void;
  setSubheadline: (text: string) => void;
  setCta: (text: string) => void;

  // ── Referência ───────────────────────────────────────────────────────────────
  setReference: (base64: string) => void;
  setVisualDNA: (dna: VisualDNA) => void;

  // ── Modo ─────────────────────────────────────────────────────────────────────
  setMode: (mode: "quick" | "advanced") => void;

  // ── DIFF 13.2 — Cache de geração ─────────────────────────────────────────────
  currentGeneration?: CachedGeneration;
  setGeneration: (gen: CachedGeneration) => void;
  clearGeneration: () => void;

  // ── Food/Pop ─────────────────────────────────────────────────────────────────
  setCategory: (cat: "food" | "person" | "product" | "general") => void;
  setWhatsapp: (val: string) => void;
  setInstagram: (val: string) => void;
  setPrice: (price: { value: string; prefix: string; suffix: string } | null) => void;
  setExtraText: (val: string) => void;
  setFreeInstructions: (val: string) => void;
  setLogoBase64: (val: string | null) => void;

  // ── Pop Design ───────────────────────────────────────────────────────────────
  /** Subject isolado (PNG transparente) — cache do resultado de bg removal. */
  setSubjectIsolated: (val: string | null) => void;

  // ── Composed image (final render com texto overlay) ───────────────────────
  composedImageBase64?: string | null;
  setComposedImage: (val: string | null) => void;

  // ── Reset ────────────────────────────────────────────────────────────────────
  reset: () => void;
}

const DEFAULT_WIZARD_STATE: WizardState = {
  framing: "full_body",
  cameraAngle: "eye_level",
  activePresetConfig: {},
  headline: "",
  subheadline: "",
  cta: "",
  mode: "quick",
  category: "general",
  whatsapp: "",
  instagram: "",
  price: null,
  extraText: "",
  freeInstructions: "",
  logoBase64: null,
};

function loadMode(): "quick" | "advanced" {
  try {
    const stored = localStorage.getItem("creatyng_wizard_mode");
    if (stored === "advanced") return "advanced";
  } catch {
    // localStorage indisponível
  }
  return "quick";
}

export const useWizardStore = create<WizardStore>((set, get) => ({
  ...DEFAULT_WIZARD_STATE,
  mode: loadMode(),
  currentStep: 1,

  // ── Navegação ────────────────────────────────────────────────────────────────

  goToStep: (step) => set({ currentStep: step }),

  goNext: () => {
    const current = get().currentStep;
    if (current < 3) set({ currentStep: (current + 1) as 1 | 2 | 3 });
  },

  goBack: () => {
    const current = get().currentStep;
    if (current > 1) set({ currentStep: (current - 1) as 1 | 2 | 3 });
  },

  // ── Preset ───────────────────────────────────────────────────────────────────

  selectImagePreset: (presetId) => {
    const config = buildActiveConfig(presetId);
    set({ selectedImagePresetId: presetId, activePresetConfig: config });
    // Sugerir text preset automaticamente se nenhum foi escolhido ainda
    const { selectedTextPresetId } = get();
    if (!selectedTextPresetId) {
      const suggested = getSuggestedTextPreset(presetId);
      get().selectTextPreset(suggested.id);
    }
  },

  selectTextPreset: (presetId) => {
    const currentConfig = get().activePresetConfig;
    const newConfig = buildActiveConfig(presetId);
    // Mescla: mantém image/colors/composition do config atual, substitui text
    set({
      selectedTextPresetId: presetId,
      activePresetConfig: {
        ...currentConfig,
        text: newConfig.text,
      },
    });
  },

  setPresetOverride: (key, value) => {
    const currentConfig = get().activePresetConfig;
    const updated = applyPresetOverride(currentConfig, key, value);
    set({ activePresetConfig: updated });
  },

  // ── Subject ──────────────────────────────────────────────────────────────────

  setSubject: (base64, thumbnail) =>
    set({ subjectBase64: base64, subjectThumbnail: thumbnail }),

  setSubjectProfile: (profile) => set({ subjectProfile: profile }),

  // ── Textos ───────────────────────────────────────────────────────────────────

  setHeadline: (text) => set({ headline: text }),
  setSubheadline: (text) => set({ subheadline: text }),
  setCta: (text) => set({ cta: text }),

  // ── Referência ───────────────────────────────────────────────────────────────

  setReference: (base64) => set({ referenceBase64: base64 }),
  setVisualDNA: (dna) => set({ visualDNA: dna }),

  // ── Modo ─────────────────────────────────────────────────────────────────────

  setMode: (mode) => {
    try {
      localStorage.setItem("creatyng_wizard_mode", mode);
    } catch {
      // silencioso
    }
    set({ mode });
  },

  // ── DIFF 13.2 — Cache de geração ─────────────────────────────────────────────

  setGeneration: (gen) => set({ currentGeneration: gen }),

  clearGeneration: () => set({ currentGeneration: undefined }),

  // ── Food/Pop ─────────────────────────────────────────────────────────────────

  setCategory: (cat) => set({ category: cat }),
  setWhatsapp: (val) => set({ whatsapp: val }),
  setInstagram: (val) => set({ instagram: val }),
  setPrice: (price) => set({ price }),
  setExtraText: (val) => set({ extraText: val }),
  setFreeInstructions: (val) => set({ freeInstructions: val }),
  setLogoBase64: (val) => set({ logoBase64: val }),
  setSubjectIsolated: (val) => set({ subjectIsolatedBase64: val }),

  setComposedImage: (val) => set({ composedImageBase64: val }),

  // ── Reset ────────────────────────────────────────────────────────────────────

  reset: () =>
    set({
      ...DEFAULT_WIZARD_STATE,
      mode: get().mode, // preserva modo quick/advanced
      currentStep: 1,
      currentGeneration: undefined,
    }),
}));
