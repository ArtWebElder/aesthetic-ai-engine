// src/features/editor/wizard/WizardPage.tsx
// CREATYNG — Fase 2 — Página que conecta o wizard ao motor de geração.
// Rota: /app/create

import { useState } from "react";
import { WizardLayout } from "./WizardLayout";
import { WizardStep1Subject } from "./WizardStep1Subject";
import { WizardStep2Style } from "./WizardStep2Style";
import { WizardStep3Text } from "./WizardStep3Text";
import { useWizardStore } from "@/stores/useWizardStore";
import { generateFromWizard, GenerateError } from "@/services/generateService";
import { exportComposed, FORMAT_BY_ID } from "../engine/exportComposed";
import { getPresetById } from "@/lib/presetUtils";
import type { TextPresetConfig, ColorConfig, CompositionConfig } from "@/types/preset";

const FALLBACK_TEXT_PRESET_ID = "sys-txt-impact";

const DEFAULT_COLORS: ColorConfig = {
  primary: "#a855f7",
  secondary: "#6366f1",
  neutral: "#111827",
  extras: [],
};

const DEFAULT_COMPOSITION: CompositionConfig = {
  textPosition: "bottom",
  textAlignment: "center",
  subjectPosition: "center",
  overlayIntensity: 40,
  aspectRatio: "1:1",
};

const DEFAULT_FORMAT_ID = "instagram_feed";

export function WizardPage() {
  const { setGeneration, clearGeneration, currentGeneration } = useWizardStore();
  const [generating, setGenerating] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composedBase64, setComposedBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    const state = useWizardStore.getState();
    setError(null);
    setGenerating(true);
    setComposedBase64(null);
    clearGeneration();

    try {
      const gen = await generateFromWizard(state);
      setGeneration(gen);

      // ── Composição: texto HTML/CSS sobre a imagem gerada ──────────────────
      setGenerating(false);
      setComposing(true);

      const cfg = state.activePresetConfig ?? {};

      const textConfig: TextPresetConfig =
        cfg.text ?? (getPresetById(FALLBACK_TEXT_PRESET_ID)?.config.text as TextPresetConfig);

      const colors: ColorConfig = cfg.colors ?? DEFAULT_COLORS;
      const composition: CompositionConfig = cfg.composition ?? DEFAULT_COMPOSITION;
      const targetFormat = FORMAT_BY_ID.get(DEFAULT_FORMAT_ID)!;

      const composed = await exportComposed({
        imageBase64: gen.imageBase64,
        texts: {
          headline: state.headline ?? "",
          subheadline: state.subheadline,
          cta: state.cta,
        },
        presetConfig: textConfig,
        colors,
        composition,
        targetFormat,
        watermark: false,
      });

      setComposedBase64(composed);
    } catch (e) {
      if (e instanceof GenerateError) {
        setError(e.message);
      } else {
        setError("Erro inesperado. Tente novamente.");
      }
    } finally {
      setGenerating(false);
      setComposing(false);
    }
  }

  const hasResult = Boolean(currentGeneration?.imageBase64);
  const isWorking = generating || composing;
  const displayBase64 = composedBase64 ?? currentGeneration?.imageBase64;

  return (
    <div className="h-full min-h-screen flex flex-col lg:flex-row">
      {/* ── Wizard ── */}
      <div className={hasResult ? "lg:w-1/2 lg:border-r lg:border-border" : "w-full"}>
        <WizardLayout
          step1={<WizardStep1Subject />}
          step2={<WizardStep2Style />}
          step3={<WizardStep3Text />}
          onGenerate={handleGenerate}
          generating={isWorking}
        />
      </div>

      {/* ── Resultado ── */}
      {hasResult && currentGeneration && (
        <div className="lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-10 bg-zinc-950 gap-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
            {composing ? "Compondo criativo..." : "Criativo gerado"}
          </p>

          {displayBase64 && (
            <img
              src={displayBase64}
              alt="Criativo gerado"
              className="max-h-[60vh] max-w-full rounded-xl object-contain border border-zinc-800 shadow-2xl"
            />
          )}

          {composing && (
            <div className="text-xs text-zinc-500 animate-pulse">Aplicando tipografia...</div>
          )}

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>via {currentGeneration.meta.provider}</span>
            <span>·</span>
            <span>{Math.round(currentGeneration.meta.generationMs / 1000)}s</span>
            {currentGeneration.presetIds.image && (
              <>
                <span>·</span>
                <span>{currentGeneration.presetIds.image}</span>
              </>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isWorking}
            className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold border border-zinc-700 text-zinc-300 hover:border-purple-500 hover:text-white transition-colors disabled:opacity-40"
          >
            {isWorking ? "Gerando..." : "↺ Gerar novamente"}
          </button>
        </div>
      )}

      {/* ── Toast de erro ── */}
      {error && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-red-950/95 text-red-200 text-sm px-5 py-3 rounded-xl border border-red-800 max-w-sm text-center shadow-xl">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 text-red-400 hover:text-red-200 font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
