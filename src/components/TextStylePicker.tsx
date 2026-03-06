// src/components/TextStylePicker.tsx
// CREATYNG — MASTER SPEC DIFF TR.3
// Grid 4×2 de cards de preset de texto com preview ao vivo.

import { useEffect, useRef, useCallback } from "react";
import type { CreatygnPreset, ColorConfig } from "@/types/preset";
import { SYSTEM_TEXT_PRESETS } from "@/data/systemPresets";
import { cn } from "@/lib/utils";

// ── Mapa fonte → URL Google Fonts ─────────────────────────────────────────────

const GOOGLE_FONTS_LOADED = new Set<string>();

async function loadGoogleFont(fontName: string): Promise<void> {
  if (GOOGLE_FONTS_LOADED.has(fontName)) return;
  GOOGLE_FONTS_LOADED.add(fontName);
  const encoded = fontName.replace(/ /g, "+");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@300;400;700;900&display=swap`;
  document.head.appendChild(link);
  await document.fonts.ready;
}

// ── Mini canvas de preview ────────────────────────────────────────────────────

interface MiniPreviewProps {
  preset: CreatygnPreset;
  previewText: string;
  colors: ColorConfig;
  selected: boolean;
  onSelect: (preset: CreatygnPreset) => void;
}

function MiniPreview({ preset, previewText, colors, selected, onSelect }: MiniPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textConfig = preset.config.text;

  const drawPreview = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !textConfig) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Fundo
    ctx.clearRect(0, 0, W, H);
    const bg = textConfig.stylePreset === "clean" ? "#1a1a1a"
      : textConfig.stylePreset === "minimal" ? "#ffffff"
      : "#111111";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Carregar fonte
    const fontName = textConfig.headlineFont;
    await loadGoogleFont(fontName);

    // Texto
    const fontSize = Math.floor(H * 0.32);
    ctx.font = `${textConfig.headlineWeight} ${fontSize}px "${fontName}", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = (previewText || preset.name).toUpperCase();

    // Efeitos
    if (textConfig.effects.glow && textConfig.effects.glowIntensity > 0) {
      const glowColor = textConfig.effects.glowColor ?? colors.primary;
      const blur = Math.round(textConfig.effects.glowIntensity / 10);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = blur;
    }

    if (textConfig.effects.shadow !== "none") {
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = textConfig.effects.shadow === "soft" ? 3 : 5;
      ctx.shadowOffsetY = 1;
    }

    // Cor do texto
    if (textConfig.effects.gradient && textConfig.effects.gradientColors?.length) {
      const grad = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.7);
      const stops = textConfig.effects.gradientColors;
      stops.forEach((color, i) => {
        grad.addColorStop(i / (stops.length - 1), color);
      });
      ctx.fillStyle = grad;
    } else if (textConfig.stylePreset === "minimal") {
      ctx.fillStyle = "#111111";
    } else {
      ctx.fillStyle = "#ffffff";
    }

    // Stroke
    if (textConfig.effects.stroke) {
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = textConfig.effects.strokeWidth ?? 1;
      ctx.strokeText(text, W / 2, H / 2);
    }

    ctx.fillText(text, W / 2, H / 2);

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }, [preset, previewText, colors, textConfig]);

  // Redesenha sempre que o texto ou cores mudam (com debounce externo)
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  return (
    <button
      onClick={() => onSelect(preset)}
      className={cn(
        "relative flex flex-col rounded-xl border-2 overflow-hidden transition-all text-left",
        selected
          ? "border-primary shadow-sm shadow-primary/20"
          : "border-border hover:border-primary/50"
      )}
    >
      <canvas
        ref={canvasRef}
        width={160}
        height={80}
        className="w-full h-auto"
      />
      <div className="px-2 py-1 bg-background">
        <p className="text-xs font-semibold truncate">{preset.name}</p>
      </div>
      {selected && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
          ✓
        </span>
      )}
    </button>
  );
}

// ── TextStylePicker público ───────────────────────────────────────────────────

interface TextStylePickerProps {
  selectedId: string | undefined;
  previewText: string;
  colors: ColorConfig;
  onSelect: (preset: CreatygnPreset) => void;
}

export function TextStylePicker({ selectedId, previewText, colors, onSelect }: TextStylePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Estilo de texto
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SYSTEM_TEXT_PRESETS.map((preset) => (
          <MiniPreview
            key={preset.id}
            preset={preset}
            previewText={previewText}
            colors={colors}
            selected={selectedId === preset.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
