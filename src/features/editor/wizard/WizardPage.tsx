// src/features/editor/wizard/WizardPage.tsx
// CREATYNG — Fase 4 — Wizard redesenhado com 5 steps visuais.
// REGRA: handleGenerate e recomposeWithOverrides são idênticos à versão anterior.
// Apenas o shell visual e navegação foram redesenhados.

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getFeatureFlags } from "@/config/featureFlags";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { FileText, Palette, RectangleHorizontal, SlidersHorizontal, Trash2, Pencil, Plus, ImageIcon, Upload, User, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import { useToast } from "@/features/toast/useToast";
import { useWizardStore } from "@/stores/useWizardStore";
import { GenerateError } from "@/services/generateService";
import { FORMAT_BY_ID, type FoodPalette } from "../engine/exportComposed";
import { RefinementChat } from "./RefinementChat";
import { type RefinementOverrides } from "../engine/chatApply";
import type { CreatygnComposition } from "@/types/composition";
import { getPresetById } from "@/lib/presetUtils";
import type { TextPresetConfig, ColorConfig, CompositionConfig } from "@/types/preset";
import { WizardStep1Subject } from "./WizardStep1Subject";
import { WizardStep2Reference } from "./WizardStep2Reference";
import { WizardStep2Style } from "./WizardStep2Style";
import { WizardStep3Text } from "./WizardStep3Text";
import { ExportModal } from "./ExportModal";
import { ConfettiEffect } from "@/components/creatyng/ConfettiEffect";
import { useCreditStore } from "@/stores/useCreditStore";
import { calculateCost } from "@/lib/creditCosts";
import { useAuth } from "@/features/auth/AuthProvider";
import { incrementGenCount, PaywallModal } from "@/components/creatyng/CreditUpsell";
import { useI18n } from "@/i18n";
import { supabase } from "@/services/supabaseClient";

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

const STEP_LABELS = ["Upload", "Conteúdo", "Configurar", "Resultado"];

// ── Generation stages ─────────────────────────────────────────────────────────

const GENERATION_STAGES = [
  "Preparando composição...",
  "Aplicando seus textos e cores...",
  "Gerando criativo com IA...",
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

function StepIndicator({ current, maxReached, onStepClick }: { current: number; maxReached: number; onStepClick?: (step: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const isDone = current > step;
        const isActive = current === step;
        const canClick = step <= maxReached && step !== current;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            {idx > 0 && (
              <div style={{
                height: 1, width: 32,
                background: isDone || isActive ? '#ff713d' : 'hsl(var(--border))',
                transition: 'background 500ms',
              }} />
            )}
            <button
              onClick={() => canClick && onStepClick?.(step)}
              disabled={!canClick}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', padding: 0, fontFamily: 'inherit',
                cursor: canClick ? 'pointer' : 'default',
                opacity: step > maxReached ? 0.4 : 1,
                transition: 'opacity 150ms',
              }}
            >
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
            </button>
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
  const location = useLocation();
  const toast = useToast();
  const flags = getFeatureFlags('clone-criativo');
  const { emailVerified } = useAuth();
  const { t } = useI18n();
  const storeCredits = useCreditStore((s) => s.credits);
  const fetchCredits = useCreditStore((s) => s.fetchCredits);

  // Fetch credits on mount (Topbar is hidden for /app/create, so we load here)
  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  // Handle "Novo Criativo" from sidebar — location.state.fresh triggers reset confirmation
  useEffect(() => {
    const state = location.state as { fresh?: boolean; ts?: number } | null;
    if (state?.fresh) {
      // Clear navigation state to prevent re-triggering
      window.history.replaceState({}, '');
      if (referenceBase64 || currentGeneration || editedTexts.length > 0) {
        setShowResetConfirm(true);
      } else {
        resetAll();
      }
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smart initial step: resume where user left off based on store state
  const initialStep = (() => {
    const s = useWizardStore.getState();
    if (s.currentGeneration) return 4 as const;
    if (s.referenceBase64) return 2 as const;
    return 1 as const;
  })();
  const [uiStep, setUiStep] = useState<1 | 2 | 3 | 4>(initialStep);
  const [maxStepReachedInit] = useState(() => initialStep >= 4 ? 4 : initialStep >= 2 ? 2 : 1);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  // These 7 fields are in Zustand store (persist across navigation to /app/refine and back)
  const v2Analysis = useWizardStore((s) => s.v2Analysis);
  const setV2Analysis = useWizardStore((s) => s.setV2Analysis);
  const analysisTexts = useWizardStore((s) => s.analysisTexts);
  const setAnalysisTexts = useWizardStore((s) => s.setAnalysisTexts);
  const editedTexts = useWizardStore((s) => s.editedTexts);
  const setEditedTexts = useWizardStore((s) => s.setEditedTexts);
  const colorPalette = useWizardStore((s) => s.colorPalette);
  const setColorPalette = useWizardStore((s) => s.setColorPalette);
  const variationSlider = useWizardStore((s) => s.variationSlider);
  const setVariationSlider = useWizardStore((s) => s.setVariationSlider);
  const formatSelect = useWizardStore((s) => s.formatSelect);
  const setFormatSelect = useWizardStore((s) => s.setFormatSelect);
  const extraInstructions = useWizardStore((s) => s.extraInstructions);
  const setExtraInstructions = useWizardStore((s) => s.setExtraInstructions);
  const [stageIndex, setStageIndex] = useState(0);
  const [generationDone, setGenerationDone] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const confettiTriggered = useRef(false);

  // existing generation state (idênticos ao original)
  const [generating, setGenerating] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composedBase64, setComposedBase64] = useState<string | null>(
    // Recover from store on remount so Step 4 image doesn't go blank
    useWizardStore.getState().composedImageBase64 ?? useWizardStore.getState().currentGeneration?.imageBase64 ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [popDesignStep, setPopDesignStep] = useState<string>("");
  const [refinementOverrides, setRefinementOverrides] = useState<RefinementOverrides>({});
  const [resetKey, setResetKey] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(maxStepReachedInit);
  const [activeSessionIdx, setActiveSessionIdx] = useState(-1);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const zoomDragging = useRef(false);
  const zoomDragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

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
    sessionGenerations,
    addSessionGeneration,
    clearSessionGenerations,
    logoBase64,
    setLogoBase64,
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

  // Progressive stage animation — advances gradually, jumps to "Finalizando" when result arrives
  const genStartRef = useRef<number>(0);
  useEffect(() => {
    if (!generating) return;
    genStartRef.current = Date.now();
    setStageIndex(0);
    setGenerationDone(false);
    setGenerationError(null);
    // Progressive: 0→1 at 3s, 1→2 at 7s (stays on "Gerando" until done)
    const t1 = setTimeout(() => setStageIndex(1), 3000);
    const t2 = setTimeout(() => setStageIndex(2), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [generating]);

  // When generation completes → jump to "Finalizando" then show result
  useEffect(() => {
    if (!generationDone) return;
    setStageIndex(3); // "Finalizando seu criativo!"
    const t1 = setTimeout(() => {
      goToStep(4);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      if (!confettiTriggered.current && !localStorage.getItem('creatyng:confetti_shown')) {
        confettiTriggered.current = true;
        localStorage.setItem('creatyng:confetti_shown', '1');
        setShowConfetti(true);
      }
    }, 1500);
    return () => { clearTimeout(t1); };
  }, [generationDone]);

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

  // handleGenerate — V2 engine (Gemini analyze + Nano Banana Pro generate)
  async function handleGenerate() {
    const state = useWizardStore.getState();
    setError(null);
    setGenerationError(null);

    // ── Check credits BEFORE clearing any state ─────────────────────────────
    if (!emailVerified) {
      setError(t('verify_email.block_generate'));
      return;
    }

    const creditCost = calculateCost("clone-criativo") || 10;
    console.log(`[Debit] Debitando ${creditCost} créditos para clone-criativo...`);
    try {
      await useCreditStore.getState().debitCredits(creditCost, `Clone Criativo`);
    } catch (debitErr: unknown) {
      const msg = debitErr instanceof Error ? debitErr.message : String(debitErr);
      if (msg === "insufficient_credits") {
        setShowPaywall(true);
        return; // Don't touch generating, composedBase64, or currentGeneration
      }
      console.warn("[Wizard] debit failed, proceeding anyway:", msg);
    }

    // ── Only NOW clear state and start generating ───────────────────────────
    setGenerating(true);
    setComposedBase64(null);
    clearGeneration();
    setRefinementOverrides({});
    popBgRef.current           = "";
    popSubjectRef.current      = "";
    standardImgRef.current     = "";
    htmlCompositionRef.current = null;

    try {

      // ── Use analysis from Step 1 (already stored in v2Analysis state) ──────
      const currentAnalysis = v2Analysis;

      // ── Build text_replacements from edited texts vs original analysis ─────
      const textReplacements: Array<{ original: string; replacement: string }> = [];
      for (let i = 0; i < editedTexts.length; i++) {
        const edited = editedTexts[i];
        const original = analysisTexts[i];
        if (edited.content) {
          textReplacements.push({
            original: original?.content || edited.content,
            replacement: edited.content,
          });
        }
      }

      // ── Generate with Nano Banana Pro ──────────────────────────────────────
      setPopDesignStep("Gerando criativo com IA...");

      const generateBody: Record<string, unknown> = {
        reference_image: state.referenceBase64 || state.subjectBase64,
        variation: variationSlider,
        format: formatSelect,
        model: "nano-banana",
      };

      if (state.subjectBase64 && state.referenceBase64) {
        generateBody.subject_image = state.subjectBase64;
      }
      if (textReplacements.length > 0) {
        generateBody.text_replacements = textReplacements;
      }
      // Send active_texts — only texts the user kept (removed texts excluded)
      generateBody.active_texts = editedTexts.filter(t => t.content && t.content.trim());
      // Send removed_texts — texts from analysis that user deleted, so AI knows to exclude them
      const activeContents = new Set(editedTexts.map(t => t.content));
      const removedTexts = analysisTexts.filter(t => !activeContents.has(t.content)).map(t => t.content);
      if (removedTexts.length > 0) generateBody.removed_texts = removedTexts;
      if (colorPalette.length > 0) {
        generateBody.color_palette = colorPalette;
      }
      if (currentAnalysis) {
        generateBody.analysis = currentAnalysis;
      }
      if (extraInstructions) {
        generateBody.extra_instructions = extraInstructions;
      }
      if (state.logoBase64) {
        generateBody.logo_base64 = state.logoBase64;
      }

      console.log("[WizardPage] ===== GENERATING =====");
      console.log("[WizardPage] editedTexts:", JSON.stringify(editedTexts));
      console.log("[WizardPage] analysisTexts:", JSON.stringify(analysisTexts));
      console.log("[WizardPage] active_texts sent:", JSON.stringify(generateBody.active_texts));
      console.log("[WizardPage] removed_texts sent:", JSON.stringify(generateBody.removed_texts));
      console.log("[WizardPage] body keys:", Object.keys(generateBody));

      const { data: genData, error: genErr } = await supabase.functions.invoke('generate-creative', {
        body: generateBody,
      });

      if (genErr) {
        const errBody = typeof genErr === 'object' && 'context' in genErr
          ? await (genErr as { context: Response }).context.json().catch(() => null)
          : null;
        throw new GenerateError(
          errBody?.error || "generation_failed",
          errBody?.details || genData?.details || "Falha na geração do criativo.",
        );
      }

      const imageUrl = genData?.image;
      if (!imageUrl) {
        throw new GenerateError("no_image", "Nenhuma imagem retornada pelo servidor.");
      }

      // Convert URL to base64 for display
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        const imgResp = await fetch(imageUrl);
        const blob = await imgResp.blob();
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      setComposedBase64(imageBase64);

      const genId = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `clone-${Date.now().toString(36)}`;
      setGeneration({
        generationId: genId,
        imageBase64,
        imageThumbnail: imageBase64,
        wizardStateSnapshot: { ...state } as never,
        presetIds: { image: "clone-criativo", text: "" },
        activePresetConfigSnapshot: {},
        meta: {
          provider: genData?.model || "nano-banana-pro",
          model: genData?.model || "google/nano-banana-pro",
          dnaUsed: Boolean(v2Analysis),
          aspectRatio: genData?.format || "1:1",
          generationMs: genData?.duration_ms || 0,
        },
        timestamp: Date.now(),
      });

      setPopDesignStep("");
      setGenerating(false);
      setGenerationDone(true);
      // Add to session gallery (persisted in Zustand store)
      addSessionGeneration(imageBase64);
      setActiveSessionIdx(-1); // -1 = latest
      incrementGenCount();
      return;
      // V1 pipeline removed — all generation now handled by V2 above

      // eslint-disable-next-line no-constant-condition
      if (false) {
        // Dead code guard — prevents unreachable code errors for V1 imports still in scope
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

  // Navigation — 4 steps: Upload(1) → Content(2) → Configure(3) → Result(4)
  const canAdvance =
    uiStep === 1 ? Boolean(referenceBase64 && !referenceBase64.startsWith('gallery:')) :
    uiStep === 2 ? true :
    false;

  // Track which reference was last analyzed to skip re-analysis
  const lastAnalyzedRef = useRef<string | null>(null);

  async function handleAnalyzeAndAdvance() {
    if (!referenceBase64 || referenceBase64.startsWith('gallery:')) return;

    // Skip re-analysis if same reference and we already have analysis
    const refHash = referenceBase64.substring(0, 200);
    if (v2Analysis && lastAnalyzedRef.current === refHash && editedTexts.length > 0) {
      console.log('[Wizard] Skipping re-analysis — same reference, analysis cached');
      goToStep(2);
      return;
    }

    setAnalysisLoading(true);
    try {
      const { data, error: err } = await supabase.functions.invoke('analyze-creative', {
        body: { image: referenceBase64 },
      });
      if (!err && data?.analysis) {
        const analysis = data.analysis as Record<string, unknown>;
        setV2Analysis(analysis);
        const texts = (analysis.texts as Array<{ type: string; content: string }>) || [];
        // Deep copy: analysisTexts is the ORIGINAL snapshot, editedTexts is the user's working copy
        setAnalysisTexts(texts.map(t => ({ type: t.type, content: t.content })));
        setEditedTexts(texts.map(t => ({ type: t.type, content: t.content })));
        const rawColors = (analysis.colors as Array<string | {hex: string}>) || [];
        const colors = rawColors.map(c => typeof c === 'string' ? c : c.hex);
        if (colors.length >= 5) setColorPalette(colors.slice(0, 5));
        else if (colors.length > 0) setColorPalette([...colors, ...colorPalette.slice(colors.length)]);
        lastAnalyzedRef.current = refHash;
      }
    } catch (e) {
      console.warn('[Wizard] Analysis failed:', e);
    } finally {
      setAnalysisLoading(false);
    }
    goToStep(2);
  }

  function goToStep(step: 1 | 2 | 3 | 4) {
    setUiStep(step);
    setMaxStepReached(prev => Math.max(prev, step));
  }

  function handleNext() {
    if (uiStep === 1 && canAdvance) {
      handleAnalyzeAndAdvance();
    } else if (uiStep === 2) {
      goToStep(3);
    }
    // Step 3 → generate is handled by the button in the step itself
  }

  function handleBack() {
    if (uiStep === 2) setUiStep(1);
    else if (uiStep === 3 && !generating) setUiStep(2);
    else if (uiStep === 4) {
      // Preserve generated image — user can return to Step 4 via "Próximo"
      setGenerationDone(false);
      setUiStep(3);
    }
  }

  // Full reset — "Novo Criativo": clears everything
  function resetAll() {
    clearGeneration();
    setComposedBase64(null);
    setGenerationDone(false);
    setRefinementOverrides({});
    setV2Analysis(null);
    setAnalysisTexts([]);
    setEditedTexts([]);
    setColorPalette(['#ff713d', '#1a1a2e', '#ffffff', '#333333', '#666666']);
    setVariationSlider(10);
    setFormatSelect('1:1');
    setExtraInstructions('');
    setGenerationError(null);
    setError(null);
    htmlCompositionRef.current = null;
    useWizardStore.getState().clearReference();
    useWizardStore.getState().setSubject('', '');
    setLogoBase64(null);
    setResetKey(k => k + 1);
    setMaxStepReached(1);
    clearSessionGenerations();
    setActiveSessionIdx(-1);
    setUiStep(1);
  }

  // Partial reset — "Nova referência": keeps subject + format
  function resetForNewReference() {
    clearGeneration();
    setComposedBase64(null);
    setGenerationDone(false);
    setRefinementOverrides({});
    setV2Analysis(null);
    setAnalysisTexts([]);
    setEditedTexts([]);
    setColorPalette(['#ff713d', '#1a1a2e', '#ffffff', '#333333', '#666666']);
    setExtraInstructions('');
    setGenerationError(null);
    setError(null);
    htmlCompositionRef.current = null;
    useWizardStore.getState().clearReference();
    setResetKey(k => k + 1);
    setMaxStepReached(1);
    clearSessionGenerations();
    setActiveSessionIdx(-1);
    setUiStep(1);
  }

  async function handleRegenerateFromResult() {
    setComposedBase64(null);
    setGenerationDone(false);
    setRefinementOverrides({});
    htmlCompositionRef.current = null;
    // Go to step 3 first so the generating animation shows
    setUiStep(3);
    // handleGenerate calls clearGeneration() internally, sets generating=true,
    // and when done sets generationDone=true which triggers goToStep(4)
    await handleGenerate();
  }

  const displayBase64 = composedBase64 ?? currentGeneration?.imageBase64;
  const isWorking = generating || composing;

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.08)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: `${gridSvg}, hsl(var(--background))`, color: 'hsl(var(--foreground))', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", overflow: 'hidden' }}>
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
        background: 'hsl(var(--background))', zIndex: 10,
      }}>
        {/* Logo + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#ff713d,#FF9B70)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 11 }}>C</span>
          </div>
          <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Creatyng</span>
          <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>/</span>
          <button onClick={() => { if (uiStep >= 2 || referenceBase64 || currentGeneration) setShowResetConfirm(true); else resetAll(); }} style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Nova Criação</button>
        </div>
        {/* Step indicator centered */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <StepIndicator current={uiStep} maxReached={maxStepReached} onStepClick={(s) => setUiStep(s as 1 | 2 | 3 | 4)} />
        </div>
        {/* Credits badge + upgrade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <WizCredTooltip credits={storeCredits}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
              background: 'hsl(var(--card))', fontSize: 12, fontWeight: 600, cursor: 'default',
              border: `1px solid ${storeCredits < 12 ? '#EF4444' : 'hsl(var(--border))'}`,
              color: storeCredits < 12 ? '#EF4444' : '#ff713d',
            }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" />
              </svg>
              <span>{storeCredits}</span>
            </div>
          </WizCredTooltip>
          <button
            onClick={() => navigate('/app/billing')}
            style={{
              padding: '4px 10px', borderRadius: 8, border: '1px solid hsl(var(--border))',
              background: 'transparent', color: 'hsl(var(--muted-foreground))',
              fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Upgrade
          </button>
        </div>
      </header>

      {/* Credit banner — persistent, non-disruptive */}
      {storeCredits < 12 && storeCredits > 0 && (
        <div style={{ flexShrink: 0, background: '#FFF7ED', borderBottom: '1px solid #FED7AA', padding: '6px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: '#D97706' }} />
            <span style={{ color: '#92400E' }}>Apenas <strong>{storeCredits}</strong> crédito(s) restante(s).</span>
          </div>
          <button onClick={() => navigate('/app/billing')} style={{ background: '#ff713d', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Upgrade</button>
        </div>
      )}
      {storeCredits <= 0 && (
        <div style={{ flexShrink: 0, background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '6px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} style={{ color: '#DC2626' }} />
            <span style={{ color: '#991B1B' }}>Créditos esgotados. Recarregue para gerar.</span>
          </div>
          <button onClick={() => navigate('/app/billing')} style={{ background: '#DC2626', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Upgrade agora</button>
        </div>
      )}

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: uiStep === 4 ? 1100 : (uiStep === 1 ? 960 : 720), margin: '0 auto', padding: '32px 24px', transition: 'max-width 300ms' }}>

          {/* Step 1: Upload (Reference + Subject) */}
          {uiStep === 1 && (
            <div key={`step1-${resetKey}`} style={{ animation: 'wizFdUp 350ms ease both' }}>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 6 }}>Suba suas imagens</h1>
                <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))' }}>Arte de referência + foto do produto ou pessoa (opcional).</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {/* --- Standardized upload cards --- */}
                {([
                  {
                    title: 'Arte de Referência', badge: 'Obrigatório', badgeOrange: true,
                    desc: 'Print do post, anúncio ou arte que quer clonar',
                    tooltip: 'O post, anúncio ou arte que você quer clonar. Pode ser um print de qualquer rede social.',
                    icon: <Upload size={28} strokeWidth={1.5} />, placeholder: 'Clique ou arraste',
                    image: referenceBase64 && !referenceBase64.startsWith('gallery:') ? referenceBase64 : null,
                    onClear: () => useWizardStore.getState().clearReference(),
                    accept: 'image/*',
                    onFile: (b64: string) => useWizardStore.getState().setReference(b64, 'upload'),
                  },
                  {
                    title: 'Subject', badge: 'Opcional', badgeOrange: false,
                    desc: 'Foto do produto ou pessoa pra substituir',
                    tooltip: 'Foto do seu produto ou pessoa pra substituir o que aparece na referência. Se não enviar, a IA mantém o original.',
                    icon: <User size={28} strokeWidth={1.5} />, placeholder: 'Clique ou arraste',
                    image: subjectBase64 || null,
                    onClear: () => useWizardStore.getState().setSubject('', ''),
                    accept: 'image/*',
                    onFile: (b64: string) => useWizardStore.getState().setSubject(b64, ''),
                  },
                  {
                    title: 'Logo', badge: 'Opcional', badgeOrange: false,
                    desc: 'PNG com fundo transparente',
                    tooltip: 'Sua logo será inserida no criativo, substituindo qualquer placeholder de logo na referência.',
                    icon: <ImageIcon size={28} strokeWidth={1.5} />, placeholder: 'Upload logo',
                    image: logoBase64,
                    onClear: () => setLogoBase64(null),
                    accept: 'image/png,image/svg+xml,image/webp',
                    onFile: (b64: string) => setLogoBase64(b64),
                    maxSize: 2 * 1024 * 1024,
                  },
                ] as const).map((card, ci) => (
                  <div key={ci} style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: 20, minHeight: 260, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{card.title}</span>
                      <InfoTooltip text={card.tooltip} />
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500, background: card.badgeOrange ? '#FFF0E6' : 'hsl(var(--muted))', color: card.badgeOrange ? '#ff713d' : 'hsl(var(--muted-foreground))' }}>{card.badge}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 12, lineHeight: 1.4 }}>{card.desc}</p>
                    {card.image ? (
                      <div style={{ flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--muted) / 0.3)' }}>
                        <img src={card.image} alt={card.title} style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }} />
                        <button onClick={card.onClear} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ) : (
                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed hsl(var(--border))', borderRadius: 8, cursor: 'pointer', minHeight: 140, transition: 'border-color 150ms' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#ff713d'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; }}
                      >
                        <input type="file" accept={card.accept} style={{ display: 'none' }} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if ('maxSize' in card && card.maxSize && file.size > card.maxSize) return;
                          const reader = new FileReader();
                          reader.onload = () => card.onFile(reader.result as string);
                          reader.readAsDataURL(file);
                        }} />
                        <div style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>{card.icon}</div>
                        <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{card.placeholder}</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
              {analysisLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, color: '#ff713d', fontSize: 13 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #ff713d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'wizSpin 0.8s linear infinite' }} />
                  Analisando referência com Gemini...
                </div>
              )}
              {currentGeneration && !analysisLoading && (
                <button onClick={() => goToStep(4)} style={{ marginTop: 16, width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ← Ver resultado anterior
                </button>
              )}
              {!subjectBase64 && referenceBase64 && !analysisLoading && (
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginTop: 8 }}>
                  Sem subject = a IA mantém o produto/pessoa da referência original
                </p>
              )}
            </div>
          )}

          {/* Step 2: Edit Content (texts + colors from analysis) */}
          {uiStep === 2 && (
            <div style={{ animation: 'wizFdUp 350ms ease both' }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>Edite os textos e cores</h1>
                <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>Os textos foram extraídos automaticamente. Edite como quiser.</p>
              </div>
              {/* Texts */}
              <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center' }}>Textos detectados<InfoTooltip text="Textos encontrados automaticamente na referência. Edite, remova ou adicione novos." /></h3>
                {editedTexts.map((txt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <Select value={txt.type} onValueChange={(val) => { const next = [...editedTexts]; next[idx] = { ...next[idx], type: val }; setEditedTexts(next); }}>
                      <SelectTrigger style={{ width: 110, height: 34, fontSize: 12 }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['title', 'subtitle', 'price', 'label', 'cta', 'contact'].map(t => (
                          <SelectItem key={t} value={t} style={{ fontSize: 12 }}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="text" value={txt.content} onChange={(e) => {
                      const next = [...editedTexts];
                      next[idx] = { ...next[idx], content: e.target.value };
                      setEditedTexts(next);
                    }} style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, fontFamily: 'inherit' }} />
                    <button onClick={() => setEditedTexts(editedTexts.filter((_, i) => i !== idx))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setEditedTexts([...editedTexts, { type: 'label', content: '' }])} style={{ fontSize: 12, color: '#ff713d', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, marginTop: 4 }}>+ Adicionar texto</button>
                <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 8 }}>Textos curtos funcionam melhor. Evite frases longas.</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#FFF7ED', borderRadius: 8, marginTop: 12, border: '1px solid #FED7AA' }}>
                  <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>Textos muito pequenos podem apresentar variação na acentuação. Textos curtos e grandes funcionam melhor.</span>
                </div>
              </div>
              {/* Colors */}
              <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center' }}>Paleta de cores<InfoTooltip text="Cores detectadas na referência. Clique numa cor pra trocar. A IA vai aplicar as novas cores no criativo." /></h3>
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginBottom: 12 }}>Clique pra alterar as cores do criativo</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {colorPalette.map((color, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <ColorPicker value={color} onChange={(c) => { const next = [...colorPalette]; next[idx] = c; setColorPalette(next); }} className="!w-9 !h-9" />
                      <span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}>{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configure + Generate */}
          {uiStep === 3 && !generating && (
            <div style={{ animation: 'wizFdUp 350ms ease both' }}>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 4 }}>Configure a geração</h1>
                <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>Ajuste a variação criativa, formato e instruções extras.</p>
              </div>
              {/* Variation slider */}
              <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center' }}>Variação Criativa<InfoTooltip text="0% = cópia fiel da referência. 100% = reinterpretação livre. Recomendado: 0-10% pra manter o layout original." /></h3>
                <Slider value={[variationSlider]} onValueChange={([val]) => setVariationSlider(val)} min={0} max={100} step={5} className="w-full" />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 10 }}>
                  <span>Cópia exata</span>
                  <span style={{ color: '#ff713d', fontWeight: 600, fontSize: 14 }}>{variationSlider}%</span>
                  <span>Reinterpretação</span>
                </div>
              </div>
              {/* Format */}
              <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center' }}>Formato<InfoTooltip text="Formato do criativo. 1:1 Feed (quadrado), 4:5 Feed (vertical), 9:16 Story, 16:9 Banner." /></h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[{ v: '1:1', l: '1:1 Feed' }, { v: '4:5', l: '4:5 Feed' }, { v: '9:16', l: '9:16 Story' }, { v: '16:9', l: '16:9 Banner' }].map(f => (
                    <button key={f.v} onClick={() => setFormatSelect(f.v)} style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                      border: formatSelect === f.v ? '1.5px solid #ff713d' : '1px solid hsl(var(--border))',
                      background: formatSelect === f.v ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                      color: formatSelect === f.v ? '#ff713d' : 'hsl(var(--muted-foreground))',
                    }}>{f.l}</button>
                  ))}
                </div>
              </div>
              {/* Extra instructions */}
              <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center' }}>Instruções extras<InfoTooltip text="Diga com suas palavras o que quer mudar. Ex: 'adicione batatas flutuando', 'fundo mais escuro'." /></h3>
                <textarea value={extraInstructions} onChange={(e) => setExtraInstructions(e.target.value)} placeholder="Ex: manter fundo escuro, trocar a roupa por camisa branca..." style={{ width: '100%', minHeight: 70, padding: '8px 10px', borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
              {/* Generation summary */}
              {(() => {
                const activeCount = editedTexts.filter(t => t.content?.trim()).length;
                const removedCount = Math.max(0, analysisTexts.length - editedTexts.length);
                const editedCount = editedTexts.filter((t, i) => analysisTexts[i] && t.content?.trim().toLowerCase() !== analysisTexts[i].content?.trim().toLowerCase()).length;
                const addedCount = Math.max(0, editedTexts.length - analysisTexts.length);
                return (
                  <div style={{ background: 'hsl(var(--muted) / 0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={13} /> {activeCount} textos</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Palette size={13} /> {colorPalette.length} cores</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><RectangleHorizontal size={13} /> {formatSelect}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SlidersHorizontal size={13} /> {variationSlider}%</span>
                    {removedCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444' }}><Trash2 size={13} /> {removedCount} removido(s)</span>}
                    {editedCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3B82F6' }}><Pencil size={13} /> {editedCount} editado(s)</span>}
                    {addedCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22C55E' }}><Plus size={13} /> {addedCount} adicionado(s)</span>}
                  </div>
                );
              })()}
              {/* Generate button */}
              <button onClick={() => handleGenerate()} disabled={generating} style={{
                width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                background: 'linear-gradient(135deg, #ff713d, #FF9B70)', color: '#fff',
                boxShadow: '0 4px 16px rgba(255,113,61,0.35)', transition: 'all 200ms',
              }}>
                ✦ {currentGeneration ? 'Gerar novamente' : 'Gerar Criativo'} — 12 créditos
              </button>
              {/* Show "Ver resultado" when user came back from Step 4 */}
              {currentGeneration && (
                <button onClick={() => setUiStep(4)} style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, border: '1px solid hsl(var(--border))',
                  background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit', marginTop: 8,
                }}>
                  ← Ver resultado anterior
                </button>
              )}
            </div>
          )}

          {/* Step 3 — Generating state */}
          {uiStep === 3 && generating && (
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

                  <p style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))' }}>−12 créditos desta geração</p>
                </>
              )}
            </div>
          )}

          {/* Step 4: Result */}
          {uiStep === 4 && currentGeneration && (
            <div style={{ animation: 'wizFdUp 350ms ease both', maxWidth: flags.chatEnabled ? undefined : 900, margin: flags.chatEnabled ? undefined : '0 auto' }}>
              {/* Info bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#22C55E', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {composing ? "Compondo criativo..." : "Criativo gerado!"}
                </span>
                <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                  via {currentGeneration.meta.provider} · {Math.round(currentGeneration.meta.generationMs / 1000)}s
                </span>
              </div>

              {/* Image */}
              {displayBase64 && (
                <div
                  onWheel={(e) => { e.preventDefault(); setZoomScale(s => Math.min(Math.max(s * (e.deltaY > 0 ? 0.9 : 1.1), 0.3), 3)); }}
                  onMouseDown={(e) => { if (zoomScale <= 1) return; zoomDragging.current = true; zoomDragStart.current = { x: e.clientX, y: e.clientY, px: zoomPos.x, py: zoomPos.y }; }}
                  onMouseMove={(e) => { if (!zoomDragging.current) return; setZoomPos({ x: zoomDragStart.current.px + (e.clientX - zoomDragStart.current.x), y: zoomDragStart.current.py + (e.clientY - zoomDragStart.current.y) }); }}
                  onMouseUp={() => { zoomDragging.current = false; }}
                  onMouseLeave={() => { zoomDragging.current = false; }}
                  style={{
                    borderRadius: 12, overflow: 'hidden', marginBottom: 12,
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 8px 32px rgba(20,20,23,0.08)',
                    background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--card)) 0% 50%) 0 0 / 16px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: zoomScale > 1 ? 'grab' : 'default',
                  }}
                >
                  <img src={displayBase64} alt="Criativo gerado" draggable={false} style={{
                    width: '100%', maxHeight: '520px', objectFit: 'contain', display: 'block',
                    transform: `scale(${zoomScale}) translate(${zoomPos.x / zoomScale}px, ${zoomPos.y / zoomScale}px)`,
                    transformOrigin: 'center center',
                    transition: zoomDragging.current ? 'none' : 'transform 0.2s ease',
                    userSelect: 'none', pointerEvents: 'none',
                  }} />
                </div>
              )}

              {composing && <p style={{ fontSize: 11.5, color: '#ff713d', animation: 'wizPulse 1s ease-in-out infinite', fontWeight: 500, textAlign: 'center' }}>{popDesignStep || 'Aplicando tipografia...'}</p>}

              {/* Zoom controls */}
              {flags.zoomInResult && !isWorking && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                  <button onClick={() => setZoomScale(s => Math.max(s * 0.8, 0.3))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', minWidth: 36, textAlign: 'center' }}>{Math.round(zoomScale * 100)}%</span>
                  <button onClick={() => setZoomScale(s => Math.min(s * 1.25, 3))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  <button onClick={() => { setZoomScale(1); setZoomPos({ x: 0, y: 0 }); }} style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
                </div>
              )}

              {/* Session gallery strip */}
              {!isWorking && sessionGenerations.length > 1 && (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', overflowX: 'auto', padding: '4px 0', marginBottom: 16 }}>
                  {sessionGenerations.slice(-10).map((gen, idx) => {
                    const isActive = activeSessionIdx === -1 ? idx === sessionGenerations.slice(-10).length - 1 : idx === activeSessionIdx;
                    return (
                      <img key={gen.timestamp} src={gen.image} alt={`Geração ${idx + 1}`}
                        onClick={() => { setActiveSessionIdx(idx); setComposedBase64(gen.image); }}
                        style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', flexShrink: 0, border: isActive ? '2px solid #ff713d' : '2px solid hsl(var(--border))', opacity: isActive ? 1 : 0.7, transition: 'all 150ms' }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              {!isWorking && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                  <button onClick={() => setShowExportModal(true)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#ff713d,#FF9B70)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ↓ Download
                  </button>
                  <button onClick={handleRegenerateFromResult} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ↺ Gerar novamente — {flags.creditsPerGeneration} cr
                  </button>
                  <button onClick={() => { setGenerationDone(false); if (editedTexts.length === 0 && v2Analysis) { const texts = (v2Analysis.texts as Array<{ type: string; content: string }>) || []; if (texts.length > 0) { setAnalysisTexts(texts); setEditedTexts(texts.map(t => ({ ...t }))); } } setUiStep(2); }} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✎ Editar textos
                  </button>
                  <button onClick={resetForNewReference} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Nova referência
                  </button>
                </div>
              )}

              {/* Credits */}
              <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                Créditos restantes: <span style={{ color: storeCredits < 12 ? '#EF4444' : '#ff713d', fontWeight: 600 }}>{storeCredits}</span>
              </p>

              {/* Chat panel — only when feature flag enabled */}
              {flags.chatEnabled && !isWorking && (
                <div style={{ marginTop: 24, padding: 16, border: '1px solid hsl(var(--border))', borderRadius: 12, background: 'hsl(var(--card))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#ff713d,#FF9B70)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>✦</div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Creatyng AI</p>
                    <span style={{ fontSize: 11, color: '#10B981', marginLeft: 'auto' }}>● Online</span>
                  </div>
                  <RefinementChat
                    overrides={refinementOverrides}
                    onOverridesChange={(newOverrides) => { setRefinementOverrides(newOverrides); recomposeWithOverrides(newOverrides); }}
                    onRegenerate={handleRegenerateFromResult}
                    composition={htmlCompositionRef.current}
                    onCompositionChange={async (updated) => { htmlCompositionRef.current = updated; setComposing(true); try { const result = await exportCompositionToPNG(updated); setComposedBase64(result); setComposedImage(result); } finally { setComposing(false); } }}
                    context={{ analysis: v2Analysis, currentTexts: editedTexts, currentColors: colorPalette }}
                    onTextsUpdate={(texts) => { setEditedTexts(texts); toast.success('Textos atualizados!'); }}
                    onColorsUpdate={(colors) => { setColorPalette(colors); toast.success('Cores atualizadas!'); }}
                  />
                  {flags.refinePageEnabled && (
                    <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', textAlign: 'center', marginTop: 8 }}>
                      <button onClick={() => navigate(`/app/refine/${currentGeneration.generationId}`)} style={{ color: '#ff713d', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, textDecoration: 'underline' }}>
                        Expandir chat
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer navigation (steps 1-2 only; step 3 has its own button, step 4 is result) */}
      {(uiStep <= 2) && (
        <footer style={{
          flexShrink: 0, borderTop: '1px solid hsl(var(--border))',
          background: 'hsl(var(--background))', zIndex: 10,
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
              {uiStep === 1 ? (analysisLoading ? "Analisando..." : "Analisar e Continuar →") : "Próximo →"}
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
        />
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowResetConfirm(false)}>
          <div style={{ background: 'hsl(var(--card))', borderRadius: 16, padding: 24, maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 8 }}>Começar do zero?</h3>
            <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: 20 }}>Todas as edições, textos, cores e imagens serão descartados.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowResetConfirm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={() => { setShowResetConfirm(false); resetAll(); }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Descartar e recomeçar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
