import React from "react";
import type { TemplateRenderProps } from "@/features/editor/templates/types";
import { useI18n } from "@/i18n";

export default function TEcom01({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const { t } = useI18n();
  const { headline, subheadline, ctaText, price, badgeText } = spec.content;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl">
      {/* BG */}
      {imageUrl ? (
        <img src={imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
      ) : (
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,0))" }} />
      )}

      {/* Overlay via tokens */}
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
        <div className="max-w-[56%] space-y-4">
          {badgeText ? (
            <span
              className="inline-flex items-center text-[11px] px-2 py-1 rounded-full border backdrop-blur"
              style={{
                borderColor: "var(--mi-card-border)",
                background: "var(--mi-card-bg)",
                color: "rgba(255,255,255,.85)",
              }}
            >
              {badgeText}
            </span>
          ) : null}

          <div
            className="leading-[1.02]"
            style={{
              fontFamily: "var(--mi-font-display)",
              color: "var(--mi-text)",
              fontSize: "var(--mi-h1-size)",
              fontWeight: 800,
              textShadow: "var(--mi-title-shadow)",
            }}
          >
            {headline || t("editor.template.ecom_01.default_headline")}
          </div>

          <div
            style={{
              fontFamily: "var(--mi-font-body)",
              color: "rgba(255,255,255,var(--mi-sub-opacity))",
              fontSize: "var(--mi-sub-size)",
              maxWidth: 560,
            }}
          >
            {subheadline || t("editor.template.ecom_01.default_subheadline")}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span
              className="inline-flex items-center justify-center rounded-full px-5 h-11 font-medium text-sm"
              style={{
                background: "var(--mi-cta-bg)",
                color: "var(--mi-cta-text)",
                border: "1px solid var(--mi-cta-border)",
                boxShadow: "var(--mi-cta-glow)",
                fontFamily: "var(--mi-font-body)",
              }}
            >
              {ctaText || t("editor.template.ecom_01.default_cta")}
            </span>

            {price ? (
              <span
                style={{
                  color: "rgba(255,255,255,.86)",
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "var(--mi-font-body)",
                }}
              >
                {price}
              </span>
            ) : null}
          </div>

          <div style={{ color: "rgba(255,255,255,.45)", fontSize: 12, paddingTop: 12 }}>
            {t("editor.template.ecom_01.footer")}
          </div>
        </div>
      </div>
    </div>
  );
}
