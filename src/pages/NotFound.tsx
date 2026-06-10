import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="cy404">
      {/* Scoped Spotlight styles — isolated to this screen (no global tokens touched) */}
      <style>{`
        .cy404 {
          position: relative;
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          overflow: hidden;
          text-align: center;
          background:
            radial-gradient(110% 60% at 50% -10%, #FFF3EA, #F4EDE4 58%), #F4EDE4;
        }
        .dark .cy404 {
          background:
            radial-gradient(110% 60% at 50% -10%, #2a201a, #100d0b 58%), #100d0b;
        }
        /* grade de pontos no topo */
        .cy404::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 300px;
          pointer-events: none;
          opacity: .55;
          background-image: radial-gradient(rgba(28,22,16,.05) 1.3px, transparent 1.3px);
          background-size: 26px 26px;
          -webkit-mask-image: linear-gradient(180deg, #000, transparent);
          mask-image: linear-gradient(180deg, #000, transparent);
        }
        .dark .cy404::before {
          background-image: radial-gradient(rgba(255,255,255,.045) 1.3px, transparent 1.3px);
        }
        /* barra de gradiente no rodapé */
        .cy404::after {
          content: '';
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 4px;
          background: linear-gradient(90deg, hsl(var(--brand)), hsl(var(--brand-2)));
        }
        .cy404-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cy404-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 30px;
        }
        .cy404-mark {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: linear-gradient(150deg, hsl(var(--brand-2)), hsl(var(--brand)));
          box-shadow: 0 10px 22px -10px hsl(var(--brand) / .8);
        }
        .cy404-word {
          font-weight: 700;
          font-size: 23px;
          color: hsl(var(--foreground));
          letter-spacing: -.02em;
        }
        .cy404-code {
          font-weight: 800;
          font-size: 120px;
          line-height: 1;
          letter-spacing: -.04em;
          background: linear-gradient(160deg, hsl(var(--brand-2)), hsl(var(--brand)));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .cy404-title {
          font-size: 26px;
          font-weight: 600;
          color: hsl(var(--foreground));
          letter-spacing: -.02em;
          margin-top: 10px;
        }
        .cy404-sub {
          color: hsl(var(--muted-foreground));
          font-size: 15px;
          margin-top: 9px;
          max-width: 380px;
          line-height: 1.5;
        }
        .cy404-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 30px;
        }
        @media (prefers-reduced-motion: no-preference) {
          .cy404-code { animation: cy404-float 4s ease-in-out infinite; }
        }
        @keyframes cy404-float { 50% { transform: translateY(-6px); } }
      `}</style>

      <div className="cy404-inner">
        {/* Logo */}
        <div className="cy404-brand">
          <span className="cy404-mark">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 4a12 12 0 1 0 8.5 20.5l-3.2-3.2A7.5 7.5 0 1 1 23.5 11" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              <path d="M16 16h7" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              <circle cx="25.5" cy="9" r="2.4" fill="#fff" />
            </svg>
          </span>
          <span className="cy404-word">Creatyng</span>
        </div>

        {/* 404 */}
        <div className="cy404-code">404</div>
        <div className="cy404-title">{t('not_found.title')}</div>
        <div className="cy404-sub">{t('not_found.description')}</div>

        {/* Buttons */}
        <div className="cy404-actions">
          <Button variant="gradient" size="lg" onClick={() => navigate('/app/dashboard')}>
            {t('not_found.go_dashboard')}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => navigate('/')}>
            {t('not_found.back_home')} →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
