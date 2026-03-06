// src/features/editor/wizard/WizardStep3Text.tsx
// CREATYNG — MASTER SPEC DIFF 9.1 (shell)
// TextStylePicker, FontSelector e PreviewCanvas preenchidos em diffs TR.3, 9.3, 9.4.

import { useWizardStore } from "@/stores/useWizardStore";

export function WizardStep3Text() {
  const { headline, subheadline, cta, setHeadline, setSubheadline, setCta, mode } =
    useWizardStore();

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Passo 3 — Textos</h2>
        <p className="text-muted-foreground text-sm">
          Os textos serão compostos sobre a imagem gerada com tipografia real.
        </p>
      </div>

      {/* Headline */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          Headline <span className="text-muted-foreground font-normal">(principal)</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Ex: EU QUERIA SER FORTE"
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>

      {/* Subheadline + CTA visíveis em advanced */}
      {mode === "advanced" && (
        <>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Subheadline</label>
            <input
              type="text"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="Ex: Sua jornada começa aqui"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">CTA</label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Ex: COMPRE AGORA"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </>
      )}

      {/* CTA visível no quick mode também */}
      {mode === "quick" && (
        <div>
          <label className="text-sm font-medium mb-1.5 block">CTA</label>
          <input
            type="text"
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="Ex: COMPRE AGORA"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      )}

      {/* TextStylePicker placeholder — preenchido no DIFF TR.3 */}
      <div className="mt-2 p-4 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
        Seletor de estilo de texto — disponível no DIFF TR.3
      </div>
    </div>
  );
}
