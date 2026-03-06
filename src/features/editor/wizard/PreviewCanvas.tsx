// src/features/editor/wizard/PreviewCanvas.tsx
// CREATYNG — MASTER SPEC DIFF 9.4
// Canvas de preview pré-geração: mostra zona de texto + subject.

import { useEffect, useRef, useCallback } from "react";
import { useWizardStore } from "@/stores/useWizardStore";
import { DEFAULT_COLORS } from "@/features/editor/engine/cssVarsInjector";

const TEXT_LAYOUTS = {
  bottom: {
    overlayStyle: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)",
    zone: { top: "65%", left: "0", right: "0", bottom: "0" },
  },
  top: {
    overlayStyle: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
    zone: { top: "0", left: "0", right: "0", bottom: "65%" },
  },
  left: {
    overlayStyle: "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)",
    zone: { top: "0", left: "0", right: "55%", bottom: "0" },
  },
  right: {
    overlayStyle: "linear-gradient(to left, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)",
    zone: { top: "0", left: "55%", right: "0", bottom: "0" },
  },
  center: {
    overlayStyle: "radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(0,0,0,0.5) 100%)",
    zone: { top: "20%", left: "10%", right: "10%", bottom: "20%" },
  },
} as const;

type TextPosition = keyof typeof TEXT_LAYOUTS;

export function PreviewCanvas() {
  const {
    headline,
    cta,
    activePresetConfig,
    subjectThumbnail,
    setPresetOverride,
  } = useWizardStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const textPosition = (activePresetConfig.composition?.textPosition ?? "bottom") as TextPosition;
  const layout = TEXT_LAYOUTS[textPosition] ?? TEXT_LAYOUTS.bottom;
  const colors = activePresetConfig.colors ?? DEFAULT_COLORS;
  const fontName = activePresetConfig.text?.headlineFont ?? "Anton";

  // Posições clicáveis para mudar a zona de texto
  const POSITIONS: Array<{ key: TextPosition; label: string }> = [
    { key: "top", label: "↑" },
    { key: "left", label: "←" },
    { key: "bottom", label: "↓" },
    { key: "right", label: "→" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Preview de composição
      </p>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-neutral-900"
      >
        {/* Subject */}
        {subjectThumbnail ? (
          <img
            src={subjectThumbnail}
            alt="Subject"
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            <span className="opacity-30">Sem sujeito</span>
          </div>
        )}

        {/* Overlay de integração — zona do texto */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: layout.overlayStyle }}
        />

        {/* Zona de texto */}
        <div
          className="absolute flex flex-col justify-end p-4 gap-1 pointer-events-none"
          style={{
            top: layout.zone.top,
            left: layout.zone.left,
            right: layout.zone.right,
            bottom: layout.zone.bottom,
          }}
        >
          {headline && (
            <p
              className="text-white font-black leading-tight text-xl drop-shadow-lg"
              style={{ fontFamily: `"${fontName}", sans-serif`, color: "white" }}
            >
              {headline.toUpperCase()}
            </p>
          )}
          {cta && (
            <p
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: colors.primary }}
            >
              {cta}
            </p>
          )}
        </div>
      </div>

      {/* Controles de posição */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Posição do texto:</span>
        {POSITIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPresetOverride("composition.textPosition", key)}
            className={`w-8 h-8 rounded-lg border text-sm transition-colors ${
              textPosition === key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
