import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Camera, Palette, Layers, Star, Film, Copy, Maximize2, Smartphone, RefreshCw,
} from 'lucide-react';
import { useI18n } from '@/i18n';

/* ── Template data ───────────────────────────────────── */
type TemplateCategory = 'all' | 'food' | 'design' | 'video' | 'utility';

interface TemplateItem {
  id: string;
  title: string;
  desc: string;
  category: Exclude<TemplateCategory, 'all'>;
  gradient: [string, string];
  Icon: React.FC<{ size?: number; stroke?: string; strokeWidth?: number }>;
  tag: 'Popular' | 'Novo' | 'Em breve';
  credits: number;
  active: boolean;
}

const TEMPLATES: TemplateItem[] = [
  {
    id: 'food-pop', title: 'Food / Pop', desc: 'Gera cenas cinematográficas com seu produto real. Iluminação profissional, ingredientes voando e tipografia de agência.',
    category: 'food', gradient: ['#ff713d', '#FFB088'], Icon: Camera, tag: 'Popular', credits: 5, active: true,
  },
  {
    id: 'pop-design', title: 'Pop Design', desc: 'Subject isolado com remoção de fundo automática, cores vibrantes e tipografia decorativa gigante.',
    category: 'design', gradient: ['#7C3AED', '#C084FC'], Icon: Palette, tag: 'Novo', credits: 8, active: true,
  },
  {
    id: 'editorial', title: 'Editorial', desc: 'Layout elegante estilo revista premium com composição sofisticada e tipografia refinada.',
    category: 'design', gradient: ['#1E293B', '#64748B'], Icon: Layers, tag: 'Em breve', credits: 6, active: false,
  },
  {
    id: 'neon', title: 'Neon Glow', desc: 'Efeito néon vibrante com brilhos, reflexos e atmosfera noturna para destaque máximo.',
    category: 'food', gradient: ['#06B6D4', '#818CF8'], Icon: Star, tag: 'Em breve', credits: 7, active: false,
  },
  {
    id: 'ugc-video', title: 'UGC Product Video', desc: 'Cria vídeos estilo conteúdo orgânico com pessoas reais apresentando seu produto.',
    category: 'video', gradient: ['#EC4899', '#F9A8D4'], Icon: Film, tag: 'Em breve', credits: 12, active: false,
  },
  {
    id: 'ad-cloner', title: 'Clone de Anúncio', desc: 'Transforma o anúncio de referência em um criativo novo com a identidade da sua marca.',
    category: 'design', gradient: ['#F59E0B', '#FCD34D'], Icon: Copy, tag: 'Em breve', credits: 10, active: false,
  },
  {
    id: 'resizer', title: 'Multi-Formato', desc: 'Converte seu criativo para múltiplos formatos e proporções sem regenerar a imagem.',
    category: 'utility', gradient: ['#10B981', '#6EE7B7'], Icon: Maximize2, tag: 'Em breve', credits: 2, active: false,
  },
  {
    id: 'statics-reels', title: 'Estáticos para Reels', desc: 'Transforma seus criativos estáticos em vídeos com movimento e elementos dinâmicos.',
    category: 'video', gradient: ['#8B5CF6', '#DDD6FE'], Icon: RefreshCw, tag: 'Em breve', credits: 10, active: false,
  },
  {
    id: 'mockup', title: 'Mockup de Tela', desc: 'Gera fotos do seu produto ou tela de app em contexto realista com pessoas e cenários.',
    category: 'utility', gradient: ['#0EA5E9', '#BAE6FD'], Icon: Smartphone, tag: 'Em breve', credits: 6, active: false,
  },
];

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'food', label: 'Food' },
  { id: 'design', label: 'Design' },
  { id: 'video', label: 'Vídeo' },
  { id: 'utility', label: 'Utilidades' },
];

/* ── Template Card ───────────────────────────────────── */
function TemplateCard({ tmpl, i, ready }: { tmpl: TemplateItem; i: number; ready: boolean }) {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();
  const coming = tmpl.tag === 'Em breve';

  return (
    <div
      style={{
        background: '#ffffff', borderRadius: 14, overflow: 'hidden',
        border: hov && !coming ? '1.5px solid #ff713d' : '1px solid rgba(20,20,23,0.06)',
        boxShadow: '0 1px 3px rgba(20,20,23,0.04)', cursor: coming ? 'default' : 'pointer',
        transition: 'all 200ms ease', opacity: coming ? 0.75 : 1,
        ...(hov && !coming ? { background: 'linear-gradient(180deg, #FFF0EA 0%, #ffffff 40%)' } : {}),
        animation: ready ? `scIn 340ms ${60 + i * 40}ms ease both` : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => !coming && navigate('/app/create')}
    >
      {/* Image area */}
      <div style={{
        height: 155, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${tmpl.gradient[0]}, ${tmpl.gradient[1]})`,
      }}>
        {/* Decorative icon */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          <tmpl.Icon size={40} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
        </div>
        {/* Decorative shapes */}
        <div style={{ position: 'absolute', top: '20%', right: '15%', width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: 35, height: 35, borderRadius: 8, background: 'rgba(255,255,255,0.06)', transform: 'rotate(15deg)' }} />
        {/* Glass reflection */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)' }} />
        {/* Tag badge */}
        {tmpl.tag && (
          <div style={{
            position: 'absolute', top: 10, right: 10, padding: '3px 9px', borderRadius: 6,
            fontSize: 10, fontWeight: 600, zIndex: 2,
            background: tmpl.tag === 'Popular' ? '#ff713d' : tmpl.tag === 'Novo' ? '#7C3AED' : 'rgba(255,255,255,0.15)',
            color: '#fff',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>{tmpl.tag}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#141417', lineHeight: 1.2 }}>{tmpl.title}</h3>
          {!coming && (
            <span style={{ fontSize: 10.5, color: '#8e8e96', background: '#f5f5f3', padding: '2px 7px', borderRadius: 4, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {tmpl.credits} créditos
            </span>
          )}
        </div>
        <p style={{
          fontSize: 12, color: '#5a5a60', lineHeight: 1.45, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        } as React.CSSProperties}>{tmpl.desc}</p>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────── */
const Templates = () => {
  const { t } = useI18n();
  const [category, setCategory] = useState<TemplateCategory>('all');
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  const filtered = useMemo(() => {
    return TEMPLATES.filter((tmpl) => {
      if (category !== 'all' && tmpl.category !== category) return false;
      if (search && !tmpl.title.toLowerCase().includes(search.toLowerCase()) && !tmpl.desc.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category, search]);

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M48 0H0v48' fill='none' stroke='rgba(255,113,61,0.14)' stroke-width='0.6'/%3E%3C/svg%3E")`;

  return (
    <div style={{ fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif", minHeight: '100%', color: '#141417' }}>
      <style>{`
        @keyframes fdUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        input:focus{outline:none}
      `}</style>

      {/* Hero banner */}
      <div style={{
        padding: '40px 36px 32px', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255,113,61,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(20,20,23,0.06)',
        animation: ready ? 'fdUp 450ms ease both' : 'none',
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#141417', marginBottom: 6 }}>
          Explore os templates do Creatyng
        </h1>
        <p style={{ fontSize: 14.5, color: '#5a5a60', maxWidth: 440, margin: '0 auto' }}>
          Encontre o tipo de criativo ideal para seu negócio. Comece a criar.
        </p>
      </div>

      {/* Filters + Search (sticky) */}
      <div style={{
        padding: '18px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(20,20,23,0.06)', background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        position: 'sticky', top: 56, zIndex: 10,
        animation: ready ? 'fdUp 450ms 60ms ease both' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: '#8e8e96', marginRight: 4 }}>Filtrar</span>
          {CATEGORIES.map(c => {
            const active = category === c.id;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                border: active ? '1.5px solid #ff713d' : '1px solid rgba(20,20,23,0.06)',
                background: active ? '#FFF0EA' : '#ffffff',
                color: active ? '#ff713d' : '#5a5a60', fontWeight: active ? 600 : 400,
                fontSize: 12.5, transition: 'all 150ms',
              }}>{c.label}</button>
            );
          })}
        </div>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px',
          background: '#ffffff', borderRadius: 8, border: '1px solid rgba(20,20,23,0.1)', width: 200, flexShrink: 0,
        }}>
          <Search size={14} color="#b5b5bb" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar template..."
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12.5, fontFamily: 'inherit', color: '#141417' }}
          />
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '24px 36px 48px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8e8e96' }}>
            <Search size={36} color="#b5b5bb" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Nenhum template encontrado</div>
            <div style={{ fontSize: 13 }}>Tente ajustar os filtros ou o termo de busca.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {filtered.map((tmpl, i) => <TemplateCard key={tmpl.id} tmpl={tmpl} i={i} ready={ready} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
