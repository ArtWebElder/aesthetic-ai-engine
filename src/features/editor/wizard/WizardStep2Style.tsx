// src/features/editor/wizard/WizardStep2Style.tsx
// CREATYNG — MASTER SPEC DIFF 9.2

import { useWizardStore } from "@/stores/useWizardStore";
import { PresetGrid } from "@/components/PresetGrid";
import { SYSTEM_IMAGE_PRESETS } from "@/data/systemPresets";
import type { CreatygnPreset, ImagePresetConfig } from "@/types/preset";

// ── Opções de atmosfera e iluminação (overrides sobre o preset base) ─────────

const ATMOSPHERE_OPTIONS: Array<{ value: ImagePresetConfig["atmosphere"]; label: string }> = [
  { value: "particles", label: "Partículas" },
  { value: "fog", label: "Névoa" },
  { value: "glass_shards", label: "Vidro" },
  { value: "rain", label: "Chuva" },
  { value: "none", label: "Nenhuma" },
];

const LIGHTING_OPTIONS: Array<{ value: ImagePresetConfig["lighting"]; label: string }> = [
  { value: "rim_purple", label: "Rim Roxo" },
  { value: "rim_blue", label: "Rim Azul" },
  { value: "natural", label: "Natural" },
  { value: "studio", label: "Studio" },
  { value: "neon", label: "Neon" },
  { value: "none", label: "Nenhuma" },
];

export function WizardStep2Style() {
  const { selectedImagePresetId, selectImagePreset, mode, activePresetConfig, setPresetOverride } =
    useWizardStore();

  const currentAtmosphere = activePresetConfig.image?.atmosphere ?? "none";
  const currentLighting = activePresetConfig.image?.lighting ?? "none";

  function handleSelectImagePreset(preset: CreatygnPreset) {
    selectImagePreset(preset.id);
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold mb-1">Passo 2 — Estilo</h2>
        <p className="text-muted-foreground text-sm">
          Escolha o estilo visual base. A IA usará esse preset para compor a cena.
        </p>
      </div>

      {/* Estilo base — obrigatório */}
      <PresetGrid
        presets={SYSTEM_IMAGE_PRESETS}
        selectedId={selectedImagePresetId}
        onSelect={handleSelectImagePreset}
        columns={3}
        label="Estilo base"
      />

      {/* Atmosfera e iluminação — só no modo advanced */}
      {mode === "advanced" && (
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Atmosfera
            </p>
            <div className="flex flex-wrap gap-2">
              {ATMOSPHERE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPresetOverride("image.atmosphere", opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    currentAtmosphere === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Iluminação
            </p>
            <div className="flex flex-wrap gap-2">
              {LIGHTING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPresetOverride("image.lighting", opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    currentLighting === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Paleta de cores
            </p>
            <div className="flex gap-4 flex-wrap items-center">
              {(
                [
                  { key: "colors.primary", label: "Primária", fallback: "#7B2FFF" },
                  { key: "colors.secondary", label: "Secundária", fallback: "#FF00DD" },
                  { key: "colors.neutral", label: "Neutra", fallback: "#111827" },
                ] as const
              ).map(({ key, label, fallback }) => {
                const currentVal =
                  key === "colors.primary"
                    ? activePresetConfig.colors?.primary ?? fallback
                    : key === "colors.secondary"
                    ? activePresetConfig.colors?.secondary ?? fallback
                    : activePresetConfig.colors?.neutral ?? fallback;
                return (
                  <label key={key} className="flex flex-col items-center gap-1 cursor-pointer">
                    <input
                      type="color"
                      value={currentVal}
                      onChange={(e) => setPresetOverride(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer p-0.5 bg-transparent"
                    />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
