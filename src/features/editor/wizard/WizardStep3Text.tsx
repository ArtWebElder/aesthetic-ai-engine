// src/features/editor/wizard/WizardStep3Text.tsx
// CREATYNG — MASTER SPEC DIFF 9.3 (FontSelector integrado)

import { useDeferredValue } from "react";
import { useWizardStore } from "@/stores/useWizardStore";
import { TextStylePicker } from "@/components/TextStylePicker";
import { FontSelector } from "@/components/FontSelector";
import { PreviewCanvas } from "./PreviewCanvas";
import type { CreatygnPreset, ColorConfig } from "@/types/preset";
import { DEFAULT_COLORS } from "@/features/editor/engine/cssVarsInjector";

// Fontes sugeridas por preset de texto
const SUGGESTED_FONTS: Record<string, string[]> = {
  "sys-txt-impact":  ["Anton", "Bebas Neue", "Oswald", "Black Han Sans"],
  "sys-txt-clean":   ["Bebas Neue", "Oswald", "Barlow Condensed", "Teko"],
  "sys-txt-dark":    ["Cinzel Decorative", "Cinzel", "Cormorant Garamond"],
  "sys-txt-neon":    ["Rajdhani", "Orbitron", "Exo 2", "Share Tech Mono"],
  "sys-txt-street":  ["Black Han Sans", "Anton", "Oswald"],
  "sys-txt-luxury":  ["Cormorant Garamond", "Cinzel", "Montserrat"],
  "sys-txt-sport":   ["Teko", "Barlow Condensed", "Oswald", "Rajdhani"],
  "sys-txt-minimal": ["Inter", "Space Grotesk", "DM Sans", "Plus Jakarta Sans"],
};

export function WizardStep3Text() {
  const {
    headline,
    subheadline,
    cta,
    setHeadline,
    setSubheadline,
    setCta,
    mode,
    selectedTextPresetId,
    selectTextPreset,
    activePresetConfig,
    setPresetOverride,
  } = useWizardStore();

  // Debounce do texto para não redesenhar 8 mini-canvas a cada keystroke
  const deferredHeadline = useDeferredValue(headline);

  const colors: ColorConfig = activePresetConfig.colors ?? DEFAULT_COLORS;

  function handleSelectTextPreset(preset: CreatygnPreset) {
    selectTextPreset(preset.id);
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Passo 3 — Textos</h2>
        <p className="text-muted-foreground text-sm">
          Os textos são compostos sobre a imagem com tipografia real — nunca gerados pela IA.
        </p>
      </div>

      {/* Headline */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Headline <span className="text-muted-foreground font-normal">(principal)</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Ex: EU QUERIA SER FORTE"
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* CTA sempre visível */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">CTA</label>
        <input
          type="text"
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          placeholder="Ex: COMPRE AGORA"
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* Subheadline — só no modo advanced */}
      {mode === "advanced" && (
        <div>
          <label className="text-sm font-medium mb-1.5 block">Subheadline</label>
          <input
            type="text"
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            placeholder="Ex: Sua jornada começa aqui"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      )}

      {/* TextStylePicker — 8 cards com preview ao vivo */}
      <TextStylePicker
        selectedId={selectedTextPresetId}
        previewText={deferredHeadline}
        colors={colors}
        onSelect={handleSelectTextPreset}
      />

      {/* Preview canvas — zona de texto + sujeito */}
      <PreviewCanvas />

      {/* FontSelector — override da fonte do preset ativo */}
      {mode === "advanced" && (
        <FontSelector
          value={activePresetConfig.text?.headlineFont ?? "Anton"}
          previewText={headline}
          suggestedFonts={SUGGESTED_FONTS[selectedTextPresetId ?? ""] ?? ["Anton", "Bebas Neue"]}
          onChange={(font) => setPresetOverride("text.headlineFont", font)}
          label="Fonte principal (override)"
        />
      )}
    </div>
  );
}
