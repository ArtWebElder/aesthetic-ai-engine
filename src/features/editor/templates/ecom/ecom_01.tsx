// src/features/editor/templates/ecom/ecom_01.tsx
import React from "react";
import type { TemplateRenderProps } from "@/features/editor/templates/types";

function isHex(s?: string) {
  if (!s) return false;
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(String(s).trim());
}

function fontFromPreset(p?: string) {
  switch (p) {
    case "space_grotesk":
      return `"Space Grotesk", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    case "plus_jakarta":
      return `"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    case "dm_sans":
      return `"DM Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    case "inter":
    default:
      return `"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
  }
}

export default function TEcom01({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const { headline, subheadline, ctaText, price, badgeText } = spec.content;

  const accent = isHex(spec.brand?.accent) ? spec.brand!.accent : "var(--mi-accent)";
  const textColor = isHex(spec.brand?.primary) ? spec.brand!.primary : "var(--mi-text)";

  const displayFont = fontFromPreset(spec.brand?.fontPreset);
  const bodyFont = fontFromPreset("plus_jakarta");

  const productPng = spec.assets?.productImageUrl;
  const tilt = spec.effects?.tilt ?? 0;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        borderRadius: "var(--mi-radius)",
        boxShadow: "var(--mi-shadow)",
        // tokens + overrides por spec
        ["--mi-accent" as any]: accent,
        ["--mi-text" as any]: textColor,
        ["--mi-font-display" as any]: displayFont,
        ["--mi-font-body" as any]: bodyFont,
      }}
    >
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
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--mi-overlay-from), var(--mi-overlay-via), var(--mi-overlay-to))",
        }}
      />

      {/* Lighting */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 420px at 70% 45%, rgba(255,255,255,0.12), rgba(255,255,255,0) 60%)",
          mixBlendMode: "screen",
          opacity: 0.9,
        }}
      />

      {/* Grid */}
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

      {/* Product PNG */}
      {productPng ? (
        <div
          className="absolute right-10 bottom-0 top-0 flex items-end justify-end pointer-events-none"
          style={{ transform: `rotate(${tilt}deg)` }}
        >
          <img
            src={productPng}
            alt=""
            className="max-h-[92%] max-w-[46%] object-contain"
            style={{
              filter: "drop-shadow(0px 18px 40px rgba(0,0,0,0.55))",
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
            style={{
              fontFamily: "var(--mi-font-display)",
              color: "var(--mi-text)",
              fontSize: "var(--mi-h1-size)",
              fontWeight: 800,
              lineHeight: 1.02,
              textShadow: "0px 18px 40px rgba(0,0,0,0.55)",
            }}
          >
            {headline || "New Collection"}
          </div>

          <div
            style={{
              fontFamily: "var(--mi-font-body)",
              color: "var(--mi-muted)",
              fontSize: "var(--mi-sub-size)",
              maxWidth: 560,
            }}
          >
            {subheadline || "Premium pieces, limited stock."}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span
              className="inline-flex items-center justify-center rounded-full px-5 h-11 text-black font-semibold text-sm shadow-sm"
              style={{
                background: "var(--mi-accent)",
              }}
            >
              {ctaText || "Shop now"}
            </span>

            {price ? (
              <span
                style={{
                  fontFamily: "var(--mi-font-display)",
                  color: "rgba(255,255,255,.90)",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {price}
              </span>
            ) : null}
          </div>

          <div
            style={{
              fontFamily: "var(--mi-font-body)",
              color: "rgba(255,255,255,.45)",
              fontSize: 12,
              paddingTop: 12,
            }}
          >
            © Your Brand — All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
}