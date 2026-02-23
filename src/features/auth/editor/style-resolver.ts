import type { ProjectSpec } from "@/types/spec";

export function resolveStyleVars(spec: ProjectSpec): React.CSSProperties {
  const accent = spec.brand?.accent || "#34d399";
  const text = spec.brand?.primary || "#ffffff";
  const bg = spec.brand?.secondary || "#0b0f14";

  // presets “humanos”
  const preset = spec.effects?.preset || "clean";

  const base: Record<string, string> = {
    "--mi-accent": accent,
    "--mi-text": text,
    "--mi-bg": bg,

    "--mi-font-display": `"Space Grotesk", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`,
    "--mi-font-body": `"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`,

    "--mi-overlay-from": "rgba(0,0,0,.70)",
    "--mi-overlay-via": "rgba(0,0,0,.28)",
    "--mi-overlay-to": "rgba(0,0,0,0)",

    "--mi-card-bg": "rgba(0,0,0,.35)",
    "--mi-card-border": "rgba(255,255,255,.10)",

    "--mi-cta-bg": accent,
    "--mi-cta-text": "#00120a",
    "--mi-cta-border": "transparent",
    "--mi-cta-glow": "0 18px 40px rgba(0,0,0,.35)",

    "--mi-title-shadow": "0 10px 30px rgba(0,0,0,.45)",
    "--mi-sub-opacity": "0.86",
  };

  // font preset (só troca famílias; depois a gente abre “Font step” mais avançado)
  switch (spec.brand?.fontPreset) {
    case "inter":
      base["--mi-font-display"] = `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
      base["--mi-font-body"] = `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
      break;
    case "dm_sans":
      base["--mi-font-display"] = `"DM Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
      base["--mi-font-body"] = `"DM Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
      break;
    case "plus_jakarta":
      base["--mi-font-display"] = `"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
      base["--mi-font-body"] = `"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
      break;
    default:
      // space_grotesk já é default
      break;
  }

  // style “human”
  if (preset === "clean") {
    base["--mi-overlay-from"] = "rgba(0,0,0,.55)";
    base["--mi-overlay-via"] = "rgba(0,0,0,.16)";
    base["--mi-card-bg"] = "rgba(0,0,0,.22)";
    base["--mi-card-border"] = "rgba(255,255,255,.10)";
    base["--mi-title-shadow"] = "0 10px 26px rgba(0,0,0,.42)";
    base["--mi-cta-glow"] = "0 16px 40px rgba(0,0,0,.30)";
  }

  if (preset === "glass") {
    base["--mi-overlay-from"] = "rgba(0,0,0,.52)";
    base["--mi-overlay-via"] = "rgba(0,0,0,.10)";
    base["--mi-card-bg"] = "rgba(255,255,255,.10)";
    base["--mi-card-border"] = "rgba(255,255,255,.16)";
    base["--mi-cta-border"] = "rgba(255,255,255,.18)";
    base["--mi-cta-text"] = "#07120c";
    base["--mi-cta-glow"] = "0 20px 50px rgba(0,0,0,.35)";
  }

  if (preset === "bold") {
    base["--mi-overlay-from"] = "rgba(0,0,0,.78)";
    base["--mi-overlay-via"] = "rgba(0,0,0,.28)";
    base["--mi-card-bg"] = "rgba(0,0,0,.55)";
    base["--mi-card-border"] = "rgba(255,255,255,.08)";
    base["--mi-title-shadow"] = "0 14px 34px rgba(0,0,0,.60)";
    base["--mi-sub-opacity"] = "0.92";
  }

  if (preset === "neon") {
    base["--mi-overlay-from"] = "rgba(0,0,0,.78)";
    base["--mi-overlay-via"] = "rgba(0,0,0,.18)";
    base["--mi-card-bg"] = "rgba(0,0,0,.40)";
    base["--mi-card-border"] = "rgba(255,255,255,.10)";
    base["--mi-cta-bg"] = "transparent";
    base["--mi-cta-text"] = text;
    base["--mi-cta-border"] = accent;
    base["--mi-cta-glow"] = `0 0 0 1px ${accent}, 0 0 40px rgba(0,0,0,.35)`;
    base["--mi-title-shadow"] = `0 0 0 rgba(0,0,0,0)`;
  }

  return base as React.CSSProperties;
}