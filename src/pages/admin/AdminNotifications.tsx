import { useEffect, useState } from 'react';
import {
  Bell, Info, AlertTriangle, Sparkles, RefreshCw, DollarSign,
  Send, CheckCircle, Loader2, Pin, Mail, Users, User, Crown,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { Skeleton } from '@/components/creatyng';
import { useI18n } from '@/i18n';

type NotifType = 'info' | 'warning' | 'promo' | 'update' | 'billing';
type Recipients = 'all' | 'free' | 'paid' | 'specific';

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; label: string }> = {
  info: { icon: Info, color: '#3B82F6', label: 'admin.notif.type.info' },
  warning: { icon: AlertTriangle, color: '#F59E0B', label: 'admin.notif.type.warning' },
  promo: { icon: Sparkles, color: '#8B5CF6', label: 'admin.notif.type.promo' },
  update: { icon: RefreshCw, color: '#10B981', label: 'admin.notif.type.update' },
  billing: { icon: DollarSign, color: '#F97316', label: 'admin.notif.type.billing' },
};

const RECIPIENT_CONFIG: Record<Recipients, { icon: React.ElementType; label: string }> = {
  all: { icon: Users, label: 'admin.notif.rec.all' },
  free: { icon: User, label: 'admin.notif.rec.free' },
  paid: { icon: Crown, label: 'admin.notif.rec.paid' },
  specific: { icon: User, label: 'admin.notif.rec.specific' },
};

type HistoryItem = { id: string; type: string; recipients: string; title: string; message: string; send_email: boolean; pinned: boolean; sent_by: string | null; created_at: string };

const cardStyle: React.CSSProperties = { background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const thStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.06)' };
const tdStyle: React.CSSProperties = { padding: '11px 20px', fontSize: 13, color: '#1A1A1A', borderBottom: '1px solid rgba(0,0,0,0.04)' };

export default function AdminNotifications() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Form state
  const [type, setType] = useState<NotifType>('info');
  const [recipients, setRecipients] = useState<Recipients>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [pinned, setPinned] = useState(false);
  const [sending, setSending] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    adminService.fetchNotifications().then((data) => {
      setHistory(data as HistoryItem[]);
      setTimeout(() => setLoading(false), 400);
    });
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending('loading');
    try {
      await adminService.createNotification({ type, recipients, title, message, send_email: false, pinned });
      setSending('success');
      // Refresh history
      const fresh = await adminService.fetchNotifications();
      setHistory(fresh as HistoryItem[]);
      // Reset form after 1.5s
      setTimeout(() => {
        setSending('idle');
        setTitle('');
        setMessage('');
        setPinned(false);
      }, 1500);
    } catch {
      setSending('idle');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton height="380px" rounded className="rounded-xl" />
          <Skeleton height="380px" rounded className="rounded-xl" />
        </div>
        <Skeleton height="260px" rounded className="rounded-xl" />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid rgba(0,0,0,0.1)', background: '#ffffff',
    color: '#1A1A1A', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };

  const typeConf = TYPE_CONFIG[type];
  const TypeIcon = typeConf.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Compose + Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Compose Form */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell style={{ width: 15, height: 15, color: '#F97316' }} />
            {t('admin.notif.send_title')}
          </div>

          {/* Type selector */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{t('admin.notif.field_type')}</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.keys(TYPE_CONFIG) as NotifType[]).map((nt) => {
                const conf = TYPE_CONFIG[nt];
                const Icon = conf.icon;
                const active = type === nt;
                return (
                  <button key={nt} onClick={() => setType(nt)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                    background: active ? `${conf.color}12` : 'transparent',
                    border: active ? `1px solid ${conf.color}33` : '1px solid transparent',
                    color: active ? conf.color : '#9CA3AF',
                  }}>
                    <Icon style={{ width: 13, height: 13 }} />
                    {t(conf.label)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipients selector */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{t('admin.notif.field_recipients')}</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.keys(RECIPIENT_CONFIG) as Recipients[]).map((r) => {
                const conf = RECIPIENT_CONFIG[r];
                const Icon = conf.icon;
                const active = recipients === r;
                return (
                  <button key={r} onClick={() => setRecipients(r)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
                    background: active ? '#FFF0EA' : 'transparent',
                    border: active ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent',
                    color: active ? '#F97316' : '#9CA3AF',
                  }}>
                    <Icon style={{ width: 13, height: 13 }} />
                    {t(conf.label)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{t('admin.notif.field_title')}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('admin.notif.title_ph')}
              style={inputStyle}
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{t('admin.notif.field_message')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('admin.notif.message_ph')}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
            />
          </div>

          {/* Pin toggle */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: '#6B7280' }}>
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} style={{ accentColor: '#F97316' }} />
              <Pin style={{ width: 13, height: 13 }} />
              {t('admin.notif.pin')}
            </label>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending !== 'idle' || !title.trim() || !message.trim()}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 9, border: 'none',
              background: sending === 'success' ? '#10B981' : (!title.trim() || !message.trim()) ? 'rgba(0,0,0,0.08)' : 'linear-gradient(135deg, #F97316, #FB923C)',
              color: sending === 'success' ? '#fff' : (!title.trim() || !message.trim()) ? '#9CA3AF' : '#fff',
              fontSize: 13, fontWeight: 600, cursor: sending !== 'idle' || !title.trim() || !message.trim() ? 'default' : 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 180ms',
            }}
          >
            {sending === 'loading' && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
            {sending === 'success' && <CheckCircle style={{ width: 14, height: 14 }} />}
            {sending === 'idle' && <Send style={{ width: 14, height: 14 }} />}
            {sending === 'loading' ? t('admin.notif.sending') : sending === 'success' ? t('admin.notif.sent') : t('admin.notif.send_btn')}
          </button>
        </div>

        {/* Preview */}
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 16 }}>{t('admin.notif.preview_title')}</div>
          <div style={{
            background: '#FAFAF8', borderRadius: 12, padding: 16, minHeight: 180,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* Simulated notification card */}
            <div style={{
              background: '#ffffff', borderRadius: 10, padding: '12px 14px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', gap: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${typeConf.color}15`,
              }}>
                <TypeIcon style={{ width: 15, height: 15, color: typeConf.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                    {title || t('admin.notif.preview_title_default')}
                  </span>
                  {pinned && <Pin style={{ width: 11, height: 11, color: '#F97316' }} />}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
                  {message || t('admin.notif.preview_body_default')}
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>{t('admin.notif.now')}</div>
              </div>
            </div>

            {/* Meta info */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: `${typeConf.color}12`, color: typeConf.color }}>
                {t(typeConf.label)}
              </span>
              <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: 'rgba(249,115,22,0.08)', color: '#F97316' }}>
                {t(RECIPIENT_CONFIG[recipients].label)}
              </span>
              {pinned && (
                <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: 'rgba(249,115,22,0.08)', color: '#F97316' }}>
                  {t('admin.notif.pinned')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* History table */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, overflow: 'hidden', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{t('admin.notif.history_title')}</div>
        <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse' }}>
          <thead><tr>
            {[t('admin.notif.field_type'), t('admin.notif.field_title'), t('admin.notif.col.recipients'), t('admin.users.columns.email'), t('admin.notif.pinned'), t('admin.col.date')].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {history.map((item) => {
              const conf = TYPE_CONFIG[(item.type as NotifType)] || TYPE_CONFIG.info;
              const Icon = conf.icon;
              const recConf = RECIPIENT_CONFIG[(item.recipients as Recipients)] || RECIPIENT_CONFIG.all;
              return (
                <tr key={item.id} style={{ transition: 'background 100ms' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,0,0,0.015)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 5, fontSize: 10.5, fontWeight: 600, background: `${conf.color}12`, color: conf.color }}>
                      <Icon style={{ width: 11, height: 11 }} />
                      {t(conf.label)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{item.message.slice(0, 60)}{item.message.length > 60 ? '...' : ''}</div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>{t(recConf.label)}</span>
                  </td>
                  <td style={tdStyle}>
                    {item.send_email ? (
                      <Mail style={{ width: 13, height: 13, color: '#3B82F6' }} />
                    ) : (
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {item.pinned ? (
                      <Pin style={{ width: 13, height: 13, color: '#F97316' }} />
                    ) : (
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 11 }}>
                    {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
            {history.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '24px 20px' }}>
                  {t('admin.notif.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
