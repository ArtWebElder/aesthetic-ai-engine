import React from "react";
import type { ProjectSpec } from "@/types/spec";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getSize(spec: ProjectSpec) {
  const w = spec.generation?.width ?? 1080;
  const h = spec.generation?.height ?? 1080;
  return { w, h };
}

function scaleToFit(w: number, h: number, maxW: number, maxH: number) {
  const s = Math.min(maxW / w, maxH / h);
  return clamp(s, 0.2, 1);
}

export default function CanvasPreview({
  spec,
  maxW = 900,
  maxH = 560,
}: {
  spec: ProjectSpec;
  maxW?: number;
  maxH?: number;
}) {
  const { w, h } = getSize(spec);
  const s = scaleToFit(w, h, maxW, maxH);

  const primary = spec.brand?.primary ?? "#7c3aed";
  const accent = spec.brand?.accent ?? "#22c55e";

  const headline = spec.content?.headline || "Your Headline Here";
  const sub = spec.content?.subheadline || "Subheadline / supporting copy goes here.";
  const cta = spec.content?.ctaText || "Learn more";

  const safePad = Math.round(Math.min(w, h) * 0.08);

  const bg =
    spec.stylePreset === "bold_ads"
      ? `linear-gradient(135deg, ${primary}, #111827)`
      : spec.stylePreset === "minimal_clean"
      ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
      : "radial-gradient(800px 500px at 20% 15%, rgba(255,255,255,0.14), transparent 55%), radial-gradient(700px 500px at 80% 70%, rgba(255,255,255,0.10), transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))";

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div style={{ width: Math.round(w * s), height: Math.round(h * s) }}>
        <div
          style={{
            width: w,
            height: h,
            transform: `scale(${s})`,
            transformOrigin: "top left",
            borderRadius: 20,
            overflow: "hidden",
            position: "relative",
            background: bg,
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {/* blobs */}
          <div
            style={{
              position: "absolute",
              inset: -140,
              background: `radial-gradient(closest-side at 30% 25%, ${primary}55, transparent 60%),
                           radial-gradient(closest-side at 80% 70%, ${accent}44, transparent 62%)`,
              filter: "blur(10px)",
              opacity: 0.8,
            }}
          />

          {/* content */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: safePad,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              />
              <div style={{ fontSize: 16, opacity: 0.85 }}>Magic Idea</div>
            </div>

            <div style={{ maxWidth: Math.round(w * 0.82) }}>
              <div
                style={{
                  fontSize: Math.round(w * 0.075),
                  lineHeight: 1.05,
                  fontWeight: 800,
                  letterSpacing: -1,
                }}
              >
                {headline}
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontSize: Math.round(w * 0.032),
                  opacity: 0.82,
                  lineHeight: 1.25,
                }}
              >
                {sub}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: `${Math.round(w * 0.02)}px ${Math.round(w * 0.04)}px`,
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.28)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  backdropFilter: "blur(10px)",
                  fontWeight: 700,
                  fontSize: Math.round(w * 0.028),
                }}
              >
                {cta}
              </div>

              <div style={{ fontSize: Math.round(w * 0.022), opacity: 0.7 }}>
                {spec.module === "ecom_banner" ? "Limited offer" : "Swipe up"}
              </div>
            </div>
          </div>

          {/* grid leve */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: 0.10,
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px)",
              backgroundSize: `${Math.round(w / 12)}px ${Math.round(h / 12)}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
