// src/components/PresetCard.tsx
// CREATYNG — MASTER SPEC DIFF 9.2

import type { CreatygnPreset } from "@/types/preset";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PresetCardProps {
  preset: CreatygnPreset;
  selected: boolean;
  onSelect: (preset: CreatygnPreset) => void;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

const THUMB_ASPECT = {
  sm: "aspect-square",
  md: "aspect-video",
  lg: "aspect-video",
};

// Gradient placeholder while real thumbnails are not available
const PRESET_GRADIENT: Record<string, string> = {
  "drama-impact":        "linear-gradient(135deg, #e11d48, #7c3aed)",
  "clean-premium":       "linear-gradient(135deg, #f5f5f3, #d1d5db)",
  "dark-cinematic":      "linear-gradient(135deg, #111827, #374151)",
  "editorial-magazine":  "linear-gradient(135deg, #475569, #94a3b8)",
  "neon-futuristic":     "linear-gradient(135deg, #a855f7, #06b6d4)",
  "text-impact-drama":   "linear-gradient(135deg, #dc2626, #b91c1c)",
  "text-clean-editorial":"linear-gradient(135deg, #64748b, #94a3b8)",
  "text-dark-cinematic": "linear-gradient(135deg, #1e1b4b, #312e81)",
  "text-neon-futuristic":"linear-gradient(135deg, #7c3aed, #2563eb)",
  "text-street-grunge":  "linear-gradient(135deg, #78350f, #d97706)",
  "text-luxury-elegance":"linear-gradient(135deg, #92400e, #b45309)",
  "text-bold-sport":     "linear-gradient(135deg, #1d4ed8, #0369a1)",
  "text-minimal-swiss":  "linear-gradient(135deg, #e5e7eb, #9ca3af)",
};

// Text label shown over the gradient placeholder
const PRESET_LABEL: Record<string, string> = {
  "text-impact-drama":    "𝐈",
  "text-clean-editorial": "𝗖",
  "text-dark-cinematic":  "𝕯",
  "text-neon-futuristic": "𝙉",
  "text-street-grunge":   "𝗦",
  "text-luxury-elegance": "𝓛",
  "text-bold-sport":      "𝗕",
  "text-minimal-swiss":   "M",
};

export function PresetCard({ preset, selected, onSelect, size = "md" }: PresetCardProps) {
  const hasThumb = preset.thumbnailUrl && !preset.thumbnailUrl.startsWith("/presets/thumbs/");
  const gradient = PRESET_GRADIENT[preset.slug] ?? "linear-gradient(135deg, #e5e7eb, #9ca3af)";
  const label = PRESET_LABEL[preset.slug];

  return (
    <button
      onClick={() => onSelect(preset)}
      title={preset.description}
      className={cn(
        "relative rounded-xl border-2 text-left transition-all w-full group",
        SIZE_CLASSES[size],
        selected
          ? "border-primary bg-primary/5 shadow-sm shadow-primary/20"
          : "border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40"
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "w-full rounded-lg mb-2 flex items-center justify-center overflow-hidden",
          THUMB_ASPECT[size]
        )}
        style={!hasThumb ? { background: gradient } : {}}
      >
        {hasThumb ? (
          <img
            src={preset.thumbnailUrl}
            alt={preset.name}
            className="w-full h-full object-cover"
          />
        ) : label ? (
          <span className="text-2xl font-black text-white/80 select-none drop-shadow">{label}</span>
        ) : null}
      </div>

      {/* Nome */}
      <p className={cn("font-semibold leading-tight", size === "sm" ? "text-xs" : "text-sm")}>
        {preset.name}
      </p>

      {/* Descrição — tooltip on hover */}
      {preset.description && size !== "sm" && (
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {preset.description}
        </p>
      )}

      {/* Checkmark */}
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <Check className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}
