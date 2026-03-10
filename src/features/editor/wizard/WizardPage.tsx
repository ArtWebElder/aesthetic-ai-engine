// src/features/editor/wizard/WizardPage.tsx
// CREATYNG — Fase 4 — Wizard redesenhado com 5 steps visuais.
// REGRA: handleGenerate e recomposeWithOverrides são idênticos à versão anterior.
// Apenas o shell visual e navegação foram redesenhados.

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/features/toast/useToast";
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
import { WizardStep1Subject } from "./WizardStep1Subject";
import { WizardStep2Style } from "./WizardStep2Style";
import { WizardStep3Text } from "./WizardStep3Text";
import { ExportModal } from "./ExportModal";

// ── Constants (idênticos ao original) ─────────────────────────────────────────

const FALLBACK_TEXT_PRESET_ID = "sys-txt-impact";
const USE_HTML_RENDERER = true;

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

// ── Step labels ───────────────────────────────────────────────────────────────

const STEP_LABELS = ["Upload", "Estilo", "Textos", "Gerando", "Resultado"];

// ── Generation stages ─────────────────────────────────────────────────────────

const GENERATION_STAGES = [
  "Analisando sua imagem...",
  "Construindo prompt de 6 camadas...",
  "Gemini gerando cena cinematográfica...",
  "Aplicando tipografia profissional...",
  "Renderizando composição final...",
  "Finalizando seu criativo!",
];

// ── Paleta contextual por tipo de culinária (idêntica ao original) ────────────

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
  const v = paletteHash(headline) % 3;

  if (/açaí|acai|frozen|smoothie|sorvete|gelato|milkshake|picolé/.test(t)) {
    const accents = ["#7B2D8E", "#5C2D91", "#9B2D8E"] as const;
    const lights  = ["#E8D5F0", "#D5D0F5", "#F0D0EE"] as const;
    const texts   = ["#2D1B36", "#1B1D36", "#361B33"] as const;
    return { accent: accents[v], accentLight: lights[v], badgeBg: "rgba(255,255,255,0.92)", badgeText: texts[v], ctaBg: accents[v], ctaText: "#FFFFFF" };
  }
  if (/sushi|sashimi|temaki|japonês|japanese|japa|uramaki|combinado/.test(t)) {
    const accents = ["#C0392B", "#8B0000", "#D44638"] as const;
    const lights  = ["#F5D5D0", "#F0CCCC", "#F5D8D5"] as const;
    return { accent: accents[v], accentLight: lights[v], badgeBg: "rgba(255,255,255,0.92)", badgeText: "#1A1A1A", ctaBg: accents[v], ctaText: "#FFFFFF" };
  }
  if (/pizza|pizzaria|italiana|massa|lasanha|forno/.test(t)) {
    const accents = ["#D4380D", "#E85D04", "#B71C1C"] as const;
    const lights  = ["#FFF1E6", "#FFF3E0", "#FFEBEE"] as const;
    return { accent: accents[v], accentLight: lights[v], badgeBg: "rgba(255,248,240,0.92)", badgeText: "#2D1600", ctaBg: accents[v], ctaText: "#FFFFFF" };
  }
  if (/burger|burguer|hambúrguer|hamburger|smash|lanche|sanduíche/.test(t)) {
    const accents = ["#D4A853", "#E67E22", "#C0702B"] as const;
    const lights  = ["#FFF8E7", "#FFF3E0", "#FFF0E0"] as const;
    return { accent: accents[v], accentLight: lights[v], badgeBg: "rgba(255,248,240,0.92)", badgeText: "#2D1600", ctaBg: accents[v], ctaText: "#FFFFFF" };
  }
  return {
    accent:      "#D4A853",
    accentLight: "#FFF8E7",
    badgeBg:     "rgba(255,255,255,0.90)",
    badgeText:   "#1A1A1A",
    ctaBg:       "#D4A853",
    ctaText:     "#FFFFFF",
  };
}

// ── StepIndicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center">
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const isDone = current > step;
        const isActive = current === step;
        return (
          <div key={step} className="flex items-center">
            {idx > 0 && (
              <div
                className="h-px w-6 sm:w-10 transition-all duration-500"
                style={{ background: isDone || isActive ? "#f97316" : "#3f3f46" }}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2"
                style={{
                  background: isDone ? "#f97316" : isActive ? "#1c1917" : "#18181b",
                  borderColor: isDone || isActive ? "#f97316" : "#3f3f46",
                  color: isDone ? "#fff" : isActive ? "#f97316" : "#52525b",
                }}
              >
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step}
              </div>
              <span
                className="text-[10px] font-medium hidden sm:block"
                style={{ color: isActive ? "#f97316" : isDone ? "#a1a1aa" : "#52525b" }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── WizardPage ────────────────────────────────────────────────────────────────

export function WizardPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [uiStep, setUiStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [stageIndex, setStageIndex] = useState(0);
  const [generationDone, setGenerationDone] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // existing generation state (idênticos ao original)
  const [generating, setGenerating] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composedBase64, setComposedBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [popDesignStep, setPopDesignStep] = useState<string>("");
  const [refinementOverrides, setRefinementOverrides] = useState<RefinementOverrides>({});

  const {
    subjectBase64,
    selectedImagePresetId,
    headline,
    subheadline,
    cta,
    whatsapp,
    instagram,
    price,
    currentGeneration,
    setGeneration,
    clearGeneration,
    setSubjectIsolated,
    setComposedImage,
  } = useWizardStore();

  // refs (idênticos ao original)
  const popBgRef            = useRef<string>("");
  const popSubjectRef       = useRef<string>("");
  const standardImgRef      = useRef<string>("");
  const paletteRef          = useRef<FoodPalette | null>(null);
  const textConfigRef       = useRef<TextPresetConfig | null>(null);
  const colorsRef           = useRef<ColorConfig>(DEFAULT_COLORS);
  const compositionRef      = useRef<CompositionConfig>(DEFAULT_COMPOSITION);
  const isFoodPopRef        = useRef<boolean>(false);
  const htmlCompositionRef  = useRef<CreatygnComposition | null>(null);

  // Stage animation when entering step 4
  useEffect(() => {
    if (uiStep !== 4) return;
    setStageIndex(0);
    setGenerationDone(false);
    setGenerationError(null);
    const t1 = setTimeout(() => setStageIndex(1), 1500);
    const t2 = setTimeout(() => setStageIndex(2), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [uiStep]);

  // Auto-advance to step 5 when generation completes
  useEffect(() => {
    if (!generationDone || uiStep !== 4) return;
    setStageIndex(3);
    const t1 = setTimeout(() => setStageIndex(4), 600);
    const t2 = setTimeout(() => setStageIndex(5), 1200);
    const t3 = setTimeout(() => setUiStep(5), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [generationDone, uiStep]);

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

  // recomposeWithOverrides (idêntico ao original + setComposedImage)
  async function recomposeWithOverrides(overrides: RefinementOverrides) {
    const state = useWizardStore.getState();
    const liveGeneration = state.currentGeneration;
    if (!liveGeneration) return;
    const isPopDesign = state.selectedImagePresetId === "sys-img-pop-design";

    if (overrides.fontFamily) await loadGoogleFont(overrides.fontFamily);

    if (USE_HTML_RENDERER && htmlCompositionRef.current) {
      let updated = structuredClone(htmlCompositionRef.current);
      if (overrides.headline) updated = applyChatToComposition(updated, { type: 'change_text', target: 'headline', value: overrides.headline });
      if (overrides.subheadline) updated = applyChatToComposition(updated, { type: 'change_text', target: 'subheadline', value: overrides.subheadline });
      if (overrides.cta) updated = applyChatToComposition(updated, { type: 'change_text', target: 'cta', value: overrides.cta });
      if (overrides.price?.value) updated = applyChatToComposition(updated, { type: 'change_text', target: 'price', value: overrides.price.value });
      if (overrides.accentColor) updated = applyChatToComposition(updated, { type: 'change_color', value: overrides.accentColor });
      if (overrides.fontFamily) updated = applyChatToComposition(updated, { type: 'change_font', value: overrides.fontFamily });
      const result = await exportCompositionToPNG(updated);
      htmlCompositionRef.current = updated;
      setComposedBase64(result);
      setComposedImage(result);
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
        popBgRef.current, popSubjectRef.current, popTexts, mergedPalette, mergedTextConfig,
        format.w, format.h, false, overrides.headlineSizeFactor ?? 1.0,
      );
      setComposedBase64(result);
      setComposedImage(result);
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
      setComposedBase64(result);
      setComposedImage(result);
    }
  }

  // handleGenerate (idêntico ao original, com setGenerationDone no final)
  async function handleGenerate() {
    const state = useWizardStore.getState();
    setError(null);
    setGenerationError(null);
    setGenerating(true);
    setComposedBase64(null);
    clearGeneration();
    setRefinementOverrides({});
    popBgRef.current           = "";
    popSubjectRef.current      = "";
    standardImgRef.current     = "";
    htmlCompositionRef.current = null;

    try {
      // ── Pop Design pipeline ─────────────────────────────────────────────────
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

        setPopDesignStep("Gerando ambientação...");
        let bgBase64 = "";
        try {
          const bgGen = await generateFromWizard(
            { ...state, _popDesignPhase: "background" } as typeof state
          );
          bgBase64 = bgGen.imageBase64;
        } catch (e) {
          console.warn("[PopDesignV2] Step 1 failed:", e);
        }

        setPopDesignStep("Gerando produto...");
        let subjectBase64Local = state.subjectBase64;
        try {
          const subGen = await generateFromWizard(
            { ...state, _popDesignPhase: "subject" } as typeof state
          );
          subjectBase64Local = subGen.imageBase64;
          setSubjectIsolated(subjectBase64Local);
        } catch (e) {
          console.warn("[PopDesignV2] Step 2 failed:", e);
        }

        setGenerating(false);
        setComposing(true);
        setPopDesignStep("Compondo criativo...");

        const freshState = useWizardStore.getState();
        const freshPalette = getFoodPalette(freshState.headline, freshState.subheadline, freshState.freeInstructions);

        popBgRef.current      = bgBase64;
        popSubjectRef.current = subjectBase64Local ?? "";
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
          try {
            const composition = buildComposition({
              bgBase64: bgBase64 || undefined,
              subjectBase64: subjectBase64Local ?? "",
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
          } catch (e) {
            console.error("[PopDesignHTML] failed, falling back:", e);
            htmlCompositionRef.current = null;
            try {
              popBase64 = await composePopDesignV2(
                bgBase64, subjectBase64Local ?? "", popTexts, freshPalette, textConfig,
                targetFormat.w, targetFormat.h, false,
              );
            } catch {
              popBase64 = await composePopDesign(
                subjectBase64Local ?? "", popTexts, freshPalette, textConfig,
                targetFormat.w, targetFormat.h, false,
              );
            }
          }
        } else {
          try {
            popBase64 = await composePopDesignV2(
              bgBase64, subjectBase64Local ?? "", popTexts, freshPalette, textConfig,
              targetFormat.w, targetFormat.h, false,
            );
          } catch (e) {
            console.error("[PopDesignV2] failed, falling back to v1:", e);
            popBase64 = await composePopDesign(
              subjectBase64Local ?? "", popTexts, freshPalette, textConfig,
              targetFormat.w, targetFormat.h, false,
            );
          }
        }

        setComposedBase64(popBase64);
        setComposedImage(popBase64);

        const genId = typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `pop-${Date.now().toString(36)}`;
        setGeneration({
          generationId: genId,
          imageBase64: popBase64,
          imageThumbnail: popBase64,
          wizardStateSnapshot: { ...freshState } as never,
          presetIds: { image: freshState.selectedImagePresetId, text: freshState.selectedTextPresetId },
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
        setGenerationDone(true);
        return;
      }

      // ── Standard AI generation ──────────────────────────────────────────────
      const gen = await generateFromWizard(state);
      setGeneration(gen);

      setGenerating(false);
      setComposing(true);

      const cfg = state.activePresetConfig ?? {};
      const textConfig: TextPresetConfig =
        cfg.text ?? (getPresetById(FALLBACK_TEXT_PRESET_ID)?.config.text as TextPresetConfig);
      const colors: ColorConfig = cfg.colors ?? DEFAULT_COLORS;
      const composition: CompositionConfig = cfg.composition ?? DEFAULT_COMPOSITION;
      const targetFormat = FORMAT_BY_ID.get(DEFAULT_FORMAT_ID)!;

      const isFoodPop =
        state.category === "food" ||
        Boolean(state.price?.value || state.whatsapp || state.instagram);
      const foodPalette = getFoodPalette(state.headline, state.subheadline, state.freeInstructions);

      standardImgRef.current = gen.imageBase64;
      textConfigRef.current  = textConfig;
      colorsRef.current      = colors;
      compositionRef.current = composition;
      paletteRef.current     = foodPalette;
      isFoodPopRef.current   = isFoodPop;

      let composed: string;

      if (USE_HTML_RENDERER) {
        try {
          const compositionJSON = buildComposition({
            sceneBase64: gen.imageBase64,
            headline: state.headline ?? "",
            subheadline: state.subheadline,
            cta: state.cta,
            price: state.price ?? undefined,
            whatsapp: state.whatsapp,
            instagram: state.instagram,
            preset: state.selectedImagePresetId || 'sys-img-food-pop',
            palette: foodPalette,
            fontFamily: textConfig?.headlineFont,
          });
          htmlCompositionRef.current = compositionJSON;
          composed = await exportCompositionToPNG(compositionJSON);
        } catch (e) {
          console.error('[FoodPopHTML] failed, falling back:', e);
          htmlCompositionRef.current = null;
          composed = await exportComposed({
            imageBase64: gen.imageBase64,
            texts: { headline: state.headline ?? "", subheadline: state.subheadline, cta: state.cta },
            presetConfig: textConfig,
            colors,
            composition,
            targetFormat,
            watermark: false,
            foodPopOverlay: isFoodPop,
            foodPopData: isFoodPop ? {
              price: state.price ?? undefined,
              whatsapp: state.whatsapp,
              instagram: state.instagram,
              accentColor: foodPalette.accent,
              palette: foodPalette,
            } : undefined,
          });
        }
      } else {
        composed = await exportComposed({
          imageBase64: gen.imageBase64,
          texts: { headline: state.headline ?? "", subheadline: state.subheadline, cta: state.cta },
          presetConfig: textConfig,
          colors,
          composition,
          targetFormat,
          watermark: false,
          foodPopOverlay: isFoodPop,
          foodPopData: isFoodPop ? {
            price: state.price ?? undefined,
            whatsapp: state.whatsapp,
            instagram: state.instagram,
            accentColor: foodPalette.accent,
            palette: foodPalette,
          } : undefined,
        });
      }

      setComposedBase64(composed);
      setComposedImage(composed);
      setGenerationDone(true);
      toast.success("Criativo gerado com sucesso!");
    } catch (e) {
      const msg = e instanceof GenerateError ? e.message : "Erro inesperado. Tente novamente.";
      setError(msg);
      setGenerationError(msg);
      toast.error("Erro na geração. Tente novamente.");
    } finally {
      setGenerating(false);
      setComposing(false);
    }
  }

  // Navigation
  const canAdvance =
    uiStep === 1 ? Boolean(subjectBase64) :
    uiStep === 2 ? Boolean(selectedImagePresetId) :
    uiStep === 3 ? Boolean(headline?.trim()) :
    false;

  function handleNext() {
    if (uiStep < 3 && canAdvance) {
      setUiStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5);
    } else if (uiStep === 3 && canAdvance) {
      setUiStep(4);
      handleGenerate();
    }
  }

  function handleBack() {
    if (uiStep === 2 || uiStep === 3) {
      setUiStep((s) => (s - 1) as 1 | 2 | 3);
    } else if (uiStep === 5) {
      clearGeneration();
      setComposedBase64(null);
      setGenerationDone(false);
      setUiStep(3);
    } else if (uiStep === 4 && generationError) {
      setGenerationError(null);
      setGenerating(false);
      setComposing(false);
      setUiStep(3);
    }
  }

  function handleRegenerateFromResult() {
    clearGeneration();
    setComposedBase64(null);
    setGenerationDone(false);
    setRefinementOverrides({});
    htmlCompositionRef.current = null;
    setUiStep(4);
    handleGenerate();
  }

  const displayBase64 = composedBase64 ?? currentGeneration?.imageBase64;
  const isWorking = generating || composing;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      {/* Header + StepIndicator */}
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <StepIndicator current={uiStep} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">

          {/* Step 1: Upload */}
          {uiStep === 1 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Envie sua imagem</h1>
                <p className="text-zinc-400 text-sm mt-1">
                  Foto do produto, pessoa ou marca. O motor analisa e sugere o melhor estilo.
                </p>
              </div>
              <WizardStep1Subject />
            </div>
          )}

          {/* Step 2: Preset */}
          {uiStep === 2 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Escolha o estilo</h1>
                <p className="text-zinc-400 text-sm mt-1">
                  O preset define a atmosfera, iluminação e composição do criativo.
                </p>
              </div>
              <WizardStep2Style />
            </div>
          )}

          {/* Step 3: Texts */}
          {uiStep === 3 && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Adicione os textos</h1>
                <p className="text-zinc-400 text-sm mt-1">
                  Headline, preço, CTA e contato. A tipografia é renderizada em alta qualidade.
                </p>
              </div>
              <WizardStep3Text />
            </div>
          )}

          {/* Step 4: Generating */}
          {uiStep === 4 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 py-12">
              {generationError ? (
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                  <div className="w-16 h-16 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-2xl">
                    ✕
                  </div>
                  <div>
                    <p className="text-red-400 font-semibold text-lg">Erro na geração</p>
                    <p className="text-zinc-400 text-sm mt-1">{generationError}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setGenerationError(null); setUiStep(3); }}
                      className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => { setGenerationError(null); setGenerationDone(false); setUiStep(4); handleGenerate(); }}
                      className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Animated orb */}
                  <div className="relative flex items-center justify-center">
                    <div
                      className="absolute w-48 h-48 rounded-full blur-2xl opacity-40 animate-pulse"
                      style={{ background: "conic-gradient(from 0deg, #f97316, #a855f7, #3b82f6, #f97316)" }}
                    />
                    <div
                      className="relative w-32 h-32 rounded-full animate-spin"
                      style={{ background: "conic-gradient(from 0deg, #f97316, #a855f7, #3b82f6, #f97316)", animationDuration: "3s" }}
                    />
                    <div className="absolute w-24 h-24 rounded-full bg-zinc-950 flex items-center justify-center">
                      <span className="text-2xl">✦</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <h2 className="text-xl font-bold text-white">Criando seu criativo...</h2>
                    <p className="text-zinc-500 text-sm mt-1">Isso leva alguns segundos</p>
                  </div>

                  {/* Stage checklist */}
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    {GENERATION_STAGES.map((stage, idx) => {
                      const isDone = stageIndex > idx;
                      const isActive = stageIndex === idx;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                            style={{
                              background: isDone ? "#22c55e" : isActive ? "#f97316" : "#27272a",
                              border: `1.5px solid ${isDone ? "#22c55e" : isActive ? "#f97316" : "#3f3f46"}`,
                            }}
                          >
                            {isDone ? (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : isActive ? (
                              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            ) : null}
                          </div>
                          <span
                            className="text-sm transition-colors"
                            style={{ color: isDone ? "#4ade80" : isActive ? "#f97316" : "#52525b" }}
                          >
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-zinc-600">−5 créditos desta geração</p>
                </>
              )}
            </div>
          )}

          {/* Step 5: Result */}
          {uiStep === 5 && currentGeneration && (
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Preview */}
              <div className="flex flex-col items-center gap-4 lg:w-[55%]">
                <div className="flex items-center justify-between w-full">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                    {composing ? "Compondo criativo..." : "Criativo gerado!"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <span>via {currentGeneration.meta.provider}</span>
                    <span>·</span>
                    <span>{Math.round(currentGeneration.meta.generationMs / 1000)}s</span>
                  </div>
                </div>

                {displayBase64 && (
                  <img
                    src={displayBase64}
                    alt="Criativo gerado"
                    className="w-full max-h-[55vh] rounded-xl object-contain border border-zinc-800 shadow-2xl bg-zinc-900"
                  />
                )}

                {composing && popDesignStep && (
                  <p className="text-xs text-orange-400 animate-pulse font-medium">{popDesignStep}</p>
                )}
                {composing && !popDesignStep && (
                  <p className="text-xs text-zinc-500 animate-pulse">Aplicando tipografia...</p>
                )}

                {!isWorking && (
                  <div className="flex flex-wrap gap-2 w-full">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="flex-1 min-w-[110px] py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
                      style={{ background: "linear-gradient(135deg, #f97316, #a855f7)" }}
                    >
                      ↓ Exportar
                    </button>
                    <button
                      onClick={() => navigate(`/app/refine/${currentGeneration.generationId}`)}
                      className="flex-1 min-w-[110px] py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:border-zinc-500 hover:text-white transition-colors"
                    >
                      ↗ Expandir
                    </button>
                    <button
                      onClick={handleRegenerateFromResult}
                      className="flex-1 min-w-[110px] py-2.5 rounded-xl border border-zinc-800 text-zinc-500 text-sm hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      ↺ Regerar
                    </button>
                  </div>
                )}
              </div>

              {/* Mini chat */}
              {!isWorking && (
                <div className="flex flex-col lg:w-[45%] gap-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                      ✦
                    </div>
                    <p className="text-sm font-semibold text-white">Creatyng AI</p>
                    <span className="text-xs text-green-500 ml-auto">● Online</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Peça ajustes em linguagem natural. 1 crédito por mensagem.
                  </p>
                  <RefinementChat
                    overrides={refinementOverrides}
                    onOverridesChange={(newOverrides) => {
                      setRefinementOverrides(newOverrides);
                      recomposeWithOverrides(newOverrides);
                    }}
                    onRegenerate={handleRegenerateFromResult}
                    composition={htmlCompositionRef.current}
                    onCompositionChange={async (updated) => {
                      htmlCompositionRef.current = updated;
                      setComposing(true);
                      try {
                        const result = await exportCompositionToPNG(updated);
                        setComposedBase64(result);
                        setComposedImage(result);
                      } finally {
                        setComposing(false);
                      }
                    }}
                  />
                  <p className="text-xs text-zinc-700 text-center mt-1">
                    Edições avançadas com histórico →{" "}
                    <button
                      onClick={() => navigate(`/app/refine/${currentGeneration.generationId}`)}
                      className="text-orange-500 hover:text-orange-400 underline underline-offset-2"
                    >
                      Expandir chat
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer navigation (steps 1-3) */}
      {uiStep <= 3 && (
        <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur sticky bottom-0">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
            <button
              onClick={handleBack}
              disabled={uiStep === 1}
              className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-medium disabled:opacity-30 hover:border-zinc-500 hover:text-white transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={!canAdvance}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canAdvance ? "linear-gradient(135deg, #f97316, #a855f7)" : "#27272a",
                color: canAdvance ? "#fff" : "#52525b",
                boxShadow: canAdvance ? "0 0 20px rgba(249,115,22,0.25)" : "none",
              }}
            >
              {uiStep === 3 ? "✦ Gerar criativo — 5 créditos" : "Continuar →"}
            </button>
          </div>
        </footer>
      )}

      {/* Error toast (not on step 4 which has its own error UI) */}
      {error && uiStep !== 4 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-red-950/95 text-red-200 text-sm px-5 py-3 rounded-xl border border-red-800 max-w-sm text-center shadow-xl">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-200 font-bold">×</button>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && displayBase64 && (
        <ExportModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          imageBase64={displayBase64}
          texts={{
            headline: headline ?? "",
            subheadline: subheadline ?? undefined,
            cta: cta ?? undefined,
          }}
          presetConfig={textConfigRef.current ?? ({} as TextPresetConfig)}
          colors={colorsRef.current}
          composition={compositionRef.current}
          foodPopOverlay={isFoodPopRef.current}
          foodPopData={isFoodPopRef.current ? {
            price: price ?? undefined,
            whatsapp: whatsapp ?? undefined,
            instagram: instagram ?? undefined,
            accentColor: paletteRef.current?.accent,
          } : undefined}
        />
      )}
    </div>
  );
}
