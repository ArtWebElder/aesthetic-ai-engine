import React from "react";
import type { TemplateRenderProps } from "@/features/editor/templates/types";

export default function TEcomV201({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const v2 = spec.ecomV2 ?? {};
  const layout = v2.layoutPreset ?? "layout_a";
  const textPreset = v2.textPreset ?? "premium";
  const intensity = Math.max(0, Math.min(100, Number(v2.intensity ?? 70)));
  const palette = v2.styleDNA?.palette?.length ? v2.styleDNA.palette : ["#F59E0B", "#111827", "#FFFFFF"];
  const subject = spec.subjectImageUrl || imageUrl || null;
  const headline = spec.content.headline || "New Collection";
  const subheadline = spec.content.subheadline || "High-converting banner in seconds.";
  const cta = spec.content.ctaText || "Shop now";
  const price = spec.content.price || "$49";

  const titleStyle: React.CSSProperties =
    textPreset === "impact"
      ? {
          fontFamily: "var(--mi-font-display)",
          fontWeight: 900,
          fontSize: "var(--mi-h1-size)",
          lineHeight: 0.92,
          color: "var(--mi-text)",
          textShadow: "0 16px 36px rgba(0,0,0,.55)",
          WebkitTextStroke: "1.5px rgba(0,0,0,.45)",
          letterSpacing: "-0.02em",
        }
      : textPreset === "clean"
      ? {
          fontFamily: "var(--mi-font-display)",
          fontWeight: 800,
          fontSize: "var(--mi-h1-size)",
          lineHeight: 1,
          color: "var(--mi-text)",
          textShadow: "0 8px 22px rgba(0,0,0,.38)",
          letterSpacing: "-0.01em",
        }
      : {
          fontFamily: "var(--mi-font-display)",
          fontWeight: 800,
          fontSize: "var(--mi-h1-size)",
          lineHeight: 0.98,
          color: "var(--mi-text)",
          textShadow: "0 10px 26px rgba(0,0,0,.45)",
        };

  const badgeClass =
    textPreset === "impact"
      ? "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-black tracking-wide"
      : "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold";

  const badgeStyle: React.CSSProperties =
    textPreset === "impact"
      ? { background: palette[0], color: "#0b0f14", boxShadow: "0 10px 30px rgba(0,0,0,.35)" }
      : { background: "rgba(255,255,255,.16)", color: "#fff", border: "1px solid rgba(255,255,255,.22)" };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div className="absolute inset-0">
        {subject ? (
          <img src={subject} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(140deg, ${palette[1]}, ${palette[0]} 68%)` }}
          />
        )}
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            textPreset === "clean"
              ? "linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.28), rgba(0,0,0,0))"
              : "radial-gradient(circle at 20% 20%, rgba(255,255,255,.12), rgba(0,0,0,0) 35%), linear-gradient(90deg, rgba(0,0,0,.65), rgba(0,0,0,.2), rgba(0,0,0,0))",
          opacity: 0.68 + (intensity / 100) * 0.2,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.012) 0px, rgba(255,255,255,.012) 1px, transparent 1px, transparent 2px)",
          mixBlendMode: "soft-light",
          opacity: (v2.styleDNA?.fx ?? []).includes("grain") ? 0.45 : 0.2,
        }}
      />

      {showGrid ? (
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.10) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      ) : null}

      <div className="relative z-10 h-full w-full p-10">
        {layout === "layout_a" ? (
          <div className="grid h-full grid-rows-[auto_1fr_auto]">
            <div style={titleStyle}>{headline}</div>
            <div />
            <div className="flex items-end justify-between">
              <div className="space-y-3">
                <div className="max-w-[60ch] text-[var(--mi-sub-size)] text-white/90">{subheadline}</div>
                <span className="inline-flex items-center rounded-full px-5 h-11 text-sm font-medium border" style={{ background: "var(--mi-cta-bg)", color: "var(--mi-cta-text)", borderColor: "var(--mi-cta-border)" }}>{cta}</span>
              </div>
              <span className={badgeClass} style={badgeStyle}>{price}</span>
            </div>
          </div>
        ) : null}

        {layout === "layout_b" ? (
          <div className="grid h-full grid-cols-[1fr_auto] gap-6">
            <div className="self-center space-y-4">
              <div style={titleStyle}>{headline}</div>
              <div className="max-w-[46ch] text-[var(--mi-sub-size)] text-white/90">{subheadline}</div>
              <span className="inline-flex items-center rounded-full px-5 h-11 text-sm font-medium border" style={{ background: "var(--mi-cta-bg)", color: "var(--mi-cta-text)", borderColor: "var(--mi-cta-border)" }}>{cta}</span>
            </div>
            <div className="self-end">
              <span className={badgeClass} style={badgeStyle}>{price}</span>
            </div>
          </div>
        ) : null}

        {layout === "layout_c" ? (
          <div className="grid h-full grid-rows-[1fr_auto] text-center">
            <div className="self-center space-y-4">
              <div style={titleStyle}>{headline}</div>
              <div className="mx-auto max-w-[52ch] text-[var(--mi-sub-size)] text-white/90">{subheadline}</div>
            </div>
            <div className="flex items-end justify-center gap-3">
              <span className="inline-flex items-center rounded-full px-5 h-11 text-sm font-medium border" style={{ background: "var(--mi-cta-bg)", color: "var(--mi-cta-text)", borderColor: "var(--mi-cta-border)" }}>{cta}</span>
              <span className={badgeClass} style={badgeStyle}>{price}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
