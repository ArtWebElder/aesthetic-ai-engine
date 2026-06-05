import { useEffect, useState } from 'react';
import { X, FolderOpen, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { listStudioProjects, deleteStudioProject, type StudioProject } from '@/services/studioProjects';

interface StudioProjectsModalProps {
  open: boolean;
  onClose: () => void;
  onOpenProject: (project: StudioProject) => void;
}

export function StudioProjectsModal({ open, onClose, onOpenProject }: StudioProjectsModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<StudioProject[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    listStudioProjects().then((rows) => {
      if (!cancelled) { setProjects(rows); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteStudioProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'hsl(var(--card))', borderRadius: 16, width: 520, maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif" }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{t('studio.projects.title')}</h3>
          <button onClick={onClose} aria-label={t('common.close')} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 13, padding: 24 }}>{t('studio.projects.loading')}</p>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <FolderOpen size={28} style={{ color: 'hsl(var(--muted-foreground))', margin: '0 auto 10px' }} />
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>{t('studio.projects.empty')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProject(p)}
                  style={{ position: 'relative', cursor: 'pointer', borderRadius: 12, overflow: 'hidden', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', transition: 'border-color 150ms' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#ff713d')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))')}
                >
                  <div style={{ height: 96, background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <FolderOpen size={24} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    )}
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 10.5, color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>{new Date(p.updated_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, p.id)}
                    aria-label={t('common.delete')}
                    style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
