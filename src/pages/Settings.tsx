import { useState, useEffect, useRef } from 'react';
import {
  User, Settings2, Palette, Key,
  Camera, Upload, Plus, X, Copy, Trash2, Check, ChevronDown,
  Languages, Sun, Moon, Monitor, AlertTriangle,
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { ConfirmModal } from '@/components/creatyng/ConfirmModal';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n';
import type { Lang } from '@/i18n';
import { useToast } from '@/features/toast/useToast';
import { FONT_OPTIONS } from '@/features/editor/font-presets';
import { useTheme } from 'next-themes';

type SettingsTab = 'profile' | 'preferences' | 'brandkit' | 'apikeys';

const TABS: { id: SettingsTab; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: 'profile', label: 'Perfil', Icon: User },
  { id: 'preferences', label: 'Preferências', Icon: Settings2 },
  { id: 'brandkit', label: 'Brand Kit', Icon: Palette },
  { id: 'apikeys', label: 'API Keys', Icon: Key },
];

const MOCK_KEYS = [
  { id: 'k1', name: 'Produção', key: 'ck_live_••••••••••••a3f7', created: '12 Jan 2026' },
  { id: 'k2', name: 'Desenvolvimento', key: 'ck_test_••••••••••••b8e2', created: '28 Fev 2026' },
];

const DEFAULT_COLORS = ['#ff713d', '#141417', '#f5f5f3', '#7C3AED'];

/* ── Toggle Switch ───────────────────────────────────── */
function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
      <span style={{ fontSize: 13.5, color: 'hsl(var(--foreground))' }}>{label}</span>
      <button onClick={onToggle} style={{
        width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
        background: on ? '#ff713d' : 'hsl(var(--muted))', transition: 'background 200ms',
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
          left: on ? 21 : 3, transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </button>
    </div>
  );
}

/* ── Field Input ─────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, disabled, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; type?: string;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 12.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: 6, display: 'block' }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
          border: '1px solid hsl(var(--border))',
          background: disabled ? 'hsl(var(--muted))' : 'hsl(var(--card))',
          color: disabled ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
          outline: 'none', transition: 'border 150ms', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

const Settings = () => {
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const toast = useToast();
  const { theme: appTheme, setTheme: setAppTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [ready, setReady] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || 'Rodrigo Nutra');
  const [phone, setPhone] = useState('+55 63 9 9999-0000');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [brandColors, setBrandColors] = useState(DEFAULT_COLORS);
  const [brandFonts, setBrandFonts] = useState(['Instrument Sans', 'Inter']);
  const [apiKeys, setApiKeys] = useState(MOCK_KEYS);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [activeColorIdx, setActiveColorIdx] = useState<number | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setActiveColorIdx(null);
      }
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node)) {
        setFontDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const email = user?.email || 'support@creatyng.com';
  const avatarLetter = name.charAt(0).toUpperCase() || email.charAt(0).toUpperCase() || 'U';

  const deleteKey = (id: string) => setApiKeys(prev => prev.filter(k => k.id !== id));
  const removeFont = (f: string) => setBrandFonts(prev => prev.filter(x => x !== f));
  const addFont = (fontLabel: string) => {
    if (!brandFonts.includes(fontLabel)) setBrandFonts(prev => [...prev, fontLabel]);
    setFontDropdownOpen(false);
  };

  /* ─── Tab Content ────────────────────────────────────── */
  const renderTab = () => {
    if (activeTab === 'profile') return (
      <div style={{ animation: ready ? 'fdUp 400ms 80ms ease both' : 'none' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'hsl(var(--foreground))' }}>Perfil</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 28 }}>Gerencie suas informações pessoais.</p>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff713d, #141417)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 26,
            }}>{avatarLetter}</div>
            <button style={{
              position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%',
              background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))', boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            }}><Camera size={14} /></button>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{name}</div>
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Plano Pro · Membro desde Jan 2026</div>
          </div>
        </div>

        <div style={{ maxWidth: 420 }}>
          <Field label="Nome completo" value={name} onChange={setName} placeholder="Seu nome" />
          <Field label="Email" value={email} onChange={() => {}} disabled />
          <Field label="Telefone" value={phone} onChange={setPhone} placeholder="+55 00 0000-0000" type="tel" />
        </div>

        <button
          onClick={() => toast.success('Configurações salvas!')}
          style={{
            padding: '10px 28px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
            color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(255,113,61,0.27)', marginTop: 4,
          }}
        >Salvar alterações</button>

        {/* Danger zone — contained at max-width 420px */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid hsl(var(--border))', maxWidth: 420 }}>
          <div style={{
            border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12,
            background: 'rgba(239,68,68,0.03)', padding: '18px 20px',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#EF4444', marginBottom: 4 }}>Zona de perigo</h3>
            <p style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>Ações irreversíveis para sua conta.</p>
            <button
              onClick={() => setConfirmDeleteAccount(true)}
              style={{
                padding: '8px 20px', borderRadius: 8,
                border: '1.5px solid #EF4444',
                background: 'transparent', color: '#EF4444', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.05)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >Excluir minha conta</button>
          </div>
        </div>
      </div>
    );

    if (activeTab === 'preferences') return (
      <div style={{ animation: ready ? 'fdUp 400ms 80ms ease both' : 'none' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'hsl(var(--foreground))' }}>Preferências</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 28 }}>Personalize sua experiência no Creatyng.</p>

        {/* Language — wired to useI18n().setLang() */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: 8, display: 'block' }}>Idioma</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {([
              { id: 'pt-BR' as Lang, label: 'Português' },
              { id: 'en' as Lang, label: 'English' },
              { id: 'es' as Lang, label: 'Español' },
            ] as const).map(l => {
              const active = lang === l.id;
              return (
                <button key={l.id} onClick={() => setLang(l.id)} style={{
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  border: active ? '1.5px solid #ff713d' : '1px solid hsl(var(--border))',
                  background: active ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
                  color: active ? '#ff713d' : 'hsl(var(--muted-foreground))', fontWeight: active ? 600 : 400,
                  fontSize: 13, transition: 'all 150ms',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Languages size={14} />{l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme — wired to next-themes useTheme() */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: 8, display: 'block' }}>Tema</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'light', label: 'Claro', Icon: Sun },
              { id: 'dark', label: 'Escuro', Icon: Moon },
              { id: 'system', label: 'Auto', Icon: Monitor },
            ].map(th => {
              const active = appTheme === th.id;
              return (
                <button key={th.id} onClick={() => setAppTheme(th.id)} style={{
                  padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  border: active ? '1.5px solid #ff713d' : '1px solid hsl(var(--border))',
                  background: active ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
                  color: active ? '#ff713d' : 'hsl(var(--muted-foreground))', fontWeight: active ? 600 : 400,
                  fontSize: 13, transition: 'all 150ms',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <th.Icon size={14} />{th.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default format */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: 8, display: 'block' }}>Formato padrão</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['1:1', '9:16', '4:5', '16:9'].map(fmt => (
              <button key={fmt} style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--muted-foreground))',
                fontSize: 13, transition: 'all 150ms',
              }}>{fmt}</button>
            ))}
          </div>
        </div>

        {/* Export quality */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: 8, display: 'block' }}>Qualidade de exportação</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['2K (1080p)', '4K (2160p)'].map(q => (
              <button key={q} style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--muted-foreground))',
                fontSize: 13, transition: 'all 150ms',
              }}>{q}</button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: 4, display: 'block' }}>Notificações</label>
          <div style={{ maxWidth: 360 }}>
            <Toggle label="Notificações por email" on={emailNotif} onToggle={() => setEmailNotif(v => !v)} />
            <Toggle label="Notificações push" on={pushNotif} onToggle={() => setPushNotif(v => !v)} />
          </div>
        </div>

        <button onClick={() => toast.success('Preferências salvas!')} style={{
          padding: '10px 28px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
          color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(255,113,61,0.27)', marginTop: 12,
        }}>Salvar preferências</button>
      </div>
    );

    if (activeTab === 'brandkit') return (
      <div style={{ animation: ready ? 'fdUp 400ms 80ms ease both' : 'none' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'hsl(var(--foreground))' }}>Brand Kit</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 28 }}>Configure a identidade visual da sua marca para aplicar nos criativos.</p>

        {/* Logo upload */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: 8, display: 'block' }}>Logo da marca</label>
          <div
            style={{
              border: '2px dashed hsl(var(--border))', borderRadius: 12,
              width: 180, height: 180,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', background: 'hsl(var(--card))', transition: 'all 150ms',
              color: 'hsl(var(--muted-foreground))', gap: 6,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ff713d'; (e.currentTarget as HTMLElement).style.color = '#ff713d'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}
          >
            <Upload size={20} />
            <span style={{ fontSize: 10, textAlign: 'center', lineHeight: 1.3 }}>PNG / SVG{'\n'}Max 2MB</span>
          </div>
        </div>

        {/* Brand colors */}
        <div style={{ marginBottom: 28, position: 'relative' }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: 10, display: 'block' }}>Cores da marca</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {brandColors.map((color, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <button
                  onClick={() => setActiveColorIdx(activeColorIdx === i ? null : i)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', background: color,
                    border: activeColorIdx === i ? '3px solid hsl(var(--foreground))' : '3px solid hsl(var(--card))',
                    boxShadow: activeColorIdx === i
                      ? '0 0 0 2px #ff713d, 0 4px 12px rgba(0,0,0,0.2)'
                      : '0 2px 8px rgba(0,0,0,0.15)',
                    cursor: 'pointer', transition: 'all 200ms',
                  }}
                />
                <span style={{ fontSize: 9.5, color: 'hsl(var(--muted-foreground))', textAlign: 'center', fontFamily: 'monospace' }}>{color}</span>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <button
                onClick={() => setBrandColors(c => [...c, '#888888'])}
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: '2px dashed hsl(var(--border))',
                  background: 'hsl(var(--card))', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'hsl(var(--muted-foreground))', transition: 'all 150ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ff713d'; (e.currentTarget as HTMLElement).style.color = '#ff713d'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))'; (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}
              ><Plus size={15} /></button>
              <span style={{ fontSize: 9.5, color: 'hsl(var(--muted-foreground))' }}>Add</span>
            </div>
          </div>

          {/* Color picker popover */}
          {activeColorIdx !== null && (
            <div
              ref={colorPickerRef}
              style={{
                position: 'absolute', top: 80, left: 0, zIndex: 50,
                background: 'hsl(var(--popover))', borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                border: '1px solid hsl(var(--border))',
                padding: 16, minWidth: 230,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Editar cor</span>
                <button
                  onClick={() => { setBrandColors(brandColors.filter((_, idx) => idx !== activeColorIdx)); setActiveColorIdx(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: 2 }}
                ><X size={14} /></button>
              </div>
              <HexColorPicker
                color={brandColors[activeColorIdx]}
                onChange={(c) => setBrandColors(prev => prev.map((col, idx) => idx === activeColorIdx ? c : col))}
                style={{ width: '100%', height: 160 }}
              />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
                padding: '8px 10px', borderRadius: 8,
                border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))',
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: brandColors[activeColorIdx], flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'hsl(var(--foreground))', fontWeight: 600 }}>
                  {brandColors[activeColorIdx].toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setActiveColorIdx(null)}
                style={{
                  marginTop: 10, width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #ff713d, #FF9B70)', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >Aplicar</button>
            </div>
          )}
        </div>

        {/* Brand fonts */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 12.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginBottom: 10, display: 'block' }}>Fontes da marca</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {brandFonts.map((f, i) => (
              <div key={i} style={{
                padding: '6px 12px', borderRadius: 6, border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))' }}>{f}</span>
                <button onClick={() => removeFont(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', display: 'flex', padding: 0 }}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <div ref={fontDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setFontDropdownOpen(v => !v)}
                style={{
                  padding: '6px 14px', borderRadius: 6,
                  border: fontDropdownOpen ? '1.5px solid #ff713d' : '2px dashed hsl(var(--border))',
                  background: fontDropdownOpen ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))', cursor: 'pointer',
                  color: fontDropdownOpen ? '#ff713d' : 'hsl(var(--muted-foreground))', fontSize: 12.5, fontWeight: 500,
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 150ms',
                }}
              >
                <Plus size={14} /> Adicionar fonte
                <ChevronDown size={13} style={{ transition: 'transform 200ms', transform: fontDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {fontDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
                  background: 'hsl(var(--popover))', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                  border: '1px solid hsl(var(--border))', minWidth: 200, maxHeight: 220,
                  overflowY: 'auto', padding: '6px 0',
                }}>
                  {FONT_OPTIONS.map(opt => {
                    const alreadyAdded = brandFonts.includes(opt.label);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => !alreadyAdded && addFont(opt.label)}
                        disabled={alreadyAdded}
                        style={{
                          width: '100%', padding: '8px 14px', background: 'none', border: 'none',
                          textAlign: 'left', cursor: alreadyAdded ? 'default' : 'pointer',
                          fontSize: 13, color: alreadyAdded ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          transition: 'background 100ms',
                        }}
                        onMouseEnter={e => { if (!alreadyAdded) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
                      >
                        <span>{opt.label}</span>
                        {alreadyAdded && <Check size={13} style={{ color: '#10B981' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Toggle label="Aplicar Brand Kit automaticamente" on={false} onToggle={() => toast.info('Em breve!')} />
        </div>

        <button onClick={() => toast.success('Brand Kit atualizado!')} style={{
          padding: '10px 28px', borderRadius: 9, border: 'none',
          background: 'linear-gradient(135deg, #ff713d, #FF9B70)',
          color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(255,113,61,0.27)',
        }}>Salvar Brand Kit</button>
      </div>
    );

    if (activeTab === 'apikeys') return (
      <div style={{ animation: ready ? 'fdUp 400ms 80ms ease both' : 'none' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'hsl(var(--foreground))' }}>API Keys</h2>
        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 28 }}>Gerencie suas chaves de API para integração.</p>

        {/* BYOK section */}
        <div style={{
          padding: '16px 20px', borderRadius: 12, marginBottom: 28,
          border: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.3)',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 4 }}>Conecte suas próprias chaves de API</h3>
          <p style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>Use modelos premium e tenha controle total sobre custos.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420, opacity: 0.5, pointerEvents: 'none' }}>
            <Field label="Gemini API Key" value="" onChange={() => {}} placeholder="AIza..." disabled />
            <Field label="Replicate API Token" value="" onChange={() => {}} placeholder="r8_..." disabled />
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 6,
            background: '#F59E0B20', color: '#B45309', fontSize: 11.5, fontWeight: 500,
          }}>
            <AlertTriangle size={13} />
            BYOK não disponível no momento — em breve
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 540, marginBottom: 20 }}>
          {apiKeys.map(k => (
            <div key={k.id} style={{
              padding: '14px 18px', borderRadius: 10, border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 1px 3px hsl(var(--foreground) / 0.04)',
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{k.name}</div>
                <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3, fontFamily: 'monospace' }}>{k.key}</div>
                <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 3, opacity: 0.7 }}>Criada em {k.created}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => navigator.clipboard.writeText(k.key)}
                  style={{
                    padding: '6px 10px', borderRadius: 7, border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))', fontFamily: 'inherit',
                  }}
                ><Copy size={14} /> Copiar</button>
                <button
                  onClick={() => deleteKey(k.id)}
                  style={{
                    padding: '6px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)',
                    background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    color: '#EF4444',
                  }}
                ><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            const suffix = Math.random().toString(36).slice(2, 6);
            const newKey = {
              id: `k${Date.now()}`,
              name: 'Nova chave',
              key: `ck_live_••••••••••••${suffix}`,
              created: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
            };
            setApiKeys(prev => [...prev, newKey]);
            toast.success('Nova API Key criada!');
          }}
          style={{
            padding: '10px 22px', borderRadius: 9, border: '1.5px solid #ff713d',
            background: 'hsl(var(--primary) / 0.1)', color: '#ff713d', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}><Plus size={15} /> Nova API Key</button>
      </div>
    );

    return null;
  };

  return (
    <div style={{
      fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif",
      minHeight: '100vh', color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'stretch',
    }}>
      <style>{`
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        input:focus{border-color:#ff713d !important;box-shadow:0 0 0 2px rgba(255,113,61,0.15)}
        input::placeholder{color:hsl(var(--muted-foreground))}
        select:focus{outline:none}
      `}</style>

      {/* Settings sub-sidebar */}
      <div style={{
        width: 220, minWidth: 220, borderRight: '1px solid hsl(var(--border))',
        padding: '28px 16px', alignSelf: 'stretch',
        background: 'hsl(var(--card) / 0.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 20, padding: '0 8px' }}>Configurações</h2>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 12px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
              background: active ? 'hsl(var(--primary) / 0.1)' : 'transparent',
              border: active ? '1px solid hsl(var(--primary) / 0.2)' : '1px solid transparent',
              color: active ? '#ff713d' : 'hsl(var(--muted-foreground))', fontWeight: active ? 600 : 400,
              fontSize: 13.5, fontFamily: 'inherit', transition: 'all 150ms',
            }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--foreground) / 0.04)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <tab.Icon size={18} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: '28px 36px 48px', overflowY: 'auto' }}>
        {renderTab()}
      </div>

      <ConfirmModal
        open={confirmDeleteAccount}
        onConfirm={() => { setConfirmDeleteAccount(false); toast.error('Conta excluída (placeholder)'); }}
        onCancel={() => setConfirmDeleteAccount(false)}
        title="Excluir sua conta?"
        description="Todos os seus dados, projetos e créditos serão removidos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir conta"
        variant="danger"
      />
    </div>
  );
};

export default Settings;
