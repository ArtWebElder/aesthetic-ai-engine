// src/features/editor/TemplateRenderer.tsx
import React from "react";
import type { ProjectSpec } from "@/types/spec";
import { TEMPLATE_CATALOG } from "@/features/editor/templates/registry";
import { resolveStyleVars } from "@/features/editor/style-resolver";
import TEcom01 from "@/features/editor/templates/ecom/ecom_01";

type Props = {
  spec: ProjectSpec;
  imageUrl?: string | null;
  showGrid?: boolean;
};

type Comp = (props: Props) => React.ReactElement;

function GridOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-20">
      <div className="absolute inset-0 [background-size:24px_24px] [background-image:linear-gradient(to_right,rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.12)_1px,transparent_1px)]" />
    </div>
  );
}

function FallbackTemplate({ spec, imageUrl, showGrid }: Props) {
  const vars = resolveStyleVars(spec);
  const tpl = TEMPLATE_CATALOG.find((item) => item.id === spec.templateId);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg" style={vars}>
      <div className="absolute inset-0">
        {imageUrl ? (
          <img src={imageUrl} className="h-full w-full object-cover" alt="" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted/30">
            <div className="text-xs text-muted-foreground">No image yet - template: {spec.templateId}</div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      {showGrid ? <GridOverlay /> : null}

      <div className="absolute inset-0 p-6 flex flex-col justify-end gap-2">
        <div className="text-[10px] uppercase tracking-wider text-white/70">{tpl?.name ?? "Template"}</div>
        <div className="text-white font-semibold leading-tight text-2xl md:text-3xl">
          {spec.content?.headline ?? ""}
        </div>
        {spec.content?.subheadline ? (
          <div className="text-white/85 text-sm md:text-base max-w-[70%]">{spec.content.subheadline}</div>
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

const TEMPLATE_COMPONENTS: Record<string, Comp> = {
  photo_01: FallbackTemplate,
  photo_02: FallbackTemplate,
  photo_03: FallbackTemplate,
  photo_04: FallbackTemplate,
  photo_05: FallbackTemplate,
  ecom_01: (props) => <TEcom01 spec={props.spec} imageUrl={props.imageUrl} showGrid={props.showGrid} />,
};

export default function TemplateRenderer(props: Props) {
  const id = props.spec.templateId ?? "photo_01";
  const Comp = TEMPLATE_COMPONENTS[id] ?? TEMPLATE_COMPONENTS["photo_01"];

  return (
    <div className="h-full w-full">
      <Comp {...props} />
    </div>
  );
}