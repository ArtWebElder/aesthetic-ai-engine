// src/pages/RefinementPage.tsx
// CREATYNG — Fase 4 — Chat AI expandido com split-screen e histórico de versões.
// Rota: /app/refine/:id

import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
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

const QUICK_ACTION_COLORS: Record<string, string> = {
  "Trocar cor": "#ff713d", "Editar headline": "#7C3AED", "Mudar fonte": "#06B6D4",
  "Ajustar preço": "#10B981", "Trocar fundo": "#F59E0B", "Auto-melhorar": "#EF4444",
};

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
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const [refinementOverrides, setRefinementOverrides] = useState<RefinementOverrides>({});
  const [isRecomposing, setIsRecomposing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [pillMessage, setPillMessage] = useState<string | null>(null);

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

  const zoomIn = useCallback(() => setScale(s => Math.min(s * 1.25, 3)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(s * 0.8, 0.3)), []);
  const resetZoom = useCallback(() => { setScale(1); setPan({ x: 0, y: 0 }); }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => {
      const next = e.deltaY < 0 ? s * 1.1 : s * 0.9;
      return Math.min(Math.max(next, 0.3), 3);
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  }, [scale, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x) / scale,
      y: panStart.current.y + (e.clientY - dragStart.current.y) / scale,
    });
  }, [scale]);

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const hasContent = Boolean(displayImage);
  const checkerBg = 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 0 0 / 16px 16px';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f3', color: '#141417', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes rfPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes rfDot1 { 0%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
        @keyframes rfDot2 { 0%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
        @keyframes rfDot3 { 0%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
      `}</style>

      {/* Top bar */}
      <header style={{
        flexShrink: 0, height: 52, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background) / 0.9)',
        backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
        >←</button>

        <div style={{ width: 1, height: 20, background: 'rgba(20,20,23,0.08)' }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#141417', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headline || "Criativo sem título"}</p>
        </div>

        <span style={{ padding: '3px 9px', borderRadius: 6, background: '#FFF0EA', color: '#ff713d', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>Clone Criativo</span>

        <button
          onClick={() => setShowExportModal(true)}
          disabled={!hasContent}
          style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#ff713d,#FF9B70)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: hasContent ? 'pointer' : 'default', opacity: hasContent ? 1 : 0.4, fontFamily: 'inherit' }}
        >↓ Exportar</button>
      </header>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* ── LEFT: Preview 55% ── */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, borderRight: '1px solid hsl(var(--border))', background: checkerBg }}>
          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--card) / 0.6)', backdropFilter: 'blur(4px)', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>Zoom</span>
            <button onClick={zoomOut} style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontSize: 11.5, color: 'hsl(var(--foreground))', width: 48, textAlign: 'center', fontWeight: 500 }}>{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            <button onClick={resetZoom} style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
            {isRecomposing && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#ff713d', animation: 'rfPulse 1s ease-in-out infinite' }}>Atualizando...</span>}
          </div>

          {/* Preview area */}
          <div
            style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, cursor: scale > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'default' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {hasContent && displayImage ? (
              <img
                src={displayImage}
                alt="Criativo"
                draggable={false}
                style={{
                  borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                  border: '1px solid hsl(var(--border))', objectFit: 'contain',
                  maxWidth: '100%', maxHeight: '100%',
                  transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
                  transformOrigin: 'center center',
                  transition: isDragging.current ? 'none' : 'transform 0.2s ease',
                  userSelect: 'none',
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  <Sparkles size={24} style={{ color: '#F97316' }} />
                </div>
                <p style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>Nenhum criativo carregado.</p>
                <button onClick={() => navigate("/app/create")} style={{ color: '#ff713d', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, textDecoration: 'underline' }}>Criar um criativo</button>
              </div>
            )}
          </div>

          {/* Version timeline */}
          {versions.length > 1 && (
            <div style={{ flexShrink: 0, borderTop: '1px solid rgba(20,20,23,0.06)', padding: '10px 14px', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(4px)' }}>
              <p style={{ fontSize: 10, color: '#8e8e96', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>Histórico de versões</p>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {versions.map((v, idx) => (
                  <button key={idx} onClick={() => selectVersion(idx)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${selectedVersionIdx === idx ? '#ff713d' : 'rgba(20,20,23,0.1)'}`, background: selectedVersionIdx === idx ? '#FFF0EA' : '#ffffff' }}>
                      <img src={v.imageBase64} alt={v.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 500, maxWidth: 36, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedVersionIdx === idx ? '#ff713d' : '#8e8e96' }}>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Chat 45% ── */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 380, flexShrink: 0, background: '#ffffff' }}>
          {/* Chat header */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(20,20,23,0.06)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#ff713d,#FF9B70)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0, position: 'relative' }}>
              ✦
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#10B981', border: '1.5px solid #ffffff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: '#141417' }}>Assistente de Refinamento</p>
              <p style={{ fontSize: 11, color: '#10B981' }}>● Online</p>
            </div>
            <button onClick={() => navigate("/app/create")} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(20,20,23,0.08)', background: '#ffffff', color: '#5a5a60', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>↺ Regerar tudo</button>
          </div>

          {/* Quick actions */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 14px', borderBottom: '1px solid rgba(20,20,23,0.06)' }}>
            {QUICK_ACTIONS.map((action) => {
              const color = QUICK_ACTION_COLORS[action] || '#8e8e96';
              return (
                <button key={action} onClick={() => setPillMessage(action)} style={{
                  flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 500,
                  border: `1px solid ${color}20`, background: `${color}0A`, color, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {action}
                </button>
              );
            })}
          </div>

          {/* Chat component */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '12px 14px', gap: 8 }}>
            <p style={{ fontSize: 11, color: '#b5b5bb', textAlign: 'center' }}>1 crédito por mensagem de ajuste</p>
            <div style={{ flex: 1, minHeight: 0 }}>
              <RefinementChat
                overrides={refinementOverrides}
                onOverridesChange={handleOverridesChange}
                onRegenerate={() => navigate("/app/create", { state: { returnToStep: 3 } })}
                composition={htmlCompositionRef.current}
                onCompositionChange={(updated) => handleCompositionChange(updated, "Chat AI")}
                externalMessage={pillMessage}
                onExternalMessageConsumed={() => setPillMessage(null)}
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
