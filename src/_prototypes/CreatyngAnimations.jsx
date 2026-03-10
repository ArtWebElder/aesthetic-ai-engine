import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  success: "#10B981", purple: "#7C3AED", cyan: "#06B6D4",
};

const Ico = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoSparkle = (p) => <Ico {...p}><path d="M12 2l2 6.5L20.5 10l-6.5 2L12 18.5 10 12l-6.5-2L10 8.5z" fill="currentColor" stroke="none"/></Ico>;
const IcoArrowR = (p) => <Ico size={16} {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Ico>;
const IcoDownload = (p) => <Ico size={16} {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Ico>;
const IcoPlus = (p) => <Ico size={16} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Ico>;
const IcoZap = (p) => <Ico size={16} {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={C.accent} stroke={C.accent}/></Ico>;
const IcoPlay = (p) => <Ico size={14} {...p}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/></Ico>;
const IcoRefresh = (p) => <Ico size={16} {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></Ico>;

/* ─── MAGNETIC BUTTON ─── */
function MagneticButton({ children, style: s }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.25;
    const dy = (e.clientY - cy) * 0.25;
    setOffset({ x: dx, y: dy });
  };
  const onLeave = () => setOffset({ x: 0, y: 0 });

  return (
    <button ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{
      ...s, transform: `translate(${offset.x}px, ${offset.y}px)`,
      transition: offset.x === 0 ? "transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1)" : "transform 80ms ease-out",
    }}>{children}</button>
  );
}

/* ─── ANIMATED COUNTER ─── */
function AnimCounter({ target, prefix = "", suffix = "", color = C.text1, size = 32, duration = 1500 }) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { setStarted(true); } }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return (
    <span ref={ref} style={{ fontSize: size, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
      {prefix}{value.toLocaleString("pt-BR")}{suffix}
    </span>
  );
}

/* ─── SKELETON TO CONTENT ─── */
function SkeletonTransition() {
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);

  const reset = () => { setLoaded(false); setKey(k => k + 1); setTimeout(() => setLoaded(true), 2000); };

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 2000); return () => clearTimeout(t); }, [key]);

  return (
    <div>
      <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={`${key}-${i}`} style={{ width: 180, background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {!loaded ? (
              <>
                <div style={{ height: 90, background: "rgba(20,20,23,0.05)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)", animation: "shimmer 1.5s infinite" }} />
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ height: 12, borderRadius: 4, background: "rgba(20,20,23,0.06)", marginBottom: 6, width: "65%", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)", animation: `shimmer 1.5s ${i * 0.15}s infinite` }} /></div>
                  <div style={{ height: 9, borderRadius: 3, background: "rgba(20,20,23,0.04)", width: "90%", position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)", animation: `shimmer 1.5s ${i * 0.15 + 0.1}s infinite` }} /></div>
                </div>
              </>
            ) : (
              <div style={{ animation: "contentIn 400ms ease both", animationDelay: `${i * 100}ms` }}>
                <div style={{ height: 90, background: `linear-gradient(135deg, ${[C.accent, C.purple, C.cyan][i]}, ${[C.accentLight, "#C084FC", "#67E8F9"][i]})` }} />
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{["Burger Premium", "Açaí Bowl", "Sushi Roll"][i]}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{["Food/Pop", "Pop Design", "Food/Pop"][i]}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={reset} style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${C.borderStrong}`, background: C.white, fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: C.text2, display: "flex", alignItems: "center", gap: 5 }}>
        <IcoRefresh size={13} />Replay
      </button>
    </div>
  );
}

/* ─── LOGO ANIMATION ─── */
function LogoAnimation() {
  const [animating, setAnimating] = useState(false);
  const [key, setKey] = useState(0);
  const trigger = () => { setAnimating(true); setKey(k => k + 1); setTimeout(() => setAnimating(false), 1200); };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, animation: animating ? "logoIn 1s ease both" : "none" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: animating ? "logoSpin 0.6s cubic-bezier(0.4, 0, 0.2, 1) both" : "none",
          boxShadow: animating ? `0 4px 20px ${C.accent}44` : `0 2px 8px ${C.accent}22`,
          transition: "box-shadow 300ms",
        }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>C</span>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text1, animation: animating ? "textSlide 0.6s 0.2s ease both" : "none" }}>Creatyng</div>
          <div style={{ fontSize: 11, color: C.text3, animation: animating ? "textSlide 0.6s 0.35s ease both" : "none" }}>Seu criativo de agência em segundos</div>
        </div>
      </div>
      <button onClick={trigger} style={{ padding: "6px 14px", borderRadius: 7, border: `1px solid ${C.borderStrong}`, background: C.white, fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: C.text2, display: "flex", alignItems: "center", gap: 5 }}>
        <IcoPlay />Play
      </button>
    </div>
  );
}

/* ─── PAGE TRANSITION DEMO ─── */
function PageTransition() {
  const [page, setPage] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const pages = [
    { title: "Dashboard", color: C.accent, bg: C.accentPale },
    { title: "Templates", color: C.purple, bg: `${C.purple}0A` },
    { title: "Settings", color: C.cyan, bg: `${C.cyan}0A` },
  ];

  const goTo = (i) => {
    setTransitioning(true);
    setTimeout(() => { setPage(i); setTransitioning(false); }, 250);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {pages.map((p, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
            border: page === i ? `1.5px solid ${p.color}` : `1px solid ${C.border}`,
            background: page === i ? p.bg : C.white, color: page === i ? p.color : C.text2,
            fontWeight: page === i ? 600 : 400, transition: "all 150ms",
          }}>{p.title}</button>
        ))}
      </div>
      <div style={{
        width: 360, height: 180, borderRadius: 14, border: `1px solid ${C.border}`,
        background: pages[page].bg, overflow: "hidden", position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: transitioning ? 0 : 1, transform: transitioning ? "translateY(8px)" : "",
        transition: "opacity 250ms ease, transform 250ms ease",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: pages[page].color, marginBottom: 4 }}>{pages[page].title}</div>
          <div style={{ fontSize: 12, color: C.text3 }}>Fade + translate transition • 250ms ease</div>
        </div>
      </div>
    </div>
  );
}

/* ─── PARALLAX DEMO ─── */
function ParallaxDemo() {
  const ref = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  const onScroll = (e) => setScrollY(e.target.scrollTop);

  return (
    <div ref={ref} onScroll={onScroll} style={{ width: 360, height: 220, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", position: "relative", background: C.white }}>
      <div style={{ height: 500, position: "relative" }}>
        {/* Background layer - moves slow */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, transform: `translateY(${scrollY * 0.3}px)`, transition: "transform 50ms linear" }}>
          <div style={{ height: "100%", background: `linear-gradient(135deg, ${C.accent}15, ${C.accentLight}15)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${C.accent}25` }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 24 }}>C</span>
            </div>
          </div>
        </div>

        {/* Mid layer - moves medium */}
        <div style={{ position: "absolute", top: 150, left: 20, right: 20, transform: `translateY(${scrollY * 0.15}px)` }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text1 }}>Olá, Rodrigo!</div>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 4 }}>Scroll para ver o efeito parallax</div>
        </div>

        {/* Foreground - moves normal */}
        <div style={{ position: "absolute", top: 220, left: 20, right: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ padding: "12px 14px", background: C.bg, borderRadius: 10, marginBottom: 8, border: `1px solid ${C.border}` }}>
              <div style={{ height: 8, borderRadius: 4, background: `${C.accent}15`, width: `${70 + i * 10}%`, marginBottom: 6 }} />
              <div style={{ height: 6, borderRadius: 3, background: "rgba(20,20,23,0.04)", width: "90%" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── TRANSITION MAP ─── */
const transitionMap = [
  { area: "Global", items: [
    { name: "Page enter", value: "fadeUp 450ms ease", desc: "Todas as páginas" },
    { name: "Card enter", value: "scaleIn 340ms ease", desc: "Cards com stagger delay" },
    { name: "Modal backdrop", value: "fadeIn 150ms ease", desc: "Overlay + blur" },
    { name: "Modal content", value: "scale(.95) → scale(1) 250ms", desc: "Spring feel" },
    { name: "Toast enter", value: "translateX(20px) → 0 300ms", desc: "Slide da direita" },
  ]},
  { area: "Hover States", items: [
    { name: "Botões CTA", value: "translateY(-1px) + shadow 180ms", desc: "Lift sutil" },
    { name: "Cards projeto", value: "border orange + bg gradient 180ms", desc: "Pletor-style" },
    { name: "Feature cards", value: "blur overlay + CTA button 150ms", desc: "Reveal on hover" },
    { name: "Nav items", value: "background 150ms ease", desc: "Subtle highlight" },
    { name: "Magnetic buttons", value: "follow cursor 80ms + return 400ms", desc: "Spring return" },
  ]},
  { area: "Loading", items: [
    { name: "Skeleton shimmer", value: "translateX(-100% → 100%) 1.5s", desc: "Infinite loop" },
    { name: "Skeleton → content", value: "opacity + scale 400ms stagger", desc: "Progressive reveal" },
    { name: "Generation stages", value: "check cascade 800ms each", desc: "Sequential fill" },
    { name: "Confetti", value: "translateY(100vh) + rotate 2s", desc: "60 pieces, random" },
  ]},
  { area: "Studio", items: [
    { name: "Node drag", value: "direct follow (no transition)", desc: "Immediate response" },
    { name: "Node exec glow", value: "box-shadow pulse 1.5s infinite", desc: "Attention ring" },
    { name: "Connection done", value: "stroke green + solid 400ms", desc: "Visual flow" },
    { name: "Auto Layout", value: "position spring 300ms ease", desc: "Reorganize" },
    { name: "Canvas zoom/pan", value: "transform scale + translate", desc: "Wheel + drag" },
  ]},
  { area: "Branding", items: [
    { name: "Logo spin", value: "rotate 360° 600ms ease", desc: "On load" },
    { name: "Logo text slide", value: "translateX(-10px) → 0 600ms", desc: "Stagger 200ms" },
    { name: "KPI counters", value: "0 → target easeOut 1.5s", desc: "Cubic deceleration" },
    { name: "Progress bar", value: "width transition 600ms ease", desc: "Smooth fill" },
  ]},
];

/* ─── MAIN ─── */
export default function AnimationsShowcase() {
  const [section, setSection] = useState("magnetic");

  const tabs = [
    { id: "magnetic", label: "Hover Magnético" },
    { id: "counters", label: "Counters" },
    { id: "parallax", label: "Parallax" },
    { id: "transitions", label: "Page Transitions" },
    { id: "skeleton", label: "Skeleton → Content" },
    { id: "logo", label: "Logo Animation" },
    { id: "map", label: "Mapa Completo" },
  ];

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", minHeight: "100vh", background: C.bg, color: C.text1, padding: 32 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes contentIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        @keyframes logoIn{from{opacity:0}to{opacity:1}}
        @keyframes logoSpin{from{transform:rotate(-180deg) scale(0.5);opacity:0}to{transform:rotate(0) scale(1);opacity:1}}
        @keyframes textSlide{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg,${C.accent},${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>C</span></div>
        <span style={{ fontWeight: 700, fontSize: 17 }}>Creatyng</span>
        <span style={{ fontSize: 12, color: C.text3, marginLeft: 8 }}>Animações & Efeitos</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "rgba(20,20,23,0.04)", borderRadius: 8, padding: 3, marginBottom: 28, flexWrap: "wrap", width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setSection(t.id)} style={{
            padding: "6px 14px", borderRadius: 6, border: "none", fontFamily: "inherit",
            background: section === t.id ? C.white : "transparent",
            color: section === t.id ? C.text1 : C.text3,
            fontWeight: section === t.id ? 600 : 400, fontSize: 12.5, cursor: "pointer",
            boxShadow: section === t.id ? "0 1px 3px rgba(0,0,0,.06)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ═══ MAGNETIC HOVER ═══ */}
      {section === "magnetic" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Hover Magnético</h2>
          <p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Botões atraídos pelo cursor. Mova o mouse lentamente sobre cada botão.</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <MagneticButton style={{
              padding: "12px 28px", borderRadius: 11, border: "none",
              background: `linear-gradient(135deg,${C.accent},${C.accentLight})`,
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              boxShadow: `0 4px 16px ${C.accent}44`, display: "flex", alignItems: "center", gap: 7,
            }}>
              <IcoSparkle size={16} style={{ color: "#fff" }} /> Nova Criação
            </MagneticButton>

            <MagneticButton style={{
              padding: "10px 22px", borderRadius: 9, border: `1.5px solid ${C.accent}`,
              background: C.accentPale, color: C.accent, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
            }}>
              <IcoZap /> Upgrade
            </MagneticButton>

            <MagneticButton style={{
              padding: "10px 20px", borderRadius: 9, border: `1px solid ${C.borderStrong}`,
              background: C.white, color: C.text1, fontSize: 13, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
            }}>
              <IcoDownload /> Exportar
            </MagneticButton>

            <MagneticButton style={{
              width: 44, height: 44, borderRadius: 12, border: `1px solid ${C.borderStrong}`,
              background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: C.text2, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <IcoPlus />
            </MagneticButton>
          </div>
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, maxWidth: 400 }}>
            <div style={{ fontSize: 11.5, color: C.text3, lineHeight: 1.5 }}>
              <strong style={{ color: C.text1 }}>Implementação:</strong> onMouseMove calcula delta entre cursor e centro do botão, aplica 25% como translate. Return com cubic-bezier(0.2, 0.8, 0.2, 1) em 400ms para spring effect.
            </div>
          </div>
        </div>
      )}

      {/* ═══ COUNTERS ═══ */}
      {section === "counters" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Animated Counters</h2>
          <p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Números animam de 0 ao target com easing cúbico. Ativam ao entrar no viewport.</p>
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { label: "MRR", target: 8400, prefix: "R$ ", suffix: "", color: C.success },
              { label: "Usuários", target: 127, color: C.accent },
              { label: "Gerações hoje", target: 379, color: C.purple },
              { label: "Créditos gastos", target: 14280, color: C.cyan },
            ].map((k, i) => (
              <div key={i} style={{ flex: 1, background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: C.text3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{k.label}</div>
                <AnimCounter target={k.target} prefix={k.prefix || ""} suffix={k.suffix || ""} color={k.color} size={28} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, maxWidth: 400 }}>
            <div style={{ fontSize: 11.5, color: C.text3, lineHeight: 1.5 }}>
              <strong style={{ color: C.text1 }}>Implementação:</strong> IntersectionObserver detecta viewport entry. requestAnimationFrame com easeOutCubic (1 - (1-t)³) por 1.5s. tabular-nums para estabilidade.
            </div>
          </div>
        </div>
      )}

      {/* ═══ PARALLAX ═══ */}
      {section === "parallax" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Parallax Scroll</h2>
          <p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Scroll dentro do container para ver camadas se movendo em velocidades diferentes.</p>
          <ParallaxDemo />
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, maxWidth: 400 }}>
            <div style={{ fontSize: 11.5, color: C.text3, lineHeight: 1.5 }}>
              <strong style={{ color: C.text1 }}>Implementação:</strong> Background layer a 0.3x scroll speed, mid layer a 0.15x, foreground a 1x. Aplicado no hero da dashboard e na landing page.
            </div>
          </div>
        </div>
      )}

      {/* ═══ PAGE TRANSITIONS ═══ */}
      {section === "transitions" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Page Transitions</h2>
          <p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Fade + translateY entre páginas. Clique nos botões para simular navegação.</p>
          <PageTransition />
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, maxWidth: 400 }}>
            <div style={{ fontSize: 11.5, color: C.text3, lineHeight: 1.5 }}>
              <strong style={{ color: C.text1 }}>Implementação:</strong> Opacity 1→0 + translateY 0→8px (saída 250ms), depois swap conteúdo, opacity 0→1 + translateY 8→0 (entrada 250ms). Ease timing.
            </div>
          </div>
        </div>
      )}

      {/* ═══ SKELETON → CONTENT ═══ */}
      {section === "skeleton" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Skeleton → Conteúdo Real</h2>
          <p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Shimmer placeholders que transicionam suavemente para o conteúdo real com stagger.</p>
          <SkeletonTransition />
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, maxWidth: 400 }}>
            <div style={{ fontSize: 11.5, color: C.text3, lineHeight: 1.5 }}>
              <strong style={{ color: C.text1 }}>Implementação:</strong> Skeleton com shimmer gradient (translateX loop 1.5s). Ao carregar: opacity 0 + scale(0.95) → 1 + scale(1) em 400ms com stagger 100ms por card.
            </div>
          </div>
        </div>
      )}

      {/* ═══ LOGO ANIMATION ═══ */}
      {section === "logo" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Logo Micro-Animation</h2>
          <p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Animação de entrada do logo ao carregar a aplicação. Clique Play para reproduzir.</p>
          <LogoAnimation />
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: C.white, border: `1px solid ${C.border}`, maxWidth: 400 }}>
            <div style={{ fontSize: 11.5, color: C.text3, lineHeight: 1.5 }}>
              <strong style={{ color: C.text1 }}>Implementação:</strong> Ícone: rotate(-180°) + scale(0.5) → normal em 600ms. Texto: translateX(-10px) → 0 em 600ms com stagger 200ms entre title e subtitle. Box-shadow glow durante animação.
            </div>
          </div>
        </div>
      )}

      {/* ═══ TRANSITION MAP ═══ */}
      {section === "map" && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Mapa Completo de Transições</h2>
          <p style={{ fontSize: 13, color: C.text3, marginBottom: 24 }}>Referência de todas as animações e transições do produto para implementação.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {transitionMap.map((group, gi) => (
              <div key={gi} style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>{group.area}</span>
                </div>
                {group.items.map((item, ii) => (
                  <div key={ii} style={{
                    padding: "10px 18px", display: "grid", gridTemplateColumns: "180px 1fr 200px",
                    gap: 12, alignItems: "center", borderBottom: ii < group.items.length - 1 ? `1px solid ${C.border}` : "none",
                  }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text1 }}>{item.name}</span>
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: C.accent, background: C.accentPale, padding: "3px 8px", borderRadius: 5 }}>{item.value}</span>
                    <span style={{ fontSize: 11.5, color: C.text3 }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
