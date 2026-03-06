// src/stores/useWizardStore.ts
// CREATYNG — MASTER SPEC DIFF 9.1
// Store Zustand do wizard. Usa WizardState do src/types/preset.ts.
// NUNCA criar estado paralelo ao WizardState aqui.

import { create } from "zustand";
import type { WizardState, PresetConfig, SubjectProfile, VisualDNA } from "@/types/preset";
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

  // ── Reset ────────────────────────────────────────────────────────────────────

  reset: () =>
    set({
      ...DEFAULT_WIZARD_STATE,
      mode: get().mode, // preserva modo quick/advanced
      currentStep: 1,
    }),
}));
