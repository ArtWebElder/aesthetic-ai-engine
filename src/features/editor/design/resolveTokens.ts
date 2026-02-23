// src/features/editor/design/resolveTokens.ts
import type { ProjectSpec } from "@/types/spec";

type CssVars = Record<string, string>;

function fontStack(fontPreset: string) {
  switch (fontPreset) {
    case "space_grotesk":
      return `"Space Grotesk", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    case "plus_jakarta":
      return `"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    case "dm_sans":
      return `"DM Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    case "inter":
    default:
      return `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
  }
}

// “Style humano” do Wizard (não é o stylePreset antigo do spec)
export type HumanStyle = "minimal" | "premium" | "promo" | "neon";

// guard: vamos guardar isso dentro do spec.effects.preset por enquanto
// (depois você pode criar `spec.editor.styleHuman` se quiser mais limpo)
function humanStyleFromSpec(spec: ProjectSpec): HumanStyle {
  const p = spec.effects?.preset;
  if (p === "clean") return "minimal";
  if (p === "glass") return "premium";
  if (p === "bold") return "promo";
  if (p === "neon") return "neon";
  // fallback
  return "premium";
}

export function resolveCanvasTokens(spec: ProjectSpec): CssVars {
  const accent = spec.brand?.accent?.startsWith("#") ? spec.brand.accent : "#34d399";
  const text = spec.brand?.primary?.startsWith("#") ? spec.brand.primary : "#ffffff";

  const human = humanStyleFromSpec(spec);

  // defaults
  let overlayFrom = "rgba(0,0,0,.72)";
  let overlayVia = "rgba(0,0,0,.32)";
  let overlayTo = "rgba(0,0,0,0)";
  let cardBg = "rgba(0,0,0,.35)";
  let cardBorder = "rgba(255,255,255,.10)";
  let ctaBg = accent;
  let ctaText = "#0b0b0b";
  let titleWeight = "800";
  let titleTracking = "-0.02em";
  let titleShadow = "0 14px 40px rgba(0,0,0,.35)";
  let subOpacity = ".86";
  let badgeBg = "rgba(255,255,255,.08)";
  let badgeBorder = "rgba(255,255,255,.14)";

  if (human === "minimal") {
    overlayFrom = "rgba(0,0,0,.55)";
    overlayVia = "rgba(0,0,0,.18)";
    cardBg = "rgba(0,0,0,.22)";
    titleWeight = "700";
    titleTracking = "-0.015em";
    titleShadow = "none";
    subOpacity = ".80";
    ctaBg = "rgba(255,255,255,.14)";
    ctaText = "#ffffff";
  }

  if (human === "premium") {
    // glass / premium
    overlayFrom = "rgba(0,0,0,.62)";
    overlayVia = "rgba(0,0,0,.18)";
    cardBg = "rgba(0,0,0,.34)";
    cardBorder = "rgba(255,255,255,.14)";
    titleWeight = "800";
    titleShadow = "0 16px 60px rgba(0,0,0,.45)";
    ctaBg = accent;
    ctaText = "#06110b";
  }

  if (human === "promo") {
    // “saldão” sem virar tosco
    overlayFrom = "rgba(0,0,0,.78)";
    overlayVia = "rgba(0,0,0,.26)";
    titleWeight = "900";
    titleTracking = "-0.03em";
    titleShadow = "0 18px 70px rgba(0,0,0,.55)";
    badgeBg = "rgba(255,255,255,.12)";
    ctaBg = accent;
    ctaText = "#00140b";
  }

  if (human === "neon") {
    overlayFrom = "rgba(0,0,0,.82)";
    overlayVia = "rgba(0,0,0,.25)";
    titleWeight = "900";
    titleShadow = `0 0 24px ${accent}55, 0 20px 80px rgba(0,0,0,.60)`;
    ctaBg = "rgba(255,255,255,.12)";
    ctaText = "#ffffff";
    cardBg = "rgba(0,0,0,.38)";
    cardBorder = `${accent}55`;
  }

  const display = fontStack(spec.brand?.fontPreset || "space_grotesk");
  const body = fontStack("plus_jakarta"); // simples: body fixo por enquanto

  return {
    "--mi-text": text,
    "--mi-accent": accent,

    "--mi-font-display": display,
    "--mi-font-body": body,

    "--mi-overlay-from": overlayFrom,
    "--mi-overlay-via": overlayVia,
    "--mi-overlay-to": overlayTo,

    "--mi-card-bg": cardBg,
    "--mi-card-border": cardBorder,

    "--mi-cta-bg": ctaBg,
    "--mi-cta-text": ctaText,

    "--mi-title-weight": titleWeight,
    "--mi-title-tracking": titleTracking,
    "--mi-title-shadow": titleShadow,
    "--mi-sub-opacity": subOpacity,

    "--mi-badge-bg": badgeBg,
    "--mi-badge-border": badgeBorder,
  };
}