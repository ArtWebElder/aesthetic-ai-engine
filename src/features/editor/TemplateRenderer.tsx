// src/features/editor/TemplateRenderer.tsx
import React from "react";
import type { ProjectSpec } from "@/types/spec";
import { TEMPLATE_CATALOG } from "@/features/editor/templates/registry";

// ✅ E-com template(s)
import TEcom01 from "@/features/editor/templates/ecom/ecom_01";

type Props = {
  spec: ProjectSpec;
  imageUrl?: string | null;
  showGrid?: boolean;
};

function GridOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-20">
      <div className="absolute inset-0 [background-size:24px_24px] [background-image:linear-gradient(to_right,rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.12)_1px,transparent_1px)]" />
    </div>
  );
}

/**
 * ✅ TEMPLATE ROUTER
 * - ecom_01 já usa renderer próprio (HTML/CSS real)
 * - outros templates ainda usam fallback simples (até criarmos os demais)
 */
function renderByTemplateId(spec: ProjectSpec, imageUrl?: string | null, showGrid?: boolean) {
  switch (spec.templateId) {
    // ✅ ECOM
    case "ecom_01":
      return <TEcom01 spec={spec} imageUrl={imageUrl} showGrid={showGrid} />;

    // (depois vamos adicionar: ecom_02, ecom_03, ecom_04...)

    default:
      return <FallbackTemplate spec={spec} imageUrl={imageUrl} showGrid={showGrid} />;
  }
}

function FallbackTemplate({
  spec,
  imageUrl,
  showGrid,
}: {
  spec: ProjectSpec;
  imageUrl?: string | null;
  showGrid?: boolean;
}) {
  const tpl = TEMPLATE_CATALOG.find((t) => t.id === spec.templateId);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      {/* base image */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <img src={imageUrl} className="h-full w-full object-cover" alt="" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted/30">
            <div className="text-xs text-muted-foreground">
              No image yet • template: {spec.templateId}
            </div>
          </div>
        )}
      </div>

      {/* subtle overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

      {/* grid */}
      {showGrid ? <GridOverlay /> : null}

      {/* text layer (simple fallback) */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end gap-2">
        <div className="text-[10px] uppercase tracking-wider text-white/70">
          {tpl?.name ?? "Template"}
        </div>

        <div className="text-white font-semibold leading-tight text-2xl md:text-3xl">
          {spec.content?.headline ?? ""}
        </div>

        {spec.content?.subheadline ? (
          <div className="text-white/85 text-sm md:text-base max-w-[70%]">
            {spec.content.subheadline}
          </div>
        ) : null}

        {spec.content?.ctaText ? (
          <div className="pt-2">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur">
              {spec.content.ctaText}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TemplateRenderer({ spec, imageUrl, showGrid }: Props) {
  return (
    <div className="h-full w-full">
      {renderByTemplateId(spec, imageUrl, showGrid)}
    </div>
  );
}