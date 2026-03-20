// src/features/editor/wizard/WizardStep2Style.tsx
// CREATYNG — Step 2: Seleção de estilo visual

import { useWizardStore } from "@/stores/useWizardStore";
import { PresetGrid } from "@/components/PresetGrid";
import { SYSTEM_IMAGE_PRESETS } from "@/data/systemPresets";
import type { CreatygnPreset } from "@/types/preset";

// Presets visíveis na UI — apenas os que funcionam de verdade
const VISIBLE_PRESET_SLUGS = ['food-pop', 'pop-design'];
const VISIBLE_PRESETS = SYSTEM_IMAGE_PRESETS.filter(p => VISIBLE_PRESET_SLUGS.includes(p.slug));

export function WizardStep2Style() {
  const { selectedImagePresetId, selectImagePreset } = useWizardStore();

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

      <PresetGrid
        presets={VISIBLE_PRESETS}
        selectedId={selectedImagePresetId}
        onSelect={handleSelectImagePreset}
        columns={2}
        label="Estilo base"
      />
    </div>
  );
}
