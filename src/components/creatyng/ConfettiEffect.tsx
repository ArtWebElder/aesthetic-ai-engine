import { useEffect, useRef } from 'react';

const COLORS = [
  'hsl(var(--brand))', 'hsl(var(--brand-2))', '#7C3AED', '#06B6D4',
  '#10B981', '#F472B6', '#FFF0EA', '#fbbf24',
];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vr: number;
  color: string;
  w: number;
  h: number;
  opacity: number;
}

interface ConfettiEffectProps {
  active: boolean;
  onComplete?: () => void;
  count?: number;
  duration?: number;
}

export function ConfettiEffect({
  active,
  onComplete,
  count = 60,
  duration = 3000,
}: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;

    const pieces: Piece[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 60,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      vr: (Math.random() - 0.5) * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      opacity: 1,
    }));

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        p.rotation += p.vr;
        p.opacity = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, count, duration, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[99999] pointer-events-none"
    />
  );
}

export default ConfettiEffect;
