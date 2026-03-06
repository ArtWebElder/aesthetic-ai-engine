// src/components/PresetGrid.tsx
// CREATYNG — MASTER SPEC DIFF 9.2
// Grid de cards com seleção exclusiva por grupo.

import type { CreatygnPreset } from "@/types/preset";
import { PresetCard } from "./PresetCard";

interface PresetGridProps {
  presets: CreatygnPreset[];
  selectedId: string | undefined;
  onSelect: (preset: CreatygnPreset) => void;
  columns?: 2 | 3 | 4 | 5;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

export function PresetGrid({
  presets,
  selectedId,
  onSelect,
  columns = 3,
  size = "md",
  label,
}: PresetGridProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      <div className={`grid gap-3 ${GRID_COLS[columns] ?? GRID_COLS[3]}`}>
        {presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            selected={selectedId === preset.id}
            onSelect={onSelect}
            size={size}
          />
        ))}
      </div>
    </div>
  );
}
