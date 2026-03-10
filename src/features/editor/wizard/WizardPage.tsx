// src/features/editor/wizard/WizardPage.tsx
// CREATYNG — Fase 2 — Página que conecta o wizard ao motor de geração.
// Rota: /app/create

import { useState, useRef } from "react";
import { WizardLayout } from "./WizardLayout";
import { WizardStep1Subject } from "./WizardStep1Subject";
import { WizardStep2Style } from "./WizardStep2Style";
import { WizardStep3Text } from "./WizardStep3Text";
import { useWizardStore } from "@/stores/useWizardStore";
import { generateFromWizard, GenerateError } from "@/services/generateService";
import { exportComposed, FORMAT_BY_ID, type FoodPalette } from "../engine/exportComposed";
import { composePopDesign, composePopDesignV2, type PopTexts } from "../engine/popDesign";
import { RefinementChat } from "./RefinementChat";
import { type RefinementOverrides } from "../engine/chatApply";
import { buildComposition } from "../engine/compositionBuilder";
import { exportCompositionToPNG } from "../engine/htmlExport";
import { applyChatToComposition } from "../engine/chatApplyComposition";
import type { CreatygnComposition } from "@/types/composition";
import { getPresetById } from "@/lib/presetUtils";
import type { TextPresetConfig, ColorConfig, CompositionConfig } from "@/types/preset";

const FALLBACK_TEXT_PRESET_ID = "sys-txt-impact";
const USE_HTML_RENDERER = true; // toggle para ativar/desativar o renderer HTML/CSS no Pop Design

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
  const [popDesignStep, setPopDesignStep] = useState<string>("");
  const [refinementOverrides, setRefinementOverrides] = useState<RefinementOverrides>({});

  // ── Refs para recomposição sem regerar ───────────────────────────────────
  const popBgRef        = useRef<string>("");
  const popSubjectRef   = useRef<string>("");
  const standardImgRef  = useRef<string>("");
  const paletteRef      = useRef<FoodPalette | null>(null);
  const textConfigRef   = useRef<TextPresetConfig | null>(null);
  const colorsRef       = useRef<ColorConfig>(DEFAULT_COLORS);
  const compositionRef  = useRef<CompositionConfig>(DEFAULT_COMPOSITION);
  const isFoodPopRef        = useRef<boolean>(false);
  const htmlCompositionRef  = useRef<CreatygnComposition | null>(null);

  // ── Carrega Google Font dinamicamente ────────────────────────────────────
  async function loadGoogleFont(fontName: string): Promise<void> {
    if (!document.querySelector(`link[data-font="${fontName}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.setAttribute("data-font", fontName);
      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
    }
    try { await document.fonts.load(`900 16px "${fontName}"`); } catch { /* proceed anyway */ }
  }

  // ── Recompõe o criativo com overrides, sem regerar a imagem ─────────────
  async function recomposeWithOverrides(overrides: RefinementOverrides) {
    console.log("[Recompose] called with overrides:", overrides);
    const state = useWizardStore.getState();
    const liveGeneration = state.currentGeneration;
    console.log("[Recompose] has liveGeneration:", !!liveGeneration, "| popBg:", !!popBgRef.current, "| standardImg:", !!standardImgRef.current);
    if (!liveGeneration) return;
    const isPopDesign = state.selectedImagePresetId === "sys-img-pop-design";

    if (overrides.fontFamily) await loadGoogleFont(overrides.fontFamily);

    // ── HTML renderer path (Pop Design with composition JSON) ──────────────
    if (isPopDesign && USE_HTML_RENDERER && htmlCompositionRef.current) {
      let updated = structuredClone(htmlCompositionRef.current);

      // Apply each override as a chat command on the composition
      if (overrides.headline) {
        updated = applyChatToComposition(updated, { type: 'change_text', target: 'headline', value: overrides.headline });
      }
      if (overrides.subheadline) {
        updated = applyChatToComposition(updated, { type: 'change_text', target: 'subheadline', value: overrides.subheadline });
      }
      if (overrides.cta) {
        updated = applyChatToComposition(updated, { type: 'change_text', target: 'cta', value: overrides.cta });
      }
      if (overrides.price?.value) {
        updated = applyChatToComposition(updated, { type: 'change_text', target: 'price', value: overrides.price.value });
      }
      if (overrides.accentColor) {
        updated = applyChatToComposition(updated, { type: 'change_color', value: overrides.accentColor });
      }
      if (overrides.fontFamily) {
        updated = applyChatToComposition(updated, { type: 'change_font', value: overrides.fontFamily });
      }

      const result = await exportCompositionToPNG(updated);
      htmlCompositionRef.current = updated;
      setComposedBase64(result);
      return;
    }

    const basePalette = paletteRef.current ?? getFoodPalette(state.headline, state.subheadline, state.freeInstructions);
    const mergedPalette: FoodPalette = overrides.accentColor
      ? { ...basePalette, accent: overrides.accentColor, ctaBg: overrides.accentColor }
      : basePalette;

    const baseTextConfig = textConfigRef.current;
    const mergedTextConfig: TextPresetConfig = (overrides.fontFamily && baseTextConfig)
      ? { ...baseTextConfig, headlineFont: overrides.fontFamily, bodyFont: overrides.fontFamily }
      : (baseTextConfig ?? {} as TextPresetConfig);

    const format = FORMAT_BY_ID.get(DEFAULT_FORMAT_ID)!;

    if (isPopDesign && popBgRef.current) {
      const popTexts: PopTexts = {
        headline:    overrides.headline    ?? (state.headline ?? ""),
        subheadline: overrides.subheadline ?? state.subheadline,
        cta:         overrides.cta         ?? state.cta,
        price:       overrides.price       ?? state.price ?? undefined,
        whatsapp:    overrides.whatsapp    ?? state.whatsapp,
        instagram:   overrides.instagram   ?? state.instagram,
      };
      const result = await composePopDesignV2(
        popBgRef.current,
        popSubjectRef.current,
        popTexts,
        mergedPalette,
        mergedTextConfig,
        format.w, format.h,
        false,
        overrides.headlineSizeFactor ?? 1.0,
      );
      console.log("[Recompose] popDesignV2 result length:", result?.length);
      setComposedBase64(result);
    } else if (!isPopDesign && standardImgRef.current) {
      const mergedColors: ColorConfig = overrides.accentColor
        ? { ...colorsRef.current, primary: overrides.accentColor }
        : colorsRef.current;
      const isFoodPop = isFoodPopRef.current;
      const result = await exportComposed({
        imageBase64: standardImgRef.current,
        texts: {
          headline:    overrides.headline    ?? (state.headline ?? ""),
          subheadline: overrides.subheadline ?? state.subheadline,
          cta:         overrides.cta         ?? state.cta,
        },
        presetConfig: mergedTextConfig,
        colors: mergedColors,
        composition: compositionRef.current,
        targetFormat: format,
        watermark: false,
        foodPopOverlay: isFoodPop,
        foodPopData: isFoodPop ? {
          price:       overrides.price    ?? state.price ?? undefined,
          whatsapp:    overrides.whatsapp ?? state.whatsapp,
          instagram:   overrides.instagram ?? state.instagram,
          accentColor: mergedPalette.accent,
          palette:     mergedPalette,
        } : undefined,
      });
      console.log("[Recompose] exportComposed result length:", result?.length);
      setComposedBase64(result);
    } else {
      console.warn("[Recompose] no branch matched — isPopDesign:", isPopDesign, "popBg:", !!popBgRef.current, "standardImg:", !!standardImgRef.current);
    }
  }

  async function handleGenerate() {
    const state = useWizardStore.getState();
    setError(null);
    setGenerating(true);
    setComposedBase64(null);
    clearGeneration();
    // Reset refinement on each new generation
    setRefinementOverrides({});
    popBgRef.current         = "";
    popSubjectRef.current    = "";
    standardImgRef.current   = "";
    htmlCompositionRef.current = null;

    try {
      // ── Pop Design: pipeline duplo Gemini — fundo separado + subject separado ──
      if (state.selectedImagePresetId === "sys-img-pop-design") {
        if (!state.subjectBase64) {
          throw new GenerateError("no_subject", "Envie uma imagem do sujeito antes de gerar.");
        }

        const cfg = state.activePresetConfig ?? {};
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
        const t0 = Date.now();

        // ── Chamada 1: Fundo + elementos (text-to-image, sem subject no centro) ──
        setPopDesignStep("Gerando ambientação...");
        let bgBase64 = "";
        try {
          const bgGen = await generateFromWizard(
            { ...state, _popDesignPhase: "background" } as typeof state
          );
          bgBase64 = bgGen.imageBase64;
          console.log("[PopDesignV2] Step 1 OK — background generated");
        } catch (e) {
          console.warn("[PopDesignV2] Step 1 failed, falling back to renderer gradient:", e);
        }

        // ── Chamada 2: Subject isolado em fundo branco (img2img strict) ──
        setPopDesignStep("Gerando produto...");
        let subjectBase64 = state.subjectBase64;
        try {
          const subGen = await generateFromWizard(
            { ...state, _popDesignPhase: "subject" } as typeof state
          );
          subjectBase64 = subGen.imageBase64;
          setSubjectIsolated(subjectBase64);
          console.log("[PopDesignV2] Step 2 OK — subject generated");
        } catch (e) {
          console.warn("[PopDesignV2] Step 2 failed, using original subject photo:", e);
        }

        setGenerating(false);
        setComposing(true);
        setPopDesignStep("Compondo criativo...");

        const freshState = useWizardStore.getState();
        const freshPalette = getFoodPalette(freshState.headline, freshState.subheadline, freshState.freeInstructions);

        // Store for recompose without re-generating
        popBgRef.current      = bgBase64;
        popSubjectRef.current = subjectBase64;
        paletteRef.current    = freshPalette;
        textConfigRef.current = textConfig;

        const popTexts = {
          headline:    freshState.headline ?? "",
          subheadline: freshState.subheadline,
          cta:         freshState.cta,
          price:       freshState.price ?? undefined,
          whatsapp:    freshState.whatsapp,
          instagram:   freshState.instagram,
        };

        let popBase64: string;

        if (USE_HTML_RENDERER) {
          // ── HTML/CSS renderer path ──────────────────────────────────────
          try {
            const composition = buildComposition({
              bgBase64: bgBase64 || undefined,
              subjectBase64,
              headline:    freshState.headline ?? "",
              subheadline: freshState.subheadline,
              cta:         freshState.cta,
              price:       freshState.price ?? undefined,
              whatsapp:    freshState.whatsapp,
              instagram:   freshState.instagram,
              preset: freshState.selectedImagePresetId || 'sys-img-pop-design',
              palette: freshPalette,
              fontFamily: textConfig.headlineFont,
            });
            htmlCompositionRef.current = composition;
            popBase64 = await exportCompositionToPNG(composition);
            console.log("[PopDesignHTML] compose OK, length:", popBase64?.length);
          } catch (e) {
            console.error("[PopDesignHTML] HTML renderer failed, falling back to Canvas 2D:", e);
            htmlCompositionRef.current = null;
            try {
              popBase64 = await composePopDesignV2(
                bgBase64, subjectBase64, popTexts, freshPalette, textConfig,
                targetFormat.w, targetFormat.h, false,
              );
            } catch {
              popBase64 = await composePopDesign(
                subjectBase64, popTexts, freshPalette, textConfig,
                targetFormat.w, targetFormat.h, false,
              );
            }
          }
        } else {
          // ── Canvas 2D renderer path (fallback) ──────────────────────────
          try {
            popBase64 = await composePopDesignV2(
              bgBase64,
              subjectBase64,
              popTexts,
              freshPalette,
              textConfig,
              targetFormat.w,
              targetFormat.h,
              false,
            );
            console.log("[PopDesignV2] compose OK, length:", popBase64?.length);
          } catch (e) {
            console.error("[PopDesignV2] composePopDesignV2 failed, falling back to v1:", e);
            popBase64 = await composePopDesign(
              subjectBase64,
              popTexts,
              freshPalette,
              textConfig,
              targetFormat.w,
              targetFormat.h,
              false,
            );
          }
        }

        setComposedBase64(popBase64);

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
            provider: "pop-design-v2",
            model: "gemini-dual",
            dnaUsed: false,
            aspectRatio: `${targetFormat.w}x${targetFormat.h}`,
            generationMs: Date.now() - t0,
          },
          timestamp: Date.now(),
        });

        setPopDesignStep("");
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

      // Store for recompose without re-generating
      standardImgRef.current = gen.imageBase64;
      textConfigRef.current  = textConfig;
      colorsRef.current      = colors;
      compositionRef.current = composition;
      paletteRef.current     = foodPalette;
      isFoodPopRef.current   = isFoodPop;

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

          {(generating || composing) && popDesignStep && (
            <div className="text-xs text-purple-400 animate-pulse font-medium">{popDesignStep}</div>
          )}
          {composing && !popDesignStep && (
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

          {!isWorking && (
            <div className="w-full mt-2">
              <RefinementChat
                overrides={refinementOverrides}
                onOverridesChange={(newOverrides) => {
                  setRefinementOverrides(newOverrides);
                  recomposeWithOverrides(newOverrides);
                }}
                onRegenerate={handleGenerate}
              />
            </div>
          )}
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
