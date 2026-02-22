// src/features/editor/templates/ecom/ecom_01.tsx
import React from "react";
import type { TemplateRenderProps } from "@/features/editor/templates/types";

function isHex(s?: string) {
  if (!s) return false;
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(s.trim());
}

// fallback simples: se brand.accent não for hex, usa emerald
function resolveAccent(spec: TemplateRenderProps["spec"]) {
  const a = spec.brand?.accent;
  if (isHex(a)) return a!;
  return "#34d399"; // emerald-400
}

// resolve text color: se brand.primary for hex usa, senão branco
function resolveText(spec: TemplateRenderProps["spec"]) {
  const p = spec.brand?.primary;
  if (isHex(p)) return p!;
  return "#ffffff";
}

export default function TEcom01({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const { headline, subheadline, ctaText, price, badgeText } = spec.content;

  const accent = resolveAccent(spec);
  const textColor = resolveText(spec);

  const productPng = spec.assets?.productImageUrl;
  const tilt = spec.effects?.tilt ?? 0;
  const shadowLevel = spec.effects?.shadow ?? 6;
  const outlineLevel = spec.effects?.textOutline ?? 2;

  const shadowPx = Math.round((shadowLevel / 10) * 18);
  const outlinePx = Math.round((outlineLevel / 10) * 4);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-muted/20">
      {/* BG */}
      {imageUrl ? (
        <img
          src={imageUrl}
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/10" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

      {/* Lighting (spotlight) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 420px at 70% 45%, rgba(255,255,255,0.12), rgba(255,255,255,0) 60%)",
          mixBlendMode: "screen",
          opacity: 0.9,
        }}
      />

      {/* Optional grid */}
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

      {/* Product PNG overlay */}
      {productPng ? (
        <div
          className="absolute right-10 bottom-0 top-0 flex items-end justify-end pointer-events-none"
          style={{
            transform: `rotate(${tilt}deg)`,
          }}
        >
          <img
            src={productPng}
            alt=""
            className="max-h-[92%] max-w-[46%] object-contain drop-shadow-2xl"
            style={{
              filter: `drop-shadow(0px ${Math.max(8, shadowPx)}px ${Math.max(
                18,
                shadowPx * 2
              )}px rgba(0,0,0,0.55))`,
            }}
          />
        </div>
      ) : null}

      {/* Content */}
      <div className="relative z-10 h-full w-full p-10 flex items-center">
        <div className="max-w-[56%] space-y-4">
          {badgeText ? (
            <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur">
              {badgeText}
            </span>
          ) : null}

          <div
            className="leading-[1.02] font-extrabold"
            style={{
              color: textColor,
              fontSize: "52px",
              textShadow:
                outlinePx > 0
                  ? `0 0 0 rgba(0,0,0,0), 0 0 0 rgba(0,0,0,0), 0 0 0 rgba(0,0,0,0), 0 0 0 rgba(0,0,0,0), 0px ${Math.max(
                      10,
                      shadowPx
                    )}px ${Math.max(18, shadowPx * 2)}px rgba(0,0,0,0.55)`
                  : `0px ${Math.max(10, shadowPx)}px ${Math.max(
                      18,
                      shadowPx * 2
                    )}px rgba(0,0,0,0.55)`,
              WebkitTextStroke:
                outlinePx > 0 ? `${outlinePx}px rgba(0,0,0,0.35)` : undefined,
            }}
          >
            {headline || "New Collection"}
          </div>

          <div className="text-white/85 text-lg max-w-[560px]">
            {subheadline || "Premium pieces, limited stock."}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span
              className="inline-flex items-center justify-center rounded-full px-5 h-11 text-black font-semibold text-sm shadow-sm"
              style={{
                background: accent,
              }}
            >
              {ctaText || "Shop now"}
            </span>

            {price ? (
              <span className="text-white/90 text-lg font-semibold">{price}</span>
            ) : null}
          </div>

          <div className="text-white/50 text-xs pt-3">
            © Your Brand — All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
}