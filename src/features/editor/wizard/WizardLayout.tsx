// src/features/editor/wizard/WizardLayout.tsx
// CREATYNG — MASTER SPEC DIFF 9.1
// Shell do wizard: stepper + navegação. Sem lógica de geração.

import React, { useEffect, useCallback } from "react";
import { useWizardStore } from "@/stores/useWizardStore";
import { cn } from "@/lib/utils";

interface WizardLayoutProps {
  step1: React.ReactNode;
  step2: React.ReactNode;
  step3: React.ReactNode;
  onGenerate?: () => void;
  generating?: boolean;
}

const STEP_LABELS = ["Sujeito", "Estilo", "Textos"];

export function WizardLayout({ step1, step2, step3, onGenerate, generating }: WizardLayoutProps) {
  const { currentStep, mode, goNext, goBack, goToStep, setMode } = useWizardStore();

  // Navegação por teclado
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Enter" && currentStep < 3) goNext();
      if (e.key === "Escape" && currentStep > 1) goBack();
    },
    [currentStep, goNext, goBack]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const steps = [step1, step2, step3];

  return (
    <div className="flex flex-col h-full min-h-screen bg-background text-foreground">
      {/* Header: stepper + toggle modo */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        {/* Stepper */}
        <div className="flex items-center gap-3">
          {STEP_LABELS.map((label, idx) => {
            const step = (idx + 1) as 1 | 2 | 3;
            const isActive = currentStep === step;
            const isDone = currentStep > step;
            return (
              <React.Fragment key={step}>
                <button
                  onClick={() => isDone && goToStep(step)}
                  className={cn(
                    "flex items-center gap-2 transition-opacity",
                    isDone ? "cursor-pointer opacity-100" : "cursor-default",
                    !isActive && !isDone && "opacity-40"
                  )}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                      isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : isDone
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-transparent border-muted-foreground text-muted-foreground"
                    )}
                  >
                    {isDone ? "✓" : step}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium hidden sm:block",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </span>
                </button>
                {idx < 2 && (
                  <div
                    className={cn(
                      "w-8 h-px transition-colors",
                      isDone ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Toggle quick / advanced */}
        <button
          onClick={() => setMode(mode === "quick" ? "advanced" : "quick")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
        >
          {mode === "quick" ? (
            <>⚡ Rápido<span className="text-xs opacity-50 ml-1">→ Avançado</span></>
          ) : (
            <>⚙ Avançado<span className="text-xs opacity-50 ml-1">→ Rápido</span></>
          )}
        </button>
      </header>

      {/* Conteúdo do passo */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {steps[currentStep - 1]}
      </main>

      {/* Footer: navegação */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
        <button
          onClick={goBack}
          disabled={currentStep === 1}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            currentStep === 1
              ? "opacity-0 pointer-events-none"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          ← Voltar
        </button>

        {currentStep < 3 ? (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Próximo →
          </button>
        ) : (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <span className="animate-spin">◌</span> Gerando...
              </>
            ) : (
              <>✦ Gerar Criativo</>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
