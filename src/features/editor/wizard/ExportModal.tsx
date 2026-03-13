// src/features/editor/wizard/ExportModal.tsx
// CREATYNG — Export Modal redesigned to match CreatyngMicroV2 prototype.
// Light modal, dark header with thumbnail, 3 format cards, aspect ratio selector.
// Keeps existing triggerDownload / recomposeForFormat logic.

import { useState } from "react";
import {
  recomposeForFormat,
  EXPORT_FORMATS,
} from "@/features/editor/engine/exportComposed";
import type { TextPresetConfig, ColorConfig, CompositionConfig } from "@/types/preset";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  imageBase64: string;
  texts: { headline: string; subheadline?: string; cta?: string };
  presetConfig: TextPresetConfig;
  colors: ColorConfig;
  composition: CompositionConfig;
  isPro?: boolean;
  foodPopOverlay?: boolean;
  foodPopData?: {
    price?: { value: string; prefix: string; suffix: string } | null;
    whatsapp?: string;
    instagram?: string;
    accentColor?: string;
  };
}

type OutputFormat = "png" | "jpg" | "webp";
type AspectRatioId = "1:1" | "9:16" | "16:9" | "4:5";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function triggerDownload(base64: string, filename: string, mime: string): void {
  const link = document.createElement("a");
  link.href = base64.startsWith("data:") ? base64 : `data:${mime};base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

// ─── EXPORT FORMAT CONFIGS ────────────────────────────────────────────────────

const FORMAT_CARDS: Array<{ fmt: OutputFormat; label: string; desc: string; size: string; recommended?: boolean }> = [
  { fmt: "png", label: "PNG", desc: "Alta qualidade", size: "~2.4 MB", recommended: true },
  { fmt: "jpg", label: "JPG", desc: "Comprimido", size: "~800 KB" },
  { fmt: "webp", label: "WebP", desc: "Moderno", size: "~500 KB" },
];

const ASPECT_RATIOS: Array<{ id: AspectRatioId; w: number; h: number }> = [
  { id: "1:1", w: 18, h: 18 },
  { id: "9:16", w: 13, h: 20 },
  { id: "16:9", w: 22, h: 14 },
  { id: "4:5", w: 16, h: 20 },
];

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export function ExportModal({
  open, onClose,
  imageBase64, texts, presetConfig, colors, composition,
  isPro = false,
  foodPopOverlay = false,
  foodPopData,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>("png");
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioId>("1:1");
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  if (!open) return null;

  async function handleExport() {
    setExporting(true);
    setExportDone(false);
    const date = formatDate();
    const mime = selectedFormat === "jpg" ? "image/jpeg" : selectedFormat === "webp" ? "image/webp" : "image/png";
    const ext = selectedFormat;

    try {
      // Find the first format matching the selected aspect ratio or fall back to instagram_feed
      const fmt = EXPORT_FORMATS.find((f) => f.ratio === selectedRatio) ?? EXPORT_FORMATS[0];
      const result = await recomposeForFormat(
        imageBase64, texts, presetConfig, colors, composition, fmt,
        { quality: "2k", outputFormat: selectedFormat === "webp" ? "png" : selectedFormat, foodPopOverlay, foodPopData }
      );
      triggerDownload(result, `creatyng_${fmt.id}_${date}.${ext}`, mime);
      setExportDone(true);
      setTimeout(() => {
        setExportDone(false);
        onClose();
      }, 1000);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(20,20,23,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200,
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#ffffff", borderRadius: 20, width: 440,
            boxShadow: "0 24px 80px rgba(0,0,0,.18)", overflow: "hidden",
            fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
          }}
        >
          {/* Dark header with thumbnail */}
          <div style={{
            background: "linear-gradient(135deg, #141417, #2a2a30)",
            padding: "20px 24px",
            display: "flex", alignItems: "center", gap: 16, position: "relative",
          }}>
            {/* Thumbnail */}
            <div style={{
              width: 56, height: 56, borderRadius: 10, overflow: "hidden",
              flexShrink: 0, background: "linear-gradient(135deg, #ff713d, #FF9B70)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {imageBase64 ? (
                <img
                  src={imageBase64}
                  alt="Criativo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Exportar criativo</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                {texts.headline || "Criativo sem título"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: 14, right: 14,
                background: "rgba(255,255,255,0.1)", border: "none",
                borderRadius: 7, width: 28, height: 28, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 24px 24px" }}>

            {/* Format selection */}
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#8e8e96", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Formato
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {FORMAT_CARDS.map((f) => {
                const isSelected = selectedFormat === f.fmt;
                return (
                  <button
                    key={f.fmt}
                    onClick={() => setSelectedFormat(f.fmt)}
                    style={{
                      flex: 1, padding: "14px 10px", borderRadius: 12, cursor: "pointer",
                      fontFamily: "inherit",
                      border: isSelected ? "1.5px solid #ff713d" : "1px solid rgba(20,20,23,0.08)",
                      background: isSelected ? "#FFF0EA" : "#ffffff",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      transition: "all 150ms", position: "relative",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(20,20,23,0.15)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}}
                    onMouseLeave={(e) => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(20,20,23,0.08)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}}
                  >
                    {f.recommended && (
                      <div style={{
                        position: "absolute", top: -8, padding: "2px 8px",
                        borderRadius: 5, background: "#ff713d", color: "#fff", fontSize: 9, fontWeight: 700,
                      }}>Recomendado</div>
                    )}
                    <div style={{ fontSize: 18, fontWeight: 700, color: isSelected ? "#ff713d" : "#141417" }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: "#8e8e96" }}>{f.desc}</div>
                    <div style={{ fontSize: 10, color: "#b5b5bb", fontFamily: "monospace" }}>{f.size}</div>
                  </button>
                );
              })}
            </div>

            {/* Aspect ratio selection */}
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#8e8e96", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Proporção
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {ASPECT_RATIOS.map((a) => {
                const isSelected = selectedRatio === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedRatio(a.id)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 9, cursor: "pointer",
                      fontFamily: "inherit",
                      border: isSelected ? "1.5px solid #ff713d" : "1px solid rgba(20,20,23,0.08)",
                      background: isSelected ? "#FFF0EA" : "#ffffff",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                      transition: "all 150ms",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(20,20,23,0.15)"; }}
                    onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(20,20,23,0.08)"; }}
                  >
                    <div style={{
                      width: a.w, height: a.h, borderRadius: 2,
                      border: `1.5px solid ${isSelected ? "#ff713d" : "#b5b5bb"}`,
                    }} />
                    <span style={{ fontSize: 11, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#ff713d" : "#5a5a60" }}>
                      {a.id}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Credits note */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", color: "#b5b5bb", fontSize: 10.5, marginBottom: 18 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>0 créditos — export é gratuito</span>
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              disabled={exporting || exportDone}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
                background: exportDone
                  ? "linear-gradient(135deg, #10B981, #059669)"
                  : "linear-gradient(135deg, #ff713d, #FF9B70)",
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: (exporting || exportDone) ? "default" : "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                opacity: exporting ? 0.7 : 1,
                boxShadow: "0 3px 12px rgba(255,113,61,0.3)",
                transition: "all 200ms",
              }}
            >
              {exportDone ? (
                <>✓ Download concluído!</>
              ) : exporting ? (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Exportando...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Baixar {selectedFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
