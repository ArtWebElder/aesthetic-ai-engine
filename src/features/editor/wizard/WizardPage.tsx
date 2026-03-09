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
import { exportComposed, FORMAT_BY_ID, type FoodPalette } from "../engine/exportComposed";
import { composePopDesign } from "../engine/popDesign";
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

// ── Paleta contextual por tipo de culinária ────────────────────────────────────

function paletteHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getFoodPalette(
  headline = "",
  subheadline = "",
  instructions = ""
): FoodPalette {
  const t = [headline, subheadline, instructions].join(" ").toLowerCase();
  const v = paletteHash(headline) % 3; // 0, 1, or 2

  if (/açaí|acai|frozen|smoothie|sorvete|gelato|milkshake|picolé/.test(t)) {
    // A: roxo, B: roxo azulado, C: rosa roxo
    const accents = ["#7B2D8E", "#5C2D91", "#9B2D8E"] as const;
    const lights  = ["#E8D5F0", "#D5D0F5", "#F0D0EE"] as const;
    const texts   = ["#2D1B36", "#1B1D36", "#361B33"] as const;
    return { accent: accents[v], accentLight: lights[v], badgeBg: "rgba(255,255,255,0.92)", badgeText: texts[v], ctaBg: accents[v], ctaText: "#FFFFFF" };
  }
  if (/sushi|sashimi|temaki|japonês|japanese|japa|uramaki|combinado/.test(t)) {
    // A: vermelho, B: vermelho escuro, C: coral
    const accents = ["#C0392B", "#8B0000", "#D44638"] as const;
    const lights  = ["#F5D5D0", "#F0CCCC", "#F5D8D5"] as const;
    return { accent: accents[v], accentLight: lights[v], badgeBg: "rgba(255,255,255,0.92)", badgeText: "#1A1A1A", ctaBg: accents[v], ctaText: "#FFFFFF" };
  }
  if (/pizza|pizzaria|italiana|massa|lasanha|forno/.test(t)) {
    // A: vermelho tomate, B: laranja fogo, C: vermelho escuro
    const accents = ["#D4380D", "#E85D04", "#B71C1C"] as const;
    const lights  = ["#FFF1E6", "#FFF3E0", "#FFEBEE"] as const;
    return { accent: accents[v], accentLight: lights[v], badgeBg: "rgba(255,248,240,0.92)", badgeText: "#2D1600", ctaBg: accents[v], ctaText: "#FFFFFF" };
  }
  if (/burger|burguer|hambúrguer|hamburger|smash|lanche|sanduíche/.test(t)) {
    // A: dourado, B: laranja, C: bronze
    const accents = ["#D4A853", "#E67E22", "#C0702B"] as const;
    const lights  = ["#FFF8E7", "#FFF3E0", "#FFF0E0"] as const;
    return { accent: accents[v], accentLight: lights[v], badgeBg: "rgba(255,248,240,0.92)", badgeText: "#2D1600", ctaBg: accents[v], ctaText: "#FFFFFF" };
  }
  // Default — dourado elegante
  return {
    accent:      "#D4A853",
    accentLight: "#FFF8E7",
    badgeBg:     "rgba(255,255,255,0.90)",
    badgeText:   "#1A1A1A",
    ctaBg:       "#D4A853",
    ctaText:     "#FFFFFF",
  };
}

export function WizardPage() {
  const { setGeneration, clearGeneration, currentGeneration, setSubjectIsolated } = useWizardStore();
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
      // ── Pop Design: Gemini gera subject+elementos em fundo branco, depois bg removal ──
      if (state.selectedImagePresetId === "sys-img-pop-design") {
        if (!state.subjectBase64) {
          throw new GenerateError("no_subject", "Envie uma imagem do sujeito antes de gerar.");
        }

        const cfg = state.activePresetConfig ?? {};

        // Defensive fallback: if text preset config is missing, use hardcoded defaults
        const textConfig: TextPresetConfig =
          cfg.text ??
          (getPresetById("sys-txt-pop-design")?.config.text as TextPresetConfig | undefined) ??
          {
            stylePreset: "pop-design",
            headlineFont: "Montserrat",
            bodyFont: "Montserrat",
            headlineWeight: 900,
            bodyWeight: 400,
            headlineTracking: "-0.02em",
            headlineLineHeight: 0.92,
            headlineTransform: "uppercase",
            effects: { glow: false, glowIntensity: 0, shadow: "soft", stroke: false, gradient: false },
            accentWordAuto: false,
            blendMode: "normal",
          } satisfies TextPresetConfig;
        const targetFormat = FORMAT_BY_ID.get(DEFAULT_FORMAT_ID)!;

        // Step 1 — Gemini gera o subject com elementos flutuantes em fundo branco
        let geminiBase64: string;
        try {
          const gen = await generateFromWizard(state);
          geminiBase64 = gen.imageBase64;
          setGeneration(gen); // salva geração intermediária para meta
        } catch (e) {
          // Fallback: usar subject original se Gemini falhar
          console.warn("[PopDesign] Gemini failed, using original subject:", e);
          geminiBase64 = state.subjectBase64;
        }

        setGenerating(false);
        setComposing(true);

        // Re-read state após async Gemini — wizard fields may have changed
        const freshState = useWizardStore.getState();
        const freshPalette = getFoodPalette(freshState.headline, freshState.subheadline, freshState.freeInstructions);

        // Step 2 — Usar Gemini output direto (bg branco removido via white-threshold
        // no canvas; bg removal cortava elementos voando junto ao subject)
        const isolatedBase64: string | null = geminiBase64;
        setSubjectIsolated(isolatedBase64);

        console.log("[Creatyng PopDesign] composePopDesign input:", {
          headline: freshState.headline,
          price: freshState.price,
          whatsapp: freshState.whatsapp,
          instagram: freshState.instagram,
        });

        let popBase64: string;
        try {
          popBase64 = await composePopDesign(
            isolatedBase64 || geminiBase64,
            {
              headline:    freshState.headline ?? "",
              subheadline: freshState.subheadline,
              cta:         freshState.cta,
              price:       freshState.price ?? undefined,
              whatsapp:    freshState.whatsapp,
              instagram:   freshState.instagram,
            },
            freshPalette,
            textConfig,
            targetFormat.w,
            targetFormat.h,
            false, // watermark
          );
          console.log("[PopDesign] compose OK, base64 length:", popBase64?.length);
        } catch (e) {
          console.error("[PopDesign] composePopDesign failed:", e);
          throw e;
        }

        try {
          setComposedBase64(popBase64);
          console.log("[PopDesign] setComposedBase64 OK");
        } catch (e) {
          console.error("[PopDesign] setComposedBase64 failed:", e);
        }

        try {
          const genId = typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `pop-${Date.now().toString(36)}`;
          setGeneration({
            generationId: genId,
            imageBase64: popBase64,
            imageThumbnail: popBase64,
            wizardStateSnapshot: { ...freshState } as never,
            presetIds: {
              image: freshState.selectedImagePresetId,
              text: freshState.selectedTextPresetId,
            },
            activePresetConfigSnapshot: { ...(freshState.activePresetConfig ?? {}) },
            meta: {
              provider: "pop-design",
              model: "client-side",
              dnaUsed: false,
              aspectRatio: `${targetFormat.w}x${targetFormat.h}`,
              generationMs: 0,
            },
            timestamp: Date.now(),
          });
          console.log("[PopDesign] setGeneration OK");
        } catch (e) {
          console.error("[PopDesign] setGeneration failed:", e);
        }

        return;
      }

      // ── Standard AI generation ──────────────────────────────────────────────
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

      // setCategory nunca é chamado na UI ainda → category fica "general".
      // Ativar food pop também quando dados de food pop estiverem preenchidos.
      const isFoodPop =
        state.category === "food" ||
        Boolean(state.price?.value || state.whatsapp || state.instagram);

      // Paleta contextual por tipo de culinária — detecta açaí, sushi, pizza, burger
      const foodPalette = getFoodPalette(
        state.headline,
        state.subheadline,
        state.freeInstructions
      );

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
        foodPopOverlay: isFoodPop,
        foodPopData: isFoodPop
          ? {
              price: state.price ?? undefined,
              whatsapp: state.whatsapp,
              instagram: state.instagram,
              accentColor: foodPalette.accent,
              palette: foodPalette,
            }
          : undefined,
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
