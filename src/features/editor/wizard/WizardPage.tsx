// src/features/editor/wizard/WizardPage.tsx
// CREATYNG — Fase 4 — Wizard redesenhado com 5 steps visuais.
// REGRA: handleGenerate e recomposeWithOverrides são idênticos à versão anterior.
// Apenas o shell visual e navegação foram redesenhados.

import React, { useState, useRef, useEffect } from "react";
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
import { WizardStep2Reference } from "./WizardStep2Reference";
import { WizardStep2Style } from "./WizardStep2Style";
import { WizardStep3Text } from "./WizardStep3Text";
import { analyzeReference } from "@/services/referenceAnalyzer";
import { ExportModal } from "./ExportModal";
import { ConfettiEffect } from "@/components/creatyng/ConfettiEffect";
import { useCreditStore } from "@/stores/useCreditStore";
import { calculateCost } from "@/lib/creditCosts";
import { useAuth } from "@/features/auth/AuthProvider";
import { incrementGenCount, PaywallModal } from "@/components/creatyng/CreditUpsell";
import { useI18n } from "@/i18n";

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

const STEP_LABELS = ["Upload", "Referência", "Estilo", "Textos", "Gerando", "Resultado"];

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const isDone = current > step;
        const isActive = current === step;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            {idx > 0 && (
              <div style={{
                height: 1, width: 32,
                background: isDone || isActive ? '#ff713d' : 'hsl(var(--border))',
                transition: 'background 500ms',
              }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 10, fontWeight: 700,
                transition: 'all 300ms',
                background: isDone ? '#ff713d' : isActive ? '#ff713d' : 'hsl(var(--muted))',
                border: `1.5px solid ${isDone || isActive ? '#ff713d' : 'hsl(var(--border))'}`,
                color: isDone || isActive ? '#fff' : 'hsl(var(--muted-foreground))',
              }}>
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 500,
                color: isActive ? '#ff713d' : isDone ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
              }}>
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Credit tooltip ────────────────────────────────────────────────────────────

function WizCredTooltip({ credits, children }: { credits: number; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          padding: '6px 12px', borderRadius: 8, background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))',
          fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, pointerEvents: 'none',
          border: '1px solid hsl(var(--border))',
        }}>
          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid hsl(var(--popover))' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff713d', flexShrink: 0 }}>
              <path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" />
            </svg>
            {credits} créditos restantes
          </span>
        </div>
      )}
    </div>
  );
}

// ── WizardPage ────────────────────────────────────────────────────────────────

export function WizardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { emailVerified } = useAuth();
  const { t } = useI18n();
  const storeCredits = useCreditStore((s) => s.credits);

  const [uiStep, setUiStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [stageIndex, setStageIndex] = useState(0);
  const [generationDone, setGenerationDone] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const confettiTriggered = useRef(false);

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
    referenceBase64,
    referenceAnalysis,
    setReferenceAnalysis,
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

  // Stage animation when entering step 5 (generating)
  useEffect(() => {
    if (uiStep !== 5) return;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setStageIndex(0);
    setGenerationDone(false);
    setGenerationError(null);
    const t1 = setTimeout(() => setStageIndex(1), 1500);
    const t2 = setTimeout(() => setStageIndex(2), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [uiStep]);

  // Auto-advance to step 6 when generation completes
  useEffect(() => {
    if (!generationDone || uiStep !== 5) return;
    setStageIndex(3);
    const t1 = setTimeout(() => setStageIndex(4), 600);
    const t2 = setTimeout(() => setStageIndex(5), 1200);
    const t3 = setTimeout(() => {
      setUiStep(6);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      // Confetti on first-ever generation
      if (!confettiTriggered.current && !localStorage.getItem('creatyng:confetti_shown')) {
        confettiTriggered.current = true;
        localStorage.setItem('creatyng:confetti_shown', '1');
        setShowConfetti(true);
      }
    }, 1800);
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
      // ── Block unverified email users ───────────────────────────────────────
      if (!emailVerified) {
        setError(t('verify_email.block_generate'));
        setGenerating(false);
        return;
      }

      // ── Debit credits before generation ────────────────────────────────────
      const presetId = state.selectedImagePresetId || "simple-gen";
      const creditCost = calculateCost(presetId) || 5;
      console.log(`[Debit] Debitando ${creditCost} créditos para preset "${presetId}"...`);
      try {
        await useCreditStore.getState().debitCredits(creditCost, `Generation — ${presetId}`);
      } catch (debitErr: unknown) {
        const msg = debitErr instanceof Error ? debitErr.message : String(debitErr);
        if (msg === "insufficient_credits") {
          setShowPaywall(true);
          setGenerating(false);
          return;
        }
        console.warn("[Wizard] debit failed, proceeding anyway:", msg);
      }

      // ── Analyze reference (if present, before any pipeline) ─────────────────
      const hasRef = Boolean(state.referenceBase64 && !state.referenceBase64.startsWith("gallery:"));
      if (hasRef && !state.referenceAnalysis) {
        setPopDesignStep("Analisando referência visual...");
        try {
          const analysis = await analyzeReference(
            state.referenceBase64!,
            state.subjectBase64,
            { headline: state.headline, cta: state.cta },
          );
          setReferenceAnalysis(analysis);
        } catch (e) {
          console.warn("[Reference] Analysis failed, proceeding without:", e);
        }
      }

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
        incrementGenCount();
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
      incrementGenCount();
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
    uiStep === 2 ? true :                         // reference is optional
    uiStep === 3 ? Boolean(selectedImagePresetId) :
    uiStep === 4 ? Boolean(headline?.trim()) :
    false;

  function handleNext() {
    if (uiStep < 4 && canAdvance) {
      setUiStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5 | 6);
    } else if (uiStep === 4 && canAdvance) {
      setUiStep(5);
      handleGenerate();
    }
  }

  function handleBack() {
    if (uiStep >= 2 && uiStep <= 4) {
      setUiStep((s) => (s - 1) as 1 | 2 | 3 | 4);
    } else if (uiStep === 6) {
      clearGeneration();
      setComposedBase64(null);
      setGenerationDone(false);
      setUiStep(4);
    } else if (uiStep === 5 && generationError) {
      setGenerationError(null);
      setGenerating(false);
      setComposing(false);
      setUiStep(4);
    }
  }

  function handleRegenerateFromResult() {
    clearGeneration();
    setComposedBase64(null);
    setGenerationDone(false);
    setRefinementOverrides({});
    htmlCompositionRef.current = null;
    setUiStep(5);
    handleGenerate();
  }

  const displayBase64 = composedBase64 ?? currentGeneration?.imageBase64;
  const isWorking = generating || composing;

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: `${gridSvg}, hsl(var(--background))`, color: 'hsl(var(--foreground))', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif" }}>
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} count={80} duration={3500} />
      {showPaywall && <PaywallModal plan={useCreditStore.getState().plan} onClose={() => setShowPaywall(false)} />}
      <style>{`
        @keyframes wizSpin { to { transform: rotate(360deg); } }
        @keyframes wizPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes wizFdUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Header + StepIndicator */}
      <header style={{
        flexShrink: 0, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid hsl(var(--border))',
        background: 'hsl(var(--background) / 0.9)', backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Logo + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#ff713d,#FF9B70)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>C</span>
          </div>
          <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Creatyng</span>
          <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nova Criação</span>
        </div>
        {/* Step indicator centered */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <StepIndicator current={uiStep} />
        </div>
        {/* Credits badge with tooltip */}
        <WizCredTooltip credits={storeCredits}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12, fontWeight: 600, color: '#ff713d', cursor: 'default' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff713d', flexShrink: 0 }}>
              <path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" />
            </svg>
            <span>{storeCredits}</span> <span style={{ fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>créditos</span>
          </div>
        </WizCredTooltip>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>

          {/* Step 1: Upload */}
          {uiStep === 1 && (
            <div style={{ animation: 'wizFdUp 350ms ease both' }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>Envie sua imagem</h1>
                <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>Foto do produto, pessoa ou marca. O motor analisa e sugere o melhor estilo.</p>
              </div>
              <WizardStep1Subject />
            </div>
          )}

          {/* Step 2: Reference */}
          {uiStep === 2 && (
            <div style={{ animation: 'wizFdUp 350ms ease both' }}>
              <WizardStep2Reference />
            </div>
          )}

          {/* Step 3: Preset */}
          {uiStep === 3 && (
            <div style={{ animation: 'wizFdUp 350ms ease both' }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>Escolha o estilo</h1>
                <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>O preset define a atmosfera, iluminação e composição do criativo.</p>
              </div>
              <WizardStep2Style />
            </div>
          )}

          {/* Step 4: Texts */}
          {uiStep === 4 && (
            <div style={{ animation: 'wizFdUp 350ms ease both' }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>Adicione os textos</h1>
                <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>Headline, preço, CTA e contato. A tipografia é renderizada em alta qualidade.</p>
              </div>
              <WizardStep3Text />
            </div>
          )}

          {/* Step 5: Generating */}
          {uiStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 32, padding: '48px 0', animation: 'wizFdUp 350ms ease both' }}>
              {generationError ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', maxWidth: 320 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✕</div>
                  <div>
                    <p style={{ color: '#EF4444', fontWeight: 600, fontSize: 16 }}>Erro na geração</p>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, marginTop: 4 }}>{generationError}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { setGenerationError(null); setUiStep(4); }} style={{ padding: '8px 18px', borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Voltar</button>
                    <button onClick={() => { setGenerationError(null); setGenerationDone(false); setUiStep(5); handleGenerate(); }} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: '#ff713d', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Tentar novamente</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Animated orb */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', filter: 'blur(32px)', opacity: 0.25, background: 'conic-gradient(from 0deg, #ff713d, #a855f7, #3b82f6, #ff713d)', animation: 'wizPulse 2s ease-in-out infinite' }} />
                    <div style={{ position: 'relative', width: 120, height: 120, borderRadius: '50%', background: 'conic-gradient(from 0deg, #ff713d, #FF9B70, #ff713d)', animation: 'wizSpin 3s linear infinite' }} />
                    <div style={{ position: 'absolute', width: 90, height: 90, borderRadius: '50%', background: 'hsl(var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✦</div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Criando seu criativo...</h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, marginTop: 4 }}>Isso leva alguns segundos</p>
                  </div>

                  {/* Stage checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
                    {GENERATION_STAGES.map((stage, idx) => {
                      const isDone = stageIndex > idx;
                      const isActive = stageIndex === idx;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 300ms',
                            background: isDone ? '#10B981' : isActive ? '#ff713d' : 'hsl(var(--muted))',
                            border: `1.5px solid ${isDone ? '#10B981' : isActive ? '#ff713d' : 'hsl(var(--border))'}`,
                          }}>
                            {isDone ? (
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : isActive ? (
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff713d', animation: 'wizPulse 1s ease-in-out infinite' }} />
                            ) : null}
                          </div>
                          <span style={{ fontSize: 13, transition: 'color 300ms', color: isDone ? '#10B981' : isActive ? '#ff713d' : 'hsl(var(--muted-foreground))' }}>{stage}</span>
                        </div>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))' }}>−5 créditos desta geração</p>
                </>
              )}
            </div>
          )}

          {/* Step 6: Result */}
          {uiStep === 6 && currentGeneration && (
            <div style={{ display: 'flex', gap: 24, animation: 'wizFdUp 350ms ease both', flexWrap: 'wrap' }}>
              {/* Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <p style={{ fontSize: 10.5, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                    {composing ? "Compondo criativo..." : "Criativo gerado!"}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                    <span>via {currentGeneration.meta.provider}</span>
                    <span>·</span>
                    <span>{Math.round(currentGeneration.meta.generationMs / 1000)}s</span>
                  </div>
                </div>

                {displayBase64 && (
                  <div style={{
                    width: '100%', borderRadius: 12, overflow: 'hidden',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 8px 32px rgba(20,20,23,0.1)',
                    background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--card)) 0% 50%) 0 0 / 16px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img
                      src={displayBase64}
                      alt="Criativo gerado"
                      style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                )}

                {composing && popDesignStep && (
                  <p style={{ fontSize: 11.5, color: '#ff713d', animation: 'wizPulse 1s ease-in-out infinite', fontWeight: 500 }}>{popDesignStep}</p>
                )}
                {composing && !popDesignStep && (
                  <p style={{ fontSize: 11.5, color: '#8e8e96', animation: 'wizPulse 1s ease-in-out infinite' }}>Aplicando tipografia...</p>
                )}

                {!isWorking && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                    <button
                      onClick={() => setShowExportModal(true)}
                      style={{ flex: '1 1 100px', padding: '10px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#ff713d,#FF9B70)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      ↓ Exportar
                    </button>
                    <button
                      onClick={() => navigate(`/app/refine/${currentGeneration.generationId}`)}
                      style={{ flex: '1 1 100px', padding: '10px 0', borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      ↗ Expandir
                    </button>
                    <button
                      onClick={handleRegenerateFromResult}
                      style={{ flex: '1 1 100px', padding: '10px 0', borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      ↺ Regerar
                    </button>
                  </div>
                )}
              </div>

              {/* Mini chat */}
              {!isWorking && (
                <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 260px', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#ff713d,#FF9B70)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>✦</div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Creatyng AI</p>
                    <span style={{ fontSize: 11, color: '#10B981', marginLeft: 'auto' }}>● Online</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))' }}>Peça ajustes em linguagem natural. 1 crédito por mensagem.</p>
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
                  <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginTop: 4 }}>
                    Edições avançadas com histórico →{" "}
                    <button
                      onClick={() => navigate(`/app/refine/${currentGeneration.generationId}`)}
                      style={{ color: '#ff713d', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, textDecoration: 'underline' }}
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

      {/* Footer navigation (steps 1-4) */}
      {uiStep <= 4 && (
        <footer style={{
          flexShrink: 0, borderTop: '1px solid hsl(var(--border))',
          background: 'hsl(var(--background) / 0.9)', backdropFilter: 'blur(8px)',
          position: 'sticky', bottom: 0,
        }}>
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <button
              onClick={handleBack}
              disabled={uiStep === 1}
              style={{
                padding: '9px 20px', borderRadius: 10, border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500,
                cursor: uiStep === 1 ? 'default' : 'pointer', opacity: uiStep === 1 ? 0.3 : 1,
                fontFamily: 'inherit', transition: 'all 150ms',
              }}
            >
              ← Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={!canAdvance}
              style={{
                padding: '9px 24px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600,
                cursor: canAdvance ? 'pointer' : 'default',
                background: canAdvance ? 'linear-gradient(135deg,#ff713d,#FF9B70)' : 'hsl(var(--muted))',
                color: canAdvance ? '#fff' : 'hsl(var(--muted-foreground))',
                boxShadow: canAdvance ? '0 4px 16px rgba(255,113,61,0.3)' : 'none',
                opacity: canAdvance ? 1 : 0.6, fontFamily: 'inherit', transition: 'all 200ms',
              }}
            >
              {uiStep === 4 ? "✦ Gerar criativo — 5 créditos" : "Continuar →"}
            </button>
          </div>
        </footer>
      )}

      {/* Error toast (not on step 5 which has its own error UI) */}
      {error && uiStep !== 5 && (
        <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 50, background: '#FEF2F2', color: '#EF4444', fontSize: 13, padding: '12px 20px', borderRadius: 10, border: '1px solid #FECACA', maxWidth: 360, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 10, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>×</button>
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
