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
      background: '#f5f5f3',
      backgroundImage: [
        "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23141417' fill-opacity='0.04'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'radial-gradient(ellipse 700px 500px at 50% 0%, rgba(255,113,61,0.08) 0%, transparent 65%)',
      ].join(','),
      fontFamily: 'inherit',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>C</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, color: '#141417', letterSpacing: -0.3 }}>Creatyng</span>
      </div>

      {/* 404 */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{
          fontSize: 80,
          fontWeight: 800,
          color: '#ff713d',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          margin: 0,
        }}>404</p>
        <p style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#141417',
          marginTop: 16,
          marginBottom: 8,
        }}>{t('not_found.title')}</p>
        <p style={{
          fontSize: 14,
          color: '#5a5a60',
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
            background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,113,61,0.35)',
          }}
        >
          {t('not_found.go_dashboard')}
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 22px',
            borderRadius: 10,
            border: '1.5px solid rgba(20,20,23,0.12)',
            background: '#ffffff',
            color: '#141417',
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
