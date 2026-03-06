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

export function WizardPage() {
  const { setGeneration, clearGeneration, currentGeneration } = useWizardStore();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    const state = useWizardStore.getState();
    setError(null);
    setGenerating(true);
    clearGeneration();

    try {
      const gen = await generateFromWizard(state);
      setGeneration(gen);
    } catch (e) {
      if (e instanceof GenerateError) {
        setError(e.message);
      } else {
        setError("Erro inesperado. Tente novamente.");
      }
    } finally {
      setGenerating(false);
    }
  }

  const hasResult = Boolean(currentGeneration?.imageBase64);

  return (
    <div className="h-full min-h-screen flex flex-col lg:flex-row">
      {/* ── Wizard ── */}
      <div className={hasResult ? "lg:w-1/2 lg:border-r lg:border-border" : "w-full"}>
        <WizardLayout
          step1={<WizardStep1Subject />}
          step2={<WizardStep2Style />}
          step3={<WizardStep3Text />}
          onGenerate={handleGenerate}
          generating={generating}
        />
      </div>

      {/* ── Resultado ── */}
      {hasResult && currentGeneration && (
        <div className="lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-10 bg-zinc-950 gap-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
            Criativo gerado
          </p>

          <img
            src={currentGeneration.imageBase64}
            alt="Criativo gerado"
            className="max-h-[60vh] max-w-full rounded-xl object-contain border border-zinc-800 shadow-2xl"
          />

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
            disabled={generating}
            className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold border border-zinc-700 text-zinc-300 hover:border-purple-500 hover:text-white transition-colors disabled:opacity-40"
          >
            {generating ? "Gerando..." : "↺ Gerar novamente"}
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
