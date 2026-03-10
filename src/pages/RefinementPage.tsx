// src/pages/RefinementPage.tsx
// CREATYNG — Fase 4 — Chat AI expandido com split-screen e histórico de versões.
// Rota: /app/refine/:id

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWizardStore } from "@/stores/useWizardStore";
import { RefinementChat } from "@/features/editor/wizard/RefinementChat";
import { type RefinementOverrides } from "@/features/editor/engine/chatApply";
import { exportCompositionToPNG } from "@/features/editor/engine/htmlExport";
import { applyChatToComposition } from "@/features/editor/engine/chatApplyComposition";
import { ExportModal } from "@/features/editor/wizard/ExportModal";
import type { CreatygnComposition } from "@/types/composition";
import type { TextPresetConfig, ColorConfig, CompositionConfig } from "@/types/preset";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Version {
  label: string;
  imageBase64: string;
  timestamp: number;
}

// ── Default configs ───────────────────────────────────────────────────────────

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

// ── Quick action chips ────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "Trocar cor",
  "Editar headline",
  "Mudar fonte",
  "Ajustar preço",
  "Trocar fundo",
  "Auto-melhorar",
];

// ── RefinementPage ────────────────────────────────────────────────────────────

export default function RefinementPage() {
  const navigate = useNavigate();

  const {
    composedImageBase64,
    currentGeneration,
    headline,
    subheadline,
    cta,
    whatsapp,
    instagram,
    price,
    setComposedImage,
  } = useWizardStore();

  // Use composed image if available, otherwise fall back to raw generation
  const initialImage = composedImageBase64 ?? currentGeneration?.imageBase64 ?? null;

  const [displayImage, setDisplayImage] = useState<string | null>(initialImage);
  const [versions, setVersions] = useState<Version[]>(
    initialImage
      ? [{ label: "Original", imageBase64: initialImage, timestamp: Date.now() }]
      : []
  );
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [refinementOverrides, setRefinementOverrides] = useState<RefinementOverrides>({});
  const [isRecomposing, setIsRecomposing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // We keep a local composition ref so the chat can edit it
  const htmlCompositionRef = useRef<CreatygnComposition | null>(null);
  const textConfigRef = useRef<TextPresetConfig | null>(null);
  const colorsRef = useRef<ColorConfig>(DEFAULT_COLORS);
  const compositionRef = useRef<CompositionConfig>(DEFAULT_COMPOSITION);

  const presetConfig = textConfigRef.current ?? ({} as TextPresetConfig);

  // ── Version management ────────────────────────────────────────────────────

  function addVersion(label: string, imageBase64: string) {
    const v: Version = { label, imageBase64, timestamp: Date.now() };
    setVersions((prev) => [...prev, v]);
    setSelectedVersionIdx((prev) => prev + 1);
    setDisplayImage(imageBase64);
    setComposedImage(imageBase64);
  }

  function selectVersion(idx: number) {
    setSelectedVersionIdx(idx);
    setDisplayImage(versions[idx].imageBase64);
  }

  // ── Composition change handler ────────────────────────────────────────────

  async function handleCompositionChange(updated: CreatygnComposition, label?: string) {
    htmlCompositionRef.current = updated;
    setIsRecomposing(true);
    try {
      const result = await exportCompositionToPNG(updated);
      addVersion(label ?? `Ajuste ${versions.length}`, result);
    } finally {
      setIsRecomposing(false);
    }
  }

  async function handleOverridesChange(newOverrides: RefinementOverrides) {
    setRefinementOverrides(newOverrides);
    if (!htmlCompositionRef.current) return;

    let updated = structuredClone(htmlCompositionRef.current);
    if (newOverrides.headline) updated = applyChatToComposition(updated, { type: 'change_text', target: 'headline', value: newOverrides.headline });
    if (newOverrides.subheadline) updated = applyChatToComposition(updated, { type: 'change_text', target: 'subheadline', value: newOverrides.subheadline });
    if (newOverrides.cta) updated = applyChatToComposition(updated, { type: 'change_text', target: 'cta', value: newOverrides.cta });
    if (newOverrides.price?.value) updated = applyChatToComposition(updated, { type: 'change_text', target: 'price', value: newOverrides.price.value });
    if (newOverrides.accentColor) updated = applyChatToComposition(updated, { type: 'change_color', value: newOverrides.accentColor });
    if (newOverrides.fontFamily) updated = applyChatToComposition(updated, { type: 'change_font', value: newOverrides.fontFamily });

    await handleCompositionChange(updated, "Ajuste via chat");
  }

  const hasContent = Boolean(displayImage);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            ←
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Refinamento</p>
            <p className="text-xs text-zinc-500 truncate">{headline || "Criativo sem título"}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              disabled={!hasContent}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-colors"
              style={{ background: "linear-gradient(135deg, #f97316, #a855f7)" }}
            >
              ↓ Exportar
            </button>
          </div>
        </div>
      </header>

      {/* Main split */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* ── LEFT: Preview ──────────────────────────────────────────────── */}
        <div className="flex flex-col lg:w-[55%] border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950">
          {/* Zoom controls */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <span className="text-xs text-zinc-500">Zoom</span>
            <button
              onClick={() => setZoom((z) => Math.max(25, z - 25))}
              className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-bold"
            >
              −
            </button>
            <span className="text-xs text-zinc-300 w-12 text-center">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 25))}
              className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-bold"
            >
              +
            </button>
            <button
              onClick={() => setZoom(100)}
              className="text-xs text-zinc-600 hover:text-zinc-400 ml-1 transition-colors"
            >
              Reset
            </button>
            {isRecomposing && (
              <span className="ml-auto text-xs text-orange-400 animate-pulse">Atualizando...</span>
            )}
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-zinc-950/50">
            {hasContent && displayImage ? (
              <img
                src={displayImage}
                alt="Criativo"
                className="rounded-xl shadow-2xl border border-zinc-800 object-contain transition-all duration-300"
                style={{
                  maxWidth: `${zoom}%`,
                  maxHeight: "70vh",
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl">
                  ✦
                </div>
                <p className="text-zinc-500 text-sm">Nenhum criativo carregado.</p>
                <button
                  onClick={() => navigate("/app/create")}
                  className="text-orange-500 hover:text-orange-400 text-sm underline underline-offset-2"
                >
                  Criar um criativo
                </button>
              </div>
            )}
          </div>

          {/* Version timeline */}
          {versions.length > 1 && (
            <div className="shrink-0 border-t border-zinc-800 p-3 bg-zinc-900/50">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Histórico de versões</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {versions.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectVersion(idx)}
                    className="shrink-0 flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className="w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors"
                      style={{ borderColor: selectedVersionIdx === idx ? "#f97316" : "#3f3f46" }}
                    >
                      <img
                        src={v.imageBase64}
                        alt={v.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span
                      className="text-[10px] font-medium max-w-[56px] truncate transition-colors"
                      style={{ color: selectedVersionIdx === idx ? "#f97316" : "#71717a" }}
                    >
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Chat ──────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:w-[45%] bg-zinc-900/30">
          {/* Chat header */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
              ✦
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Assistente de Refinamento</p>
              <p className="text-xs text-green-500">● Online</p>
            </div>
            <button
              onClick={() => navigate("/app/create")}
              className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-2 py-1 rounded transition-colors"
            >
              ↺ Regerar tudo
            </button>
          </div>

          {/* Quick actions */}
          <div className="shrink-0 flex gap-2 overflow-x-auto px-4 py-2.5 border-b border-zinc-800">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-700 text-zinc-400 hover:border-orange-500/50 hover:text-orange-400 transition-colors bg-zinc-900"
              >
                {action}
              </button>
            ))}
          </div>

          {/* Chat component */}
          <div className="flex-1 overflow-hidden flex flex-col p-4 gap-2">
            <p className="text-xs text-zinc-600 text-center">1 crédito por mensagem de ajuste</p>
            <div className="flex-1 min-h-0">
              <RefinementChat
                overrides={refinementOverrides}
                onOverridesChange={handleOverridesChange}
                onRegenerate={() => navigate("/app/create")}
                composition={htmlCompositionRef.current}
                onCompositionChange={(updated) => handleCompositionChange(updated, "Chat AI")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && displayImage && (
        <ExportModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          imageBase64={displayImage}
          texts={{
            headline: (refinementOverrides.headline ?? headline) || "",
            subheadline: refinementOverrides.subheadline ?? subheadline ?? undefined,
            cta: refinementOverrides.cta ?? cta ?? undefined,
          }}
          presetConfig={presetConfig}
          colors={colorsRef.current}
          composition={compositionRef.current}
        />
      )}
    </div>
  );
}
