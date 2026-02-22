// src/features/editor/TemplateRenderer.tsx
import React from "react";
import { TEMPLATE_CATALOG } from "@/features/editor/templates/registry";
import type { ProjectSpec } from "@/types/spec";

type Props = {
  spec: ProjectSpec;
  imageUrl?: string;
  showGrid?: boolean;
};

function GridOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-20">
      <div className="absolute inset-0 [background-size:24px_24px] [background-image:linear-gradient(to_right,rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.12)_1px,transparent_1px)]" />
    </div>
  );
}

export default function TemplateRenderer({ spec, imageUrl, showGrid }: Props) {
  const tpl = TEMPLATE_CATALOG.find((t) => t.id === spec.templateId);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      {showGrid ? <GridOverlay /> : null}

      {/* Se seu template registry tiver um renderer, use aqui */}
      {tpl && (tpl as any).render ? (
        <div className="absolute inset-0">
          {(tpl as any).render({ spec, imageUrl })}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} className="h-full w-full object-cover" alt="" />
          ) : (
            <div className="text-xs text-muted-foreground">
              No image yet • template: {spec.templateId}
            </div>
          )}
        </div>
      )}
    </div>
  );
}