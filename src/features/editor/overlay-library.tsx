// src/features/editor/overlay-library.tsx
// Biblioteca de overlays visuais CSS/SVG que se compõem sobre o preview da imagem gerada.
// Cada overlay é ativado automaticamente quando o scene prop correspondente está selecionado.
// A IA gera o FUNDO — os overlays são compostos em cima, no canvas do browser.

import React from "react";

export interface SceneOverlay {
  /** ID único do overlay */
  id: string;
  /** Qual scene prop ativa este overlay */
  scenePropId: string;
  /** Rótulo exibido ao usuário */
  label: string;
  /** Intensidade padrão (0–1) */
  defaultOpacity: number;
  /** Renderiza o elemento visual */
  render: (opacity: number) => React.ReactElement;
}

// ─── Overlays ─────────────────────────────────────────────────────────────────

const OVERLAY_DEFINITIONS: SceneOverlay[] = [
  // ── Fragmentos de vidro flutuando ──────────────────────────────────────────
  {
    id: "floating_glass_shards",
    scenePropId: "floating_elements",
    label: "Fragmentos de vidro",
    defaultOpacity: 0.75,
    render: (opacity) => (
      <div
        key="floating_glass_shards"
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 600"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="glass-blur">
              <feGaussianBlur stdDeviation="0.4" />
            </filter>
          </defs>
          {/* Shard 1 — grande, canto superior esquerdo */}
          <polygon
            points="60,95 140,70 165,145 80,165"
            fill="rgba(255,255,255,0.10)"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="0.7"
            filter="url(#glass-blur)"
          />
          {/* Especular shard 1 */}
          <line x1="140" y1="70" x2="165" y2="145" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />

          {/* Shard 2 — médio, canto superior direito */}
          <polygon
            points="275,45 340,30 360,95 298,108"
            fill="rgba(255,255,255,0.07)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.7"
          />
          <line x1="340" y1="30" x2="360" y2="95" stroke="rgba(255,255,255,0.6)" strokeWidth="0.4" />

          {/* Shard 3 — pequeno, meio direito */}
          <polygon
            points="330,240 375,225 385,275 342,285"
            fill="rgba(255,255,255,0.09)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.6"
          />

          {/* Shard 4 — muito pequeno, esquerda */}
          <polygon
            points="40,340 72,325 80,362 50,375"
            fill="rgba(255,255,255,0.13)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.6"
          />
          <line x1="72" y1="325" x2="80" y2="362" stroke="rgba(255,255,255,0.65)" strokeWidth="0.4" />

          {/* Shard 5 — médio baixo */}
          <polygon
            points="200,480 255,460 268,510 215,525"
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="0.6"
          />

          {/* Reflexo de luz — linha diagonal */}
          <line x1="150" y1="200" x2="250" y2="180" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        </svg>
      </div>
    ),
  },

  // ── Luzes bokeh desfocadas ─────────────────────────────────────────────────
  {
    id: "bokeh_orbs",
    scenePropId: "bokeh_lights",
    label: "Luzes bokeh",
    defaultOpacity: 0.8,
    render: (opacity) => (
      <div
        key="bokeh_orbs"
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity, mixBlendMode: "screen" }}
      >
        {/* Orb grande — dourado, topo esquerdo */}
        <div
          className="absolute rounded-full"
          style={{
            width: "28%",
            height: "28%",
            top: "5%",
            left: "8%",
            background: "radial-gradient(circle, rgba(255,215,100,0.45) 0%, rgba(255,180,50,0.15) 45%, transparent 70%)",
            filter: "blur(18px)",
          }}
        />
        {/* Orb médio — azul frio, topo direito */}
        <div
          className="absolute rounded-full"
          style={{
            width: "22%",
            height: "22%",
            top: "3%",
            right: "12%",
            background: "radial-gradient(circle, rgba(180,210,255,0.4) 0%, rgba(150,190,255,0.12) 45%, transparent 70%)",
            filter: "blur(22px)",
          }}
        />
        {/* Orb pequeno — lilás, meio */}
        <div
          className="absolute rounded-full"
          style={{
            width: "14%",
            height: "14%",
            top: "45%",
            right: "18%",
            background: "radial-gradient(circle, rgba(200,160,255,0.35) 0%, transparent 65%)",
            filter: "blur(14px)",
          }}
        />
        {/* Orb pequeno — azul claro, esquerda baixo */}
        <div
          className="absolute rounded-full"
          style={{
            width: "12%",
            height: "12%",
            bottom: "25%",
            left: "20%",
            background: "radial-gradient(circle, rgba(130,200,255,0.4) 0%, transparent 65%)",
            filter: "blur(12px)",
          }}
        />
        {/* Orb minúsculo — branco, disperso */}
        <div
          className="absolute rounded-full"
          style={{
            width: "7%",
            height: "7%",
            top: "30%",
            left: "55%",
            background: "radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 65%)",
            filter: "blur(8px)",
          }}
        />
      </div>
    ),
  },

  // ── Névoa e fumaça ────────────────────────────────────────────────────────
  {
    id: "smoke_fog",
    scenePropId: "smoke_haze",
    label: "Névoa e fumaça",
    defaultOpacity: 0.55,
    render: (opacity) => (
      <div
        key="smoke_fog"
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity }}
      >
        {/* Camada base — gradiente ascendente suave */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(210,215,230,0.18) 0%, rgba(210,215,230,0.06) 35%, transparent 60%)",
          }}
        />
        {/* Nuvem de névoa — elipse esquerda */}
        <div
          className="absolute"
          style={{
            bottom: "10%",
            left: "-10%",
            width: "60%",
            height: "35%",
            background:
              "radial-gradient(ellipse 70% 50% at 40% 80%, rgba(220,225,240,0.22) 0%, transparent 65%)",
            filter: "blur(30px)",
          }}
        />
        {/* Nuvem de névoa — elipse direita */}
        <div
          className="absolute"
          style={{
            bottom: "5%",
            right: "-5%",
            width: "50%",
            height: "30%",
            background:
              "radial-gradient(ellipse 65% 50% at 60% 80%, rgba(215,220,235,0.18) 0%, transparent 65%)",
            filter: "blur(25px)",
          }}
        />
      </div>
    ),
  },

  // ── Brilho neon ───────────────────────────────────────────────────────────
  {
    id: "neon_glow_effect",
    scenePropId: "neon_glow",
    label: "Brilho neon",
    defaultOpacity: 0.65,
    render: (opacity) => (
      <div
        key="neon_glow_effect"
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity, mixBlendMode: "screen" }}
      >
        {/* Glow principal — gradiente arco-íris no fundo */}
        <div
          className="absolute"
          style={{
            bottom: "-15%",
            left: "5%",
            right: "5%",
            height: "55%",
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(0,210,255,0.28) 0%, rgba(120,0,255,0.14) 35%, rgba(255,0,140,0.08) 60%, transparent 75%)",
            filter: "blur(35px)",
          }}
        />
        {/* Linha de luz horizontal topo — cyan */}
        <div
          className="absolute"
          style={{
            top: "0",
            left: "10%",
            right: "10%",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, rgba(0,210,255,0.7), rgba(120,0,255,0.5), transparent)",
            filter: "blur(1.5px)",
          }}
        />
        {/* Reflexo lateral esquerdo — magenta */}
        <div
          className="absolute"
          style={{
            top: "20%",
            left: "-5%",
            width: "25%",
            height: "40%",
            background:
              "radial-gradient(ellipse at 0% 50%, rgba(255,0,140,0.18) 0%, transparent 65%)",
            filter: "blur(20px)",
          }}
        />
      </div>
    ),
  },

  // ── Superfície refletiva ──────────────────────────────────────────────────
  {
    id: "reflection_floor",
    scenePropId: "reflection_surface",
    label: "Reflexo no chão",
    defaultOpacity: 0.5,
    render: (opacity) => (
      <div
        key="reflection_floor"
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity }}
      >
        {/* Reflexo gradiente — parte inferior */}
        <div
          className="absolute"
          style={{
            bottom: 0,
            left: 0,
            right: 0,
            height: "32%",
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.1) 100%)",
          }}
        />
        {/* Linha de separação chão/reflexo */}
        <div
          className="absolute"
          style={{
            bottom: "31%",
            left: "5%",
            right: "5%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
          }}
        />
        {/* Shimmer lateral */}
        <div
          className="absolute"
          style={{
            bottom: "0",
            left: "20%",
            width: "60%",
            height: "20%",
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.12) 0%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
      </div>
    ),
  },

  // ── Sombra suave no chão ───────────────────────────────────────────────────
  {
    id: "soft_ground_shadow",
    scenePropId: "soft_shadow",
    label: "Sombra suave",
    defaultOpacity: 0.6,
    render: (opacity) => (
      <div
        key="soft_ground_shadow"
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ opacity }}
      >
        {/* Elipse de sombra centralizada na base */}
        <div
          className="absolute"
          style={{
            bottom: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "55%",
            height: "15%",
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.35) 0%, transparent 65%)",
            filter: "blur(18px)",
          }}
        />
      </div>
    ),
  },
];

// ─── API pública ──────────────────────────────────────────────────────────────

/** Retorna os overlays que correspondem aos scene props selecionados. */
export function getOverlaysForSceneProps(sceneProps: string[]): SceneOverlay[] {
  return OVERLAY_DEFINITIONS.filter((o) => sceneProps.includes(o.scenePropId));
}

/** Renderiza todos os overlays ativos empilhados. */
export function renderSceneOverlays(
  sceneProps: string[],
  opacityMultiplier = 1
): React.ReactElement | null {
  const active = getOverlaysForSceneProps(sceneProps);
  if (active.length === 0) return null;
  return (
    <>
      {active.map((overlay) =>
        overlay.render(overlay.defaultOpacity * opacityMultiplier)
      )}
    </>
  );
}

export { OVERLAY_DEFINITIONS };

// ─── Canvas 2D draw functions (para export 2K) ────────────────────────────────
// Espelham os overlays CSS/SVG acima usando apenas a Canvas 2D API.
// Usadas em exportSocialPost2K para que o PNG baixado inclua os mesmos efeitos.

function drawFloatingGlass(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  // Shards escalados proporcionalmente ao canvas (viewBox original 400×600)
  const sx = w / 400;
  const sy = h / 600;

  const shards: [number, number][][] = [
    [[60, 95], [140, 70], [165, 145], [80, 165]],
    [[275, 45], [340, 30], [360, 95], [298, 108]],
    [[330, 240], [375, 225], [385, 275], [342, 285]],
    [[40, 340], [72, 325], [80, 362], [50, 375]],
    [[200, 480], [255, 460], [268, 510], [215, 525]],
  ];

  for (const pts of shards) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * sx, pts[0][1] * sy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * sx, pts[i][1] * sy);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.38)";
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // Linhas especulares
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(140 * sx, 70 * sy); ctx.lineTo(165 * sx, 145 * sy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(340 * sx, 30 * sy); ctx.lineTo(360 * sx, 95 * sy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(72 * sx, 325 * sy); ctx.lineTo(80 * sx, 362 * sy); ctx.stroke();

  ctx.restore();
}

function drawBokehOrbs(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const orbs: [number, number, number, string][] = [
    [w * 0.08 + w * 0.14, h * 0.05 + h * 0.14, w * 0.14, "rgba(255,215,100,0.42)"],
    [w * 0.78 + w * 0.11, h * 0.03 + h * 0.11, w * 0.11, "rgba(180,210,255,0.38)"],
    [w * 0.6 + w * 0.07, h * 0.45 + h * 0.07, w * 0.07, "rgba(200,160,255,0.32)"],
    [w * 0.2 + w * 0.06, h * 0.75 + h * 0.06, w * 0.06, "rgba(130,200,255,0.38)"],
    [w * 0.55 + w * 0.035, h * 0.3 + h * 0.035, w * 0.035, "rgba(255,255,255,0.45)"],
  ];

  for (const [cx, cy, r, color] of orbs) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSmokeFog(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.globalAlpha = 0.55;

  // Camada base — gradiente ascendente
  const base = ctx.createLinearGradient(0, h, 0, h * 0.4);
  base.addColorStop(0, "rgba(210,215,230,0.18)");
  base.addColorStop(1, "rgba(210,215,230,0)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Elipse esquerda
  const left = ctx.createRadialGradient(w * 0.3, h * 0.85, 0, w * 0.3, h * 0.85, w * 0.35);
  left.addColorStop(0, "rgba(220,225,240,0.22)");
  left.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, w, h);

  // Elipse direita
  const right = ctx.createRadialGradient(w * 0.75, h * 0.9, 0, w * 0.75, h * 0.9, w * 0.3);
  right.addColorStop(0, "rgba(215,220,235,0.18)");
  right.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = right;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

function drawNeonGlow(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.65;

  // Glow principal — arco-íris na base
  const main = ctx.createRadialGradient(w * 0.5, h * 1.2, 0, w * 0.5, h * 1.2, h * 0.9);
  main.addColorStop(0, "rgba(0,210,255,0.28)");
  main.addColorStop(0.35, "rgba(120,0,255,0.14)");
  main.addColorStop(0.65, "rgba(255,0,140,0.08)");
  main.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, w, h);

  // Linha topo — cyan
  ctx.globalAlpha = 0.65;
  const top = ctx.createLinearGradient(w * 0.1, 0, w * 0.9, 0);
  top.addColorStop(0, "rgba(0,0,0,0)");
  top.addColorStop(0.35, "rgba(0,210,255,0.7)");
  top.addColorStop(0.65, "rgba(120,0,255,0.5)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(w * 0.1, 0, w * 0.8, 3);

  // Reflexo lateral esquerdo — magenta
  const left = ctx.createRadialGradient(0, h * 0.4, 0, 0, h * 0.4, w * 0.25);
  left.addColorStop(0, "rgba(255,0,140,0.18)");
  left.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

function drawReflection(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.globalAlpha = 0.5;

  // Gradiente de reflexo — parte inferior
  const grad = ctx.createLinearGradient(0, h * 0.68, 0, h);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.04)");
  grad.addColorStop(1, "rgba(255,255,255,0.1)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);

  // Linha de separação chão/reflexo
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.05, h * 0.69);
  ctx.lineTo(w * 0.95, h * 0.69);
  ctx.stroke();

  // Shimmer central
  const shimmer = ctx.createRadialGradient(w * 0.5, h, 0, w * 0.5, h, w * 0.35);
  shimmer.addColorStop(0, "rgba(255,255,255,0.12)");
  shimmer.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shimmer;
  ctx.fillRect(0, h * 0.75, w, h * 0.25);

  ctx.restore();
}

function drawSoftShadow(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.save();
  ctx.globalAlpha = 0.6;

  const cx = w * 0.5;
  const cy = h * 0.92;
  const rx = w * 0.28;
  const ry = h * 0.07;

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  g.addColorStop(0, "rgba(0,0,0,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");

  ctx.scale(1, ry / rx); // achatar em elipse
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy * (rx / ry), rx, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Aplica os overlays de scene props diretamente no CanvasRenderingContext2D.
 * Chamada no exportSocialPost2K para que o PNG exportado inclua os mesmos efeitos
 * que aparecem no preview HTML.
 */
export function drawOverlaysOnCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sceneProps: string[]
): void {
  for (const prop of sceneProps) {
    if (prop === "floating_elements") drawFloatingGlass(ctx, w, h);
    if (prop === "bokeh_lights")      drawBokehOrbs(ctx, w, h);
    if (prop === "smoke_haze")        drawSmokeFog(ctx, w, h);
    if (prop === "neon_glow")         drawNeonGlow(ctx, w, h);
    if (prop === "reflection_surface") drawReflection(ctx, w, h);
    if (prop === "soft_shadow")       drawSoftShadow(ctx, w, h);
  }
}
