import React from "react";
import type { TemplateRenderProps } from "@/features/editor/templates/types";

export default function TEcomV201({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const parseHex = (input: string): [number, number, number] | null => {
    const hex = input.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return [r, g, b];
    }
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return [r, g, b];
    }
    return null;
  };
  const darkenHex = (input: string, ratio: number): string => {
    const source = parseHex(input) ?? [255, 255, 255];
    const base: [number, number, number] = [0x0b, 0x0f, 0x14];
    const clampRatio = Math.max(0, Math.min(1, ratio));
    const mix = source.map((c, i) =>
      Math.round(base[i] * clampRatio + c * (1 - clampRatio))
    ) as [number, number, number];
    return `#${mix.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  };
  const v2 = spec.ecomV2 ?? {};
  const layout = v2.layoutPreset ?? "layout_a";
  const textPreset = v2.textPreset ?? "premium";
  const intensity = Math.max(0, Math.min(100, Number(v2.intensity ?? 70)));
  const palette = v2.styleDNA?.palette?.length ? v2.styleDNA.palette : ["#F59E0B", "#111827", "#FFFFFF"];
  const p0 = darkenHex(palette[0], 0.75);
  const p1 = darkenHex(palette[1], 0.7);
  const canMix =
    typeof CSS !== "undefined" &&
    Boolean(CSS.supports?.("color", "color-mix(in srgb, #000 50%, #fff)"));
  const subject = spec.subjectImageUrl || null;
  const headline = spec.content.headline || "New Collection";
  const subheadline = spec.content.subheadline || "High-converting banner in seconds.";
  const cta = spec.content.ctaText || "Shop now";
  const price = spec.content.price || "$49";
  const subjectBoxStyle: React.CSSProperties =
    layout === "layout_b"
      ? {
          right: "6%",
          bottom: "12%",
          width: "min(42%, 520px)",
          height: "72%",
        }
      : layout === "layout_c"
      ? {
          left: "50%",
          bottom: "8%",
          transform: "translateX(-50%)",
          width: "min(52%, 560px)",
          height: "66%",
        }
      : {
          right: "10%",
          bottom: "10%",
          width: "min(40%, 500px)",
          height: "74%",
        };

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

  const ctaStyle: React.CSSProperties = {
    background: "#ffffff",
    color: "#0b0f14",
    borderColor: "rgba(0,0,0,0.08)",
    boxShadow: "0 8px 20px rgba(0,0,0,.24)",
  };

  const badgeStyle: React.CSSProperties =
    textPreset === "impact"
      ? {
          background: "rgba(11,15,20,0.72)",
          color: palette[0],
          border: `1px solid ${palette[0]}66`,
          boxShadow: "0 8px 20px rgba(0,0,0,.28)",
        }
      : {
          background: "rgba(11,15,20,0.58)",
          color: palette[0],
          border: `1px solid ${palette[0]}55`,
          boxShadow: "0 6px 16px rgba(0,0,0,.22)",
        };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div className="absolute inset-0">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: canMix
                ? `linear-gradient(140deg, color-mix(in srgb, #0b0f14 70%, ${palette[1]}), color-mix(in srgb, #0b0f14 75%, ${palette[0]}) 68%)`
                : `linear-gradient(140deg, ${p1}, ${p0} 68%)`,
            }}
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
      {subject ? (
        <div className="absolute z-[5] pointer-events-none" style={subjectBoxStyle}>
          <div
            className="absolute inset-[4%] rounded-[999px]"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 72%)",
              filter: "blur(16px)",
            }}
          />
          <div
            className="absolute inset-[8%] rounded-[999px] blur-2xl"
            style={{ background: "rgba(0,0,0,0.35)" }}
          />
          <img
            src={subject}
            alt=""
            className="relative h-full w-full object-contain"
            style={{ filter: "drop-shadow(0 20px 36px rgba(0,0,0,.55))" }}
          />
        </div>
      ) : null}

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
                <span className="inline-flex items-center rounded-full px-5 h-11 text-sm font-medium border" style={ctaStyle}>{cta}</span>
              </div>
              <span className={badgeClass} style={badgeStyle}>{price}</span>
            </div>
          </div>
        ) : null}

        {layout === "layout_b" ? (
          <div className="grid h-full grid-cols-[1fr_auto] gap-6">
            <div
              className="self-center space-y-4"
              style={{ maxWidth: "56%", paddingRight: "10%" }}
            >
              <div style={titleStyle}>{headline}</div>
              <div className="max-w-[46ch] text-[var(--mi-sub-size)] text-white/90">{subheadline}</div>
              <span className="inline-flex items-center rounded-full px-5 h-11 text-sm font-medium border" style={ctaStyle}>{cta}</span>
            </div>
            <div className="self-end">
              <span className={badgeClass} style={badgeStyle}>{price}</span>
            </div>
          </div>
        ) : null}

        {layout === "layout_c" ? (
          <div className="grid h-full grid-rows-[1fr_auto] text-center">
            <div className="self-center space-y-4 mx-auto max-w-[62%]">
              <div style={titleStyle}>{headline}</div>
              <div className="mx-auto max-w-[52ch] text-[var(--mi-sub-size)] text-white/90">{subheadline}</div>
            </div>
            <div className="flex items-end justify-center gap-3">
              <span className="inline-flex items-center rounded-full px-5 h-11 text-sm font-medium border" style={ctaStyle}>{cta}</span>
              <span className={badgeClass} style={badgeStyle}>{price}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
