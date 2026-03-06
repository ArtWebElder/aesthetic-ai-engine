// src/features/editor/engine/cssVarsInjector.ts
// CREATYNG — MASTER SPEC DIFF TR.2
// Injeta variáveis CSS baseadas em ColorConfig.
// Todos os CSS de preset de texto usam estas vars — trocar cor muda tudo automaticamente.

import type { ColorConfig } from "@/types/preset";

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRGB(hex: string): RGB {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(full);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Injeta CSS custom properties no elemento alvo.
 * Usar no container do canvas de preview e no container do resultado.
 *
 * Vars disponíveis:
 *   --accent-color      hex da cor primária
 *   --accent-rgb        R,G,B da cor primária (para rgba())
 *   --accent-secondary  hex da cor secundária
 *   --neutral           hex da cor neutra
 *   --accent-word       hex da accent word (fallback: primary)
 */
export function injectPresetCSSVars(colors: ColorConfig, element: HTMLElement): void {
  const primaryRGB = hexToRGB(colors.primary);
  element.style.setProperty("--accent-color", colors.primary);
  element.style.setProperty(
    "--accent-rgb",
    `${primaryRGB.r},${primaryRGB.g},${primaryRGB.b}`
  );
  element.style.setProperty("--accent-secondary", colors.secondary);
  element.style.setProperty("--neutral", colors.neutral);
  element.style.setProperty("--accent-word", colors.accentWord ?? colors.primary);
}

/** Remove todas as CSS vars de preset de um elemento. */
export function clearPresetCSSVars(element: HTMLElement): void {
  element.style.removeProperty("--accent-color");
  element.style.removeProperty("--accent-rgb");
  element.style.removeProperty("--accent-secondary");
  element.style.removeProperty("--neutral");
  element.style.removeProperty("--accent-word");
}

/**
 * Hook React: injeta/atualiza CSS vars sempre que as cores mudarem.
 * Uso: usePresetCSSVars(containerRef, colors)
 */
export function syncCSSVarsToRef(
  ref: React.RefObject<HTMLElement>,
  colors: ColorConfig | undefined
): void {
  if (!ref.current || !colors) return;
  injectPresetCSSVars(colors, ref.current);
}

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────

export const DEFAULT_COLORS: ColorConfig = {
  primary: "#7B2FFF",
  secondary: "#FF00DD",
  neutral: "#111827",
  extras: [],
  accentWord: "#FF00DD",
};

export const DEFAULT_COLORS_CLEAN: ColorConfig = {
  primary: "#111111",
  secondary: "#555555",
  neutral: "#F8F8F8",
  extras: [],
};

export const DEFAULT_COLORS_DARK: ColorConfig = {
  primary: "#00E5FF",
  secondary: "#0066FF",
  neutral: "#080C10",
  extras: [],
  accentWord: "#00E5FF",
};
