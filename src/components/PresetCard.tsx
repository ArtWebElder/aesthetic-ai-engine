// src/components/PresetCard.tsx
// CREATYNG — MASTER SPEC DIFF 9.2

import type { CreatygnPreset } from "@/types/preset";
import { cn } from "@/lib/utils";

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

// Emoji placeholder enquanto não há thumbnails reais
const PRESET_EMOJI: Record<string, string> = {
  "drama-impact": "🎭",
  "clean-premium": "✨",
  "dark-cinematic": "🌑",
  "editorial-magazine": "📰",
  "neon-futuristic": "🌆",
  "text-impact-drama": "𝐈",
  "text-clean-editorial": "𝗖",
  "text-dark-cinematic": "𝕯",
  "text-neon-futuristic": "𝙉",
  "text-street-grunge": "𝗦",
  "text-luxury-elegance": "𝓛",
  "text-bold-sport": "𝗕",
  "text-minimal-swiss": "M",
};

export function PresetCard({ preset, selected, onSelect, size = "md" }: PresetCardProps) {
  const hasThumb = preset.thumbnailUrl && !preset.thumbnailUrl.startsWith("/presets/thumbs/");
  const emoji = PRESET_EMOJI[preset.slug] ?? "■";

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
          "w-full rounded-lg bg-muted mb-2 flex items-center justify-center overflow-hidden",
          THUMB_ASPECT[size]
        )}
      >
        {hasThumb ? (
          <img
            src={preset.thumbnailUrl}
            alt={preset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-3xl select-none">{emoji}</span>
        )}
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
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          ✓
        </span>
      )}
    </button>
  );
}
