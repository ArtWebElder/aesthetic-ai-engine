import { useState, useEffect } from 'react';
import { MessageCircle, Search, Rocket, Paintbrush, MessageSquare, CreditCard, UserCircle, HelpCircle, Sparkles } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useI18n } from '@/i18n';

interface Article {
  id: string;
  titleKey: string;
  contentKey: string;
  category: string;
}

const ARTICLES: Article[] = [
  { id: 'gs-1', titleKey: 'help.article.gs1.title', contentKey: 'help.article.gs1.content', category: 'getting_started' },
  { id: 'cr-1', titleKey: 'help.article.cr1.title', contentKey: 'help.article.cr1.content', category: 'creating' },
  { id: 'ps-1', titleKey: 'help.article.ps1.title', contentKey: 'help.article.ps1.content', category: 'presets' },
  { id: 'ch-1', titleKey: 'help.article.ch1.title', contentKey: 'help.article.ch1.content', category: 'chat' },
  { id: 'cd-1', titleKey: 'help.article.cd1.title', contentKey: 'help.article.cd1.content', category: 'credits' },
  { id: 'ac-1', titleKey: 'help.article.ac1.title', contentKey: 'help.article.ac1.content', category: 'account' },
  { id: 'faq-1', titleKey: 'help.article.faq1.title', contentKey: 'help.article.faq1.content', category: 'faq' },
];

const CATEGORIES = [
  { id: 'all', label: 'help.category.all', icon: HelpCircle },
  { id: 'getting_started', label: 'help.category.getting_started', icon: Rocket },
  { id: 'creating', label: 'help.category.creating', icon: Sparkles },
  { id: 'presets', label: 'help.category.presets', icon: Paintbrush },
  { id: 'chat', label: 'help.category.chat', icon: MessageSquare },
  { id: 'credits', label: 'help.category.credits', icon: CreditCard },
  { id: 'account', label: 'help.category.account', icon: UserCircle },
];

const faqItems = [
  { q: 'help.faq.credits_q', a: 'help.faq.credits_a' },
  { q: 'help.faq.formats_q', a: 'help.faq.formats_a' },
  { q: 'help.faq.byok_q', a: 'help.faq.byok_a' },
  { q: 'help.faq.export_q', a: 'help.faq.export_a' },
  { q: 'help.faq.free_q', a: 'help.faq.free_a' },
];

const Help = () => {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const filtered = ARTICLES.filter((a) => {
    const matchCat = activeCategory === 'all' || a.category === activeCategory;
    const matchSearch = !search || t(a.titleKey).toLowerCase().includes(search.toLowerCase()) || t(a.contentKey).toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100%', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: isMobile ? '100%' : 240, minWidth: isMobile ? 'auto' : 240,
        padding: isMobile ? '14px 12px' : '28px 16px',
        borderRight: isMobile ? 'none' : '1px solid hsl(var(--border))',
        borderBottom: isMobile ? '1px solid hsl(var(--border))' : 'none',
        background: 'hsl(var(--card) / 0.7)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: isMobile ? 12 : 20, padding: '0 8px' }}>
          {t('help.title')}
        </h2>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? 6 : 0, overflowX: isMobile ? 'auto' : 'visible' }}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: isMobile ? 'auto' : '100%',
                flexShrink: 0, whiteSpace: 'nowrap',
                padding: '9px 12px', borderRadius: 8, marginBottom: isMobile ? 0 : 2, cursor: 'pointer',
                background: active ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                border: active ? '1px solid hsl(var(--primary) / 0.2)' : '1px solid transparent',
                color: active ? 'hsl(var(--brand))' : 'hsl(var(--muted-foreground))',
                fontWeight: active ? 600 : 400, fontSize: 13.5, fontFamily: 'inherit',
                transition: 'all 150ms',
              }}
            >
              <Icon size={16} />
              {t(cat.label)}
            </button>
          );
        })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: isMobile ? '18px 16px 40px' : '28px 36px 48px', overflowY: 'auto' }}>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 480, marginBottom: 28 }}>
          <Search style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 16, height: 16, color: 'hsl(var(--muted-foreground))',
          }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('help.search_placeholder')}
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10,
              fontSize: 14, fontFamily: 'inherit',
              border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Articles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
          {filtered.map((article) => (
            <div
              key={article.id}
              style={{
                padding: '20px 24px', borderRadius: 12,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 8 }}>
                {t(article.titleKey)}
              </h3>
              <p style={{
                fontSize: 13.5, color: 'hsl(var(--muted-foreground))',
                lineHeight: 1.6, whiteSpace: 'pre-line',
              }}>
                {t(article.contentKey)}
              </p>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{
              padding: 32, textAlign: 'center',
              color: 'hsl(var(--muted-foreground))', fontSize: 13.5,
            }}>
              {t('help.no_articles')}
            </div>
          )}
        </div>

        {/* FAQ section */}
        {(activeCategory === 'all' || activeCategory === 'faq') && (
          <div style={{ marginTop: 40, maxWidth: 640 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'hsl(var(--foreground))' }}>
              {t('help.category.faq')}
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
                    {t(faq.q)}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {t(faq.a)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Contact support */}
        <div style={{
          marginTop: 40, padding: 24, borderRadius: 12, textAlign: 'center',
          border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
          maxWidth: 640,
        }}>
          <MessageCircle style={{ width: 24, height: 24, color: 'hsl(var(--muted-foreground))', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t('help.more_help_title')}</h3>
          <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 16 }}>{t('help.more_help_subtitle')}</p>
          <a
            href="mailto:support@creatyng.com"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 8,
              border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))', fontSize: 13.5, fontWeight: 500,
              textDecoration: 'none', fontFamily: 'inherit',
            }}
          >
            <MessageCircle size={15} />
            support@creatyng.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default Help;
