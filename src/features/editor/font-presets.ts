// src/features/editor/font-presets.ts
// Metadados das fontes disponíveis no editor.
// Valores mapeiam para FontPreset em src/types/spec.ts — nunca alterar os values.

import type { FontPreset } from "@/types/spec";

export type FontStyleGroup = "clean" | "drama" | "dark";

export interface FontOption {
  /** Corresponde a FontPreset — nunca muda */
  value: FontPreset;
  /** Label de exibição */
  label: string;
  /** Nome exato para Google Fonts API e CSS font-family */
  googleFamily: string;
  /** Grupo visual no seletor */
  group: FontStyleGroup;
}

export const FONT_OPTIONS: readonly FontOption[] = [
  // ── Clean / Premium ───────────────────────────────────────────────────────
  {
    value: "space_grotesk",
    label: "Space Grotesk",
    googleFamily: "Space Grotesk",
    group: "clean",
  },
  {
    value: "plus_jakarta",
    label: "Plus Jakarta Sans",
    googleFamily: "Plus Jakarta Sans",
    group: "clean",
  },
  {
    value: "dm_sans",
    label: "DM Sans",
    googleFamily: "DM Sans",
    group: "clean",
  },
  {
    value: "inter",
    label: "Inter",
    googleFamily: "Inter",
    group: "clean",
  },
] as const;

/** URL do Google Fonts para carregar todas as fontes disponíveis */
export function buildGoogleFontsUrl(): string {
  const families = FONT_OPTIONS.map(
    (f) => `family=${encodeURIComponent(f.googleFamily)}:wght@400;600;700;800`,
  ).join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/** Retorna a FontOption correspondente ao value, ou a primeira como fallback */
export function getFontOption(value: FontPreset | string): FontOption {
  return FONT_OPTIONS.find((f) => f.value === value) ?? FONT_OPTIONS[0];
}
