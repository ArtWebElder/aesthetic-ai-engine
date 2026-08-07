// src/features/editor/wizard/ExportModal.tsx
// CREATYNG — Export Modal with resize presets + format conversion (canvas-based, no AI, no credits)

import { useState } from "react";
import { useI18n } from "@/i18n";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  imageBase64: string;
}

type OutputFormat = "png" | "jpg" | "webp";

const FORMAT_CARDS: Array<{ fmt: OutputFormat; label: string; descKey: string }> = [
  { fmt: "png", label: "PNG", descKey: "export.fmt_desc.png" },
  { fmt: "jpg", label: "JPG", descKey: "export.fmt_desc.jpg" },
  { fmt: "webp", label: "WebP", descKey: "export.fmt_desc.webp" },
];

const SIZE_PRESETS = [
  { id: "original", label: "Original", w: 0, h: 0 },
  { id: "feed_1_1", label: "Feed 1:1", w: 1080, h: 1080 },
  { id: "feed_4_5", label: "Feed 4:5", w: 1080, h: 1350 },
  { id: "story_9_16", label: "Story 9:16", w: 1080, h: 1920 },
  { id: "banner_16_9", label: "Banner 16:9", w: 1920, h: 1080 },
];

function resizeAndDownload(imgSrc: string, targetW: number, targetH: number, format: OutputFormat, quality: number) {
  const img = new Image();
  img.onload = () => {
    const w = targetW || img.naturalWidth;
    const h = targetH || img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = w / h;
    let sx: number, sy: number, sw: number, sh: number;
    if (imgRatio > canvasRatio) {
      sh = img.naturalHeight;
      sw = sh * canvasRatio;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

    const mime = format === "jpg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const q = format === "png" ? undefined : quality / 100;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `creatyng-${Date.now()}.${format === "jpg" ? "jpg" : format}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      mime,
      q,
    );
  };
  img.src = imgSrc;
}

export function ExportModal({ open, onClose, imageBase64 }: ExportModalProps) {
  const { t } = useI18n();
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>("png");
  const [selectedSize, setSelectedSize] = useState("original");
  const [quality, setQuality] = useState(90);
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  const preset = SIZE_PRESETS.find((p) => p.id === selectedSize) || SIZE_PRESETS[0];

  function handleExport() {
    setExporting(true);
    resizeAndDownload(imageBase64, preset.w, preset.h, selectedFormat, quality);
    setTimeout(() => {
      setExporting(false);
      onClose();
    }, 800);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(20,20,23,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "hsl(var(--card))", borderRadius: 20, width: 440,
          boxShadow: "0 24px 80px rgba(0,0,0,.18)", overflow: "hidden",
          fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #141417, #2a2a30)",
          padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, position: "relative",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
            <img src={imageBase64} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{t('export.title')}</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{t('export.subtitle')}</p>
          </div>
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7,
            width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.6)",
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          {/* Format */}
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "#8e8e96", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>{t('export.format_label')}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {FORMAT_CARDS.map((f) => {
              const sel = selectedFormat === f.fmt;
              return (
                <button key={f.fmt} onClick={() => setSelectedFormat(f.fmt)} style={{
                  flex: 1, padding: "12px 10px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                  border: sel ? "1.5px solid hsl(var(--brand))" : "1px solid rgba(20,20,23,0.08)",
                  background: sel ? "hsl(var(--brand) / 0.16)" : "hsl(var(--card))",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: sel ? "hsl(var(--brand))" : "#141417" }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "#8e8e96" }}>{t(f.descKey)}</div>
                </button>
              );
            })}
          </div>

          {/* Quality (only for JPG/WebP) */}
          {selectedFormat !== "png" && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "#8e8e96", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t('export.quality_label')}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--brand))" }}>{quality}%</span>
              </div>
              <input type="range" min={60} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))}
                style={{ width: "100%", accentColor: "hsl(var(--brand))" }} />
            </div>
          )}

          {/* Size presets */}
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "#8e8e96", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>{t('export.size_label')}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {SIZE_PRESETS.map((s) => {
              const sel = selectedSize === s.id;
              return (
                <button key={s.id} onClick={() => setSelectedSize(s.id)} style={{
                  padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                  border: sel ? "1.5px solid hsl(var(--brand))" : "1px solid rgba(20,20,23,0.08)",
                  background: sel ? "hsl(var(--brand) / 0.16)" : "hsl(var(--card))",
                  fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? "hsl(var(--brand))" : "#5a5a60",
                }}>
                  {s.id === "original" ? t('export.size_original') : s.label}{s.w > 0 ? ` (${s.w}×${s.h})` : ""}
                </button>
              );
            })}
          </div>

          {/* Warning when changing size */}
          {selectedSize !== "original" ? (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "hsl(38 92% 50% / 0.13)", border: "1px solid hsl(38 92% 50% / 0.30)", marginBottom: 18, fontSize: 11.5, color: "#FBBF24", lineHeight: 1.5 }}>
              {t('export.resize_warning', { credits: 12 })}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", color: "#10B981", fontSize: 11, marginBottom: 18, fontWeight: 500 }}>
              {t('export.free_note')}
            </div>
          )}

          {/* Export button */}
          <button onClick={handleExport} disabled={exporting} style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, hsl(var(--brand)), hsl(var(--brand-2)))", color: "hsl(var(--brand-foreground))",
            fontSize: 14, fontWeight: 600, cursor: exporting ? "default" : "pointer",
            fontFamily: "inherit", opacity: exporting ? 0.7 : 1,
            boxShadow: "0 3px 12px hsl(var(--brand) / 0.3)",
          }}>
            {exporting ? t('export.exporting') : t('export.download', { fmt: selectedFormat.toUpperCase() })}
          </button>
        </div>
      </div>
    </div>
  );
}
