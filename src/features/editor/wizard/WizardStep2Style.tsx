// src/features/editor/wizard/WizardStep2Style.tsx
// CREATYNG — MASTER SPEC DIFF 9.1 (shell)
// Cards e seleção de preset preenchidos em DIFF 9.2.

import { useWizardStore } from "@/stores/useWizardStore";
import { SYSTEM_IMAGE_PRESETS } from "@/data/systemPresets";

export function WizardStep2Style() {
  const { selectedImagePresetId, selectImagePreset, mode } = useWizardStore();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Passo 2 — Estilo</h2>
        <p className="text-muted-foreground text-sm">
          Escolha o estilo visual da imagem gerada.
        </p>
      </div>

      {/* Grid de presets de imagem */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SYSTEM_IMAGE_PRESETS.map((preset) => {
          const selected = selectedImagePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => selectImagePreset(preset.id)}
              className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 bg-muted/20"
              }`}
            >
              {/* Thumbnail placeholder — substituído por imagem real no DIFF 9.2 */}
              <div className="w-full aspect-video rounded-lg bg-muted mb-2 flex items-center justify-center text-2xl">
                {preset.slug === "drama-impact" && "🎭"}
                {preset.slug === "clean-premium" && "✨"}
                {preset.slug === "dark-cinematic" && "🌑"}
                {preset.slug === "editorial-magazine" && "📰"}
                {preset.slug === "neon-futuristic" && "🌆"}
              </div>
              <p className="text-sm font-semibold">{preset.name}</p>
              {preset.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {preset.description}
                </p>
              )}
              {selected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Campos avançados */}
      {mode === "advanced" && (
        <div className="flex flex-col gap-4 pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Atmosfera, iluminação e cores disponíveis no DIFF 9.2.
          </p>
        </div>
      )}
    </div>
  );
}
