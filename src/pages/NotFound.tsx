import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "@/i18n";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'hsl(var(--background))',
      fontFamily: 'inherit',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, hsl(var(--brand)), hsl(var(--brand-2)))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>C</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, color: 'hsl(var(--foreground))', letterSpacing: -0.3 }}>Creatyng</span>
      </div>

      {/* 404 */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{
          fontSize: 80,
          fontWeight: 800,
          color: 'hsl(var(--brand))',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          margin: 0,
        }}>404</p>
        <p style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'hsl(var(--foreground))',
          marginTop: 16,
          marginBottom: 8,
        }}>{t('not_found.title')}</p>
        <p style={{
          fontSize: 14,
          color: 'hsl(var(--muted-foreground))',
          maxWidth: 340,
          lineHeight: 1.5,
        }}>{t('not_found.description')}</p>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => navigate('/app/dashboard')}
          style={{
            padding: '10px 22px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, hsl(var(--brand)), hsl(var(--brand-2)))',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px hsl(var(--brand) / 0.35)',
          }}
        >
          {t('not_found.go_dashboard')}
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 22px',
            borderRadius: 10,
            border: '1.5px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('not_found.back_home')}
        </button>
      </div>
    </div>
  );
};

export default NotFound;
