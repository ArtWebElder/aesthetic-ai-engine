import { useState, useEffect, useRef } from "react";

/* ─── COLORS ─── */
const C = {
  accent: "#ff713d", accentLight: "#FF9B70", accentPale: "#FFF0EA",
  bg: "#f5f5f3", dark: "#141417", white: "#ffffff",
  border: "rgba(20,20,23,0.06)", borderStrong: "rgba(20,20,23,0.1)",
  text1: "#141417", text2: "#5a5a60", text3: "#8e8e96", text4: "#b5b5bb",
  error: "#EF4444",
};

/* ─── ICONS ─── */
const Ico = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcoMail = (p) => <Ico {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></Ico>;
const IcoLock = (p) => <Ico {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></Ico>;
const IcoEye = (p) => <Ico size={18} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Ico>;
const IcoEyeOff = (p) => <Ico size={18} {...p}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></Ico>;
const IcoCheck = (p) => <Ico size={14} {...p}><polyline points="20 6 9 17 4 12"/></Ico>;
const IcoX = (p) => <Ico size={14} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Ico>;

/* ─── Google "G" icon ─── */
const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

/* ─── FAKE CREATIVE IMAGES (gradient cards simulating real creatives) ─── */
const creativeColors = [
  ["#FF6B35","#FFB088"], ["#7C3AED","#C084FC"], ["#EC4899","#F9A8D4"],
  ["#06B6D4","#67E8F9"], ["#10B981","#6EE7B7"], ["#F59E0B","#FCD34D"],
  ["#1E293B","#64748B"], ["#DC2626","#FCA5A5"], ["#8B5CF6","#DDD6FE"],
  ["#0EA5E9","#BAE6FD"], ["#D946EF","#F0ABFC"], ["#14B8A6","#99F6E4"],
  ["#F97316","#FDBA74"], ["#6366F1","#A5B4FC"], ["#EF4444","#FCA5A5"],
  ["#84CC16","#D9F99D"], ["#E11D48","#FDA4AF"], ["#0891B2","#A5F3FC"],
];
const creativeLabels = [
  "Burger Smash","Açaí Bowl","Pizza Night","Sushi Roll","Café Latte",
  "Doce Fino","BBQ House","Tacos","Poke Bowl","Gelato","Waffle",
  "Ramen","Croissant","Smoothie","Pad Thai","Brigadeiro","Ceviche","Crepe"
];

function FakeCreative({ index, style }) {
  const [c1, c2] = creativeColors[index % creativeColors.length];
  const label = creativeLabels[index % creativeLabels.length];
  return (
    <div style={{
      width: "100%", borderRadius: 10, overflow: "hidden", position: "relative",
      background: `linear-gradient(145deg, ${c1}, ${c2})`,
      aspectRatio: index % 3 === 0 ? "3/4" : index % 3 === 1 ? "4/5" : "1/1",
      display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 10,
      ...style,
    }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)" }} />
      {/* Fake composition elements */}
      <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translate(-50%,-50%)", width: "40%", height: "40%", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
      <div style={{ position: "absolute", top: "50%", left: "25%", width: "20%", height: "20%", borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.1, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>{label}</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 9.5, fontWeight: 500, marginTop: 2 }}>Creatyng</div>
      </div>
    </div>
  );
}

/* ─── SCROLLING COLUMN ─── */
function ScrollColumn({ direction = "up", offset = 0 }) {
  const items = Array.from({ length: 12 }, (_, i) => i + offset);
  const dur = direction === "up" ? 35 : 40;
  const animName = direction === "up" ? "scrollUp" : "scrollDown";

  return (
    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        animation: `${animName} ${dur}s linear infinite`,
      }}>
        {[...items, ...items].map((idx, i) => (
          <FakeCreative key={i} index={idx} />
        ))}
      </div>
    </div>
  );
}

/* ─── PASSWORD RULES ─── */
function PasswordCheck({ label, ok }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: ok ? C.accent : C.text4 }}>
      {ok ? <IcoCheck stroke={C.accent} /> : <IcoX stroke={C.text4} />}
      <span>{label}</span>
    </div>
  );
}

/* ─── MAIN LOGIN PAGE ─── */
export default function LoginPage() {
  const [mode, setMode] = useState("signup"); // signup | login
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  const has8 = pass.length >= 8;
  const hasLower = /[a-z]/.test(pass);
  const hasUpper = /[A-Z]/.test(pass);
  const hasNum = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.07)' stroke-width='0.5'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
      minHeight: "100vh", display: "flex", color: C.text1, background: C.bg,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fdUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fdIn{from{opacity:0}to{opacity:1}}
        @keyframes scrollUp{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
        @keyframes scrollDown{0%{transform:translateY(-50%)}100%{transform:translateY(0)}}
        input::placeholder{color:${C.text4}}
        input:focus{outline:none}
      `}</style>

      {/* ═══ LEFT: FORM ═══ */}
      <div style={{
        flex: "0 0 480px", maxWidth: 480, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "48px 56px",
        background: `radial-gradient(ellipse 400px 300px at 50% 20%, rgba(255,113,61,0.04) 0%, transparent 70%), ${gridSvg}, ${C.bg}`,
        position: "relative", zIndex: 2,
      }}>
        {/* Logo */}
        <div style={{
          position: "absolute", top: 32, left: 56,
          display: "flex", alignItems: "center", gap: 8,
          animation: ready ? "fdUp 400ms ease both" : "none",
        }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>C</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, color: C.text1 }}>Creatyng</span>
        </div>

        {/* Form container */}
        <div style={{ animation: ready ? "fdUp 500ms 100ms ease both" : "none" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text1, marginBottom: 6 }}>
            {mode === "signup" ? "Crie sua conta" : "Bem-vindo de volta"}
          </h1>
          <p style={{ fontSize: 14, color: C.text2, marginBottom: 28 }}>
            {mode === "signup" ? "Comece a criar criativos profissionais em segundos." : "Entre na sua conta para continuar criando."}
          </p>

          {/* Google OAuth */}
          <button style={{
            width: "100%", padding: "11px 0", borderRadius: 10,
            border: `1px solid ${C.borderStrong}`, background: C.white,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            fontSize: 13.5, fontWeight: 500, color: C.text1, cursor: "pointer",
            fontFamily: "inherit", transition: "all 150ms",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.text3; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.borderStrong; }}
          >
            <GoogleG />
            Continuar com Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.text4, fontWeight: 500 }}>OU</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Email */}
          <label style={{ fontSize: 13, fontWeight: 500, color: C.text1, marginBottom: 6, display: "block" }}>Email</label>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
            background: C.white, borderRadius: 10, border: `1px solid ${C.borderStrong}`,
            marginBottom: 16, transition: "border 150ms",
          }}>
            <IcoMail size={16} stroke={C.text4} />
            <input
              type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ flex: 1, border: "none", background: "transparent", padding: "11px 0", fontSize: 13.5, fontFamily: "inherit", color: C.text1 }}
            />
          </div>

          {/* Password */}
          <label style={{ fontSize: 13, fontWeight: 500, color: C.text1, marginBottom: 6, display: "block" }}>Senha</label>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
            background: C.white, borderRadius: 10, border: `1px solid ${C.borderStrong}`,
            marginBottom: mode === "signup" ? 14 : 8,
          }}>
            <IcoLock size={16} stroke={C.text4} />
            <input
              type={showPass ? "text" : "password"} placeholder="Sua senha" value={pass}
              onChange={e => setPass(e.target.value)}
              style={{ flex: 1, border: "none", background: "transparent", padding: "11px 0", fontSize: 13.5, fontFamily: "inherit", color: C.text1 }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", color: C.text4, display: "flex", alignItems: "center", padding: 2 }}>
              {showPass ? <IcoEyeOff /> : <IcoEye />}
            </button>
          </div>

          {/* Password rules (signup only) */}
          {mode === "signup" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginBottom: 20 }}>
              <PasswordCheck label="8 caracteres" ok={has8} />
              <PasswordCheck label="Uma maiúscula" ok={hasUpper} />
              <PasswordCheck label="Uma minúscula" ok={hasLower} />
              <PasswordCheck label="Um número" ok={hasNum} />
              <PasswordCheck label="Um especial" ok={hasSpecial} />
            </div>
          )}

          {/* Forgot password (login only) */}
          {mode === "login" && (
            <div style={{ textAlign: "right", marginBottom: 18 }}>
              <span style={{ fontSize: 12.5, color: C.accent, fontWeight: 500, cursor: "pointer" }}>Esqueceu a senha?</span>
            </div>
          )}

          {/* Submit */}
          <button style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", boxShadow: `0 3px 12px ${C.accent}44`,
            transition: "all 180ms",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 5px 18px ${C.accent}55`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 3px 12px ${C.accent}44`; }}
          >
            {mode === "signup" ? "Criar Conta" : "Entrar"}
          </button>

          {/* Terms */}
          {mode === "signup" && (
            <p style={{ fontSize: 11, color: C.text3, marginTop: 14, lineHeight: 1.5, textAlign: "center" }}>
              Ao criar conta, você concorda com os <span style={{ color: C.accent, cursor: "pointer" }}>Termos de Uso</span> e <span style={{ color: C.accent, cursor: "pointer" }}>Política de Privacidade</span>.
            </p>
          )}

          {/* Toggle mode */}
          <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: C.text2 }}>
            {mode === "signup" ? (
              <>Já tem conta? <span onClick={() => setMode("login")} style={{ color: C.accent, fontWeight: 600, cursor: "pointer" }}>Entrar</span></>
            ) : (
              <>Não tem conta? <span onClick={() => setMode("signup")} style={{ color: C.accent, fontWeight: 600, cursor: "pointer" }}>Criar conta</span></>
            )}
          </div>
        </div>

        {/* Social proof */}
        <div style={{
          position: "absolute", bottom: 32, left: 56, right: 56,
          animation: ready ? "fdUp 500ms 300ms ease both" : "none",
        }}>
          <div style={{
            background: C.white, borderRadius: 12, padding: "14px 16px",
            border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, #06B6D4, #8B5CF6)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>M</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text1 }}>Marina Costa</div>
                <div style={{ fontSize: 11, color: C.text3 }}>Dona da @acaitropical</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, fontStyle: "italic" }}>
              "Antes eu gastava R$200 por criativo com designer. Agora faço em 30 segundos e fica melhor."
            </p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: CAROUSEL ═══ */}
      <div style={{
        flex: 1, position: "relative", overflow: "hidden",
        background: C.dark,
      }}>
        {/* 3 columns scrolling */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", gap: 10, padding: "0 20px",
          animation: ready ? "fdIn 800ms 200ms ease both" : "none",
        }}>
          <ScrollColumn direction="up" offset={0} />
          <ScrollColumn direction="down" offset={6} />
          <ScrollColumn direction="up" offset={12} />
        </div>

        {/* Overlay fades top & bottom */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "18%",
          background: `linear-gradient(to bottom, ${C.dark} 0%, transparent 100%)`,
          zIndex: 5,
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "18%",
          background: `linear-gradient(to top, ${C.dark} 0%, transparent 100%)`,
          zIndex: 5,
        }} />

        {/* Center badge */}
        <div style={{
          position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
          zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          animation: ready ? "fdUp 500ms 500ms ease both" : "none",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            borderRadius: 12, padding: "12px 20px", border: "1px solid rgba(255,255,255,0.12)",
            textAlign: "center",
          }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>+2.400 criativos</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11.5 }}>gerados esta semana</div>
          </div>
        </div>
      </div>
    </div>
  );
}
