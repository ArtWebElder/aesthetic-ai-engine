// src/features/editor/wizard/WizardStep3Text.tsx
// CREATYNG — MASTER SPEC DIFF TR.3 (TextStylePicker integrado)

import { useDeferredValue } from "react";
import { useWizardStore } from "@/stores/useWizardStore";
import { TextStylePicker } from "@/components/TextStylePicker";
import type { CreatygnPreset, ColorConfig } from "@/types/preset";
import { DEFAULT_COLORS } from "@/features/editor/engine/cssVarsInjector";

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

      {/* FontSelector placeholder — preenchido no DIFF 9.3 */}
      {mode === "advanced" && (
        <div className="p-3 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
          Seletor de fonte (override) — DIFF 9.3
        </div>
      )}
    </div>
  );
}
