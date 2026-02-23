import React from "react";
import type { TemplateRenderProps } from "@/features/editor/templates/types";
import { resolveCanvasTokens } from "@/features/editor/design/resolveTokens";

export default function TEcom01({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const { headline, subheadline, ctaText, price, badgeText } = spec.content;
  const vars = resolveCanvasTokens(spec);

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-2xl bg-muted/20"
      style={vars as React.CSSProperties}
    >
      {/* BG */}
      {imageUrl ? (
        <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/10" />
      )}

      {/* Overlay (tokens) */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, var(--mi-overlay-from), var(--mi-overlay-via), var(--mi-overlay-to))`,
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

      {/* Content */}
      <div className="relative z-10 h-full w-full p-10 flex items-center">
        <div className="max-w-[58%] space-y-4">
          {badgeText ? (
            <span
              className="inline-flex items-center text-[11px] px-2 py-1 rounded-full backdrop-blur"
              style={{
                border: `1px solid var(--mi-badge-border)`,
                background: `var(--mi-badge-bg)`,
                color: `color-mix(in srgb, var(--mi-text) 80%, transparent)`,
                fontFamily: "var(--mi-font-body)",
              }}
            >
              {badgeText}
            </span>
          ) : null}

          <div
            className="leading-[1.02]"
            style={{
              color: "var(--mi-text)",
              fontFamily: "var(--mi-font-display)",
              fontWeight: "var(--mi-title-weight)" as any,
              letterSpacing: "var(--mi-title-tracking)",
              textShadow: "var(--mi-title-shadow)",
              fontSize: "clamp(28px, 3.6vw, 52px)",
            }}
          >
            {headline || "New Collection"}
          </div>

          <div
            style={{
              color: "color-mix(in srgb, var(--mi-text) 86%, transparent)",
              opacity: "var(--mi-sub-opacity)" as any,
              fontFamily: "var(--mi-font-body)",
              fontSize: "clamp(14px, 1.4vw, 18px)",
              maxWidth: 560,
            }}
          >
            {subheadline || "Premium pieces, limited stock."}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span
              className="inline-flex items-center justify-center rounded-full px-5 h-11 text-sm font-medium"
              style={{
                background: "var(--mi-cta-bg)",
                color: "var(--mi-cta-text)",
                boxShadow: "0 14px 40px rgba(0,0,0,.30)",
                fontFamily: "var(--mi-font-body)",
              }}
            >
              {ctaText || "Shop now"}
            </span>

            {price ? (
              <span
                style={{
                  color: "color-mix(in srgb, var(--mi-text) 90%, transparent)",
                  fontFamily: "var(--mi-font-body)",
                  fontWeight: 700,
                }}
              >
                {price}
              </span>
            ) : null}
          </div>

          <div
            className="text-xs pt-3"
            style={{
              color: "color-mix(in srgb, var(--mi-text) 55%, transparent)",
              fontFamily: "var(--mi-font-body)",
            }}
          >
            © Your Brand — All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
}