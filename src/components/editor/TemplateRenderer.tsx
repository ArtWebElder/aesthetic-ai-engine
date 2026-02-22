// src/features/editor/TemplateRenderer.tsx
import type { TemplateRenderProps, TemplateId } from "@/features/editor/templates/types";

function GridOverlay({ showGrid }: { showGrid?: boolean }) {
  if (!showGrid) return null;
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-35"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.10) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />
  );
}

function CanvasBase({
  imageUrl,
  showGrid,
  children,
}: {
  imageUrl?: string | null;
  showGrid?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-muted/20">
      {/* background */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Generated"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted/40 to-muted/10" />
      )}

      {/* subtle dark overlay for readability */}
      <div className="absolute inset-0 bg-black/20" />

      <GridOverlay showGrid={showGrid} />

      {/* content layer */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-[11px] px-2 py-1 rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur">
      {children}
    </span>
  );
}

function CTA({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center justify-center rounded-full px-4 h-10 bg-emerald-400 text-black font-medium text-sm shadow-sm">
      {text || "Learn more"}
    </div>
  );
}

/** TEMPLATE 01 — Bold Typography */
function TPhoto01({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const { headline, subheadline, ctaText } = spec.content;

  return (
    <CanvasBase imageUrl={imageUrl} showGrid={showGrid}>
      <div className="absolute inset-0 p-10 flex items-end">
        <div className="max-w-[70%] space-y-3">
          <Badge>Bold Typography</Badge>
          <div className="text-white">
            <div className="text-5xl font-heading font-bold leading-[1.02] drop-shadow">
              {headline || "Your Next Big Win"}
            </div>
            <div className="mt-2 text-white/85 text-lg max-w-[560px]">
              {subheadline || "Ultra-clean, studio-grade outputs."}
            </div>
          </div>
          <div className="pt-2">
            <CTA text={ctaText || "Learn more"} />
          </div>
        </div>
      </div>
    </CanvasBase>
  );
}

/** TEMPLATE 02 — Product Spotlight */
function TPhoto02({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const { headline, subheadline, ctaText } = spec.content;

  return (
    <CanvasBase imageUrl={imageUrl} showGrid={showGrid}>
      <div className="absolute inset-0 p-10 grid grid-cols-12 gap-6 items-center">
        <div className="col-span-7">
          <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur p-6">
            <Badge>Product Spotlight</Badge>
            <div className="mt-3 text-4xl font-heading font-bold text-white leading-tight">
              {headline || "Focus on the hero."}
            </div>
            <div className="mt-2 text-white/80">
              {subheadline || "Minimal layout, premium feel."}
            </div>
            <div className="mt-4">
              <CTA text={ctaText || "Shop now"} />
            </div>
          </div>
        </div>
        <div className="col-span-5" />
      </div>
    </CanvasBase>
  );
}

/** TEMPLATE 03 — Gradient Overlay */
function TPhoto03({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const { headline, subheadline, ctaText } = spec.content;

  return (
    <CanvasBase imageUrl={imageUrl} showGrid={showGrid}>
      {/* gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/65 via-black/10 to-emerald-500/25" />
      <div className="absolute inset-0 p-10 flex items-start">
        <div className="max-w-[62%] space-y-3">
          <Badge>Gradient Overlay</Badge>
          <div className="text-white text-5xl font-heading font-bold leading-[1.02]">
            {headline || "Make it pop."}
          </div>
          <div className="text-white/85 text-lg max-w-[560px]">
            {subheadline || "Gradient depth + readable overlay."}
          </div>
          <div className="pt-2">
            <CTA text={ctaText || "Explore"} />
          </div>
        </div>
      </div>
    </CanvasBase>
  );
}

/** TEMPLATE 04 — Minimal Card */
function TPhoto04({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const { headline, subheadline, ctaText } = spec.content;

  return (
    <CanvasBase imageUrl={imageUrl} showGrid={showGrid}>
      <div className="absolute inset-0 p-10 flex items-end justify-end">
        <div className="w-[420px] rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
          <Badge>Minimal Card</Badge>
          <div className="mt-3 text-white text-3xl font-heading font-bold leading-tight">
            {headline || "Minimal sells."}
          </div>
          <div className="mt-2 text-white/80">
            {subheadline || "Clean card, strong CTA."}
          </div>
          <div className="mt-4">
            <CTA text={ctaText || "Get it"} />
          </div>
        </div>
      </div>
    </CanvasBase>
  );
}

/** TEMPLATE 05 — Story Impact */
function TPhoto05({ spec, imageUrl, showGrid }: TemplateRenderProps) {
  const { headline, subheadline, ctaText } = spec.content;

  return (
    <CanvasBase imageUrl={imageUrl} showGrid={showGrid}>
      <div className="absolute inset-0 p-10 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <Badge>Story Impact</Badge>
          <Badge>{spec.format}</Badge>
        </div>

        <div className="space-y-3 max-w-[70%]">
          <div className="text-white text-5xl font-heading font-extrabold leading-[1.02]">
            {headline || "Stop the scroll."}
          </div>
          <div className="text-white/85 text-lg">
            {subheadline || "High contrast, punchy structure."}
          </div>
          <div className="pt-2">
            <CTA text={ctaText || "Tap"} />
          </div>
        </div>
      </div>
    </CanvasBase>
  );
}

const TEMPLATE_COMPONENTS: Record<TemplateId, (p: TemplateRenderProps) => JSX.Element> = {
  photo_01: TPhoto01,
  photo_02: TPhoto02,
  photo_03: TPhoto03,
  photo_04: TPhoto04,
  photo_05: TPhoto05,
};

export default function TemplateRenderer(props: TemplateRenderProps) {
  const id = (props.spec.templateId as TemplateId) || "photo_01";
  const Comp = TEMPLATE_COMPONENTS[id] ?? TEMPLATE_COMPONENTS.photo_01;
  return <Comp {...props} />;
}