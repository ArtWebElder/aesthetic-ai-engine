import { useEffect, useState } from 'react';
import { Bell, Send, Loader2, Trash2, X } from 'lucide-react';
import { adminService } from '@/services/adminService';

const TYPE_OPTIONS = [
  { value: 'info', label: 'Info', color: '#3b82f6' },
  { value: 'warning', label: 'Aviso', color: '#f59e0b' },
  { value: 'promo', label: 'Promo', color: '#10b981' },
  { value: 'update', label: 'Update', color: '#8b5cf6' },
  { value: 'billing', label: 'Billing', color: '#ec4899' },
];

const RECIPIENT_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Pagos (Pro+Team)' },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [recipients, setRecipients] = useState('all');
  const [sendEmail, setSendEmail] = useState(false);
  const [pinned, setPinned] = useState(false);

  async function loadNotifications() {
    setLoading(true);
    const data = await adminService.fetchNotifications();
    setNotifications(data);
    setLoading(false);
  }

  useEffect(() => { loadNotifications(); }, []);

  async function handleSend() {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    await adminService.createNotification({ type, recipients, title, message, send_email: sendEmail, pinned });
    setTitle('');
    setMessage('');
    setPinned(false);
    setSendEmail(false);
    setSending(false);
    loadNotifications();
  }

  async function handleDelete(id: string) {
    await adminService.deleteNotification(id);
    loadNotifications();
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fafafa', marginBottom: 16 }}>Notificações</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Compose */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={14} /> Nova Notificação</h3>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#71717a', marginBottom: 4, display: 'block' }}>Tipo</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {TYPE_OPTIONS.map(t => (
                <button key={t.value} onClick={() => setType(t.value)} style={{
                  flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  border: type === t.value ? `1px solid ${t.color}` : '1px solid #27272a',
                  background: type === t.value ? `${t.color}15` : 'transparent',
                  color: type === t.value ? t.color : '#71717a',
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#71717a', marginBottom: 4, display: 'block' }}>Destinatários</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {RECIPIENT_OPTIONS.map(r => (
                <button key={r.value} onClick={() => setRecipients(r.value)} style={{
                  flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  border: recipients === r.value ? '1px solid #ff713d' : '1px solid #27272a',
                  background: recipients === r.value ? '#ff713d15' : 'transparent',
                  color: recipients === r.value ? '#ff713d' : '#71717a',
                }}>{r.label}</button>
              ))}
            </div>
          </div>

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #27272a', background: '#09090b', color: '#fafafa', fontSize: 13, marginBottom: 8 }} />
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Mensagem..." rows={3} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #27272a', background: '#09090b', color: '#fafafa', fontSize: 13, marginBottom: 10, resize: 'vertical', fontFamily: 'inherit' }} />

          <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a1a1aa', cursor: 'pointer' }}>
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} /> Fixar
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a1a1aa', cursor: 'pointer' }}>
              <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} /> Enviar email
            </label>
          </div>

          <button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()} style={{
            width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: (sending || !title.trim()) ? '#27272a' : '#ff713d', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {sending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
            {sending ? 'Enviando...' : 'Enviar Notificação'}
          </button>
        </div>

        {/* History */}
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 12 }}>Histórico</h3>
          {loading ? (
            <p style={{ color: '#52525b', fontSize: 13 }}>Carregando...</p>
          ) : notifications.length === 0 ? (
            <p style={{ color: '#52525b', fontSize: 13 }}>Nenhuma notificação enviada</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
              {notifications.map((n, i) => {
                const typeOpt = TYPE_OPTIONS.find(t => t.value === n.type);
                return (
                  <div key={i} style={{ padding: '10px 12px', border: '1px solid #27272a', borderRadius: 8, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: typeOpt?.color || '#52525b' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>{n.title as string}</span>
                      {n.pinned && <span style={{ fontSize: 9, color: '#f59e0b' }}>📌</span>}
                    </div>
                    <p style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 4 }}>{n.message as string}</p>
                    <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#52525b' }}>
                      <span>{n.recipients as string}</span>
                      <span>{n.created_at ? new Date(n.created_at as string).toLocaleDateString('pt-BR') : ''}</span>
                    </div>
                    <button onClick={() => handleDelete(n.id as string)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
