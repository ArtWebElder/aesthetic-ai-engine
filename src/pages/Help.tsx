import { useState } from 'react';
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
  title: string;
  content: string;
  category: string;
}

const ARTICLES: Article[] = [
  {
    id: 'gs-1',
    title: 'Como começar no Creatyng',
    content: 'Após criar sua conta, acesse o painel e clique em "Novo Criativo". Você será guiado por um wizard de 4 passos: envie a foto do seu produto, escolha o estilo visual, preencha os textos e clique em Gerar. Em segundos, a IA entrega um criativo de nível agência.',
    category: 'getting_started',
  },
  {
    id: 'cr-1',
    title: 'Passo a passo: criando seu primeiro criativo',
    content: '1. Na tela "Criar", envie a foto do seu produto (PNG, JPG ou WEBP até 10MB).\n2. Escolha entre Food Pop (visuais vibrantes de comida) ou Pop Design (design gráfico ousado).\n3. Preencha o título, preço e CTA. A IA gera automaticamente a composição.\n4. Na tela de resultado, você pode exportar em 2K ou usar o chat de refinamento para ajustes.',
    category: 'creating',
  },
  {
    id: 'ps-1',
    title: 'Entendendo os presets de estilo',
    content: 'O Creatyng oferece presets de estilo que definem a atmosfera visual do seu criativo:\n- Food Pop: cores vibrantes, fundos energéticos, perfeito para restaurantes e delivery.\n- Pop Design: design gráfico ousado com elementos pop art, ideal para campanhas marcantes.\nCada preset configura automaticamente iluminação, paleta de cores e composição.',
    category: 'presets',
  },
  {
    id: 'ch-1',
    title: 'Como usar o chat de refinamento',
    content: 'Após gerar seu criativo, um chat de IA aparece na tela de resultado. Descreva o que quer ajustar: "mude a cor do fundo para azul", "aumente o texto", "adicione mais contraste". A IA interpretará sua instrução e gerará uma nova versão. Cada ajuste custa 1 crédito.',
    category: 'chat',
  },
  {
    id: 'cd-1',
    title: 'Como funcionam os créditos',
    content: 'Cada ação no Creatyng tem um custo em créditos:\n- Food Pop: 5 créditos por geração\n- Pop Design: 8 créditos\n- Chat de refinamento: 1 crédito por ajuste\n- Exportação: gratuita\nVocê recebe créditos conforme seu plano (Grátis: 100/mês, Pro: 1000/mês). Créditos extras podem ser comprados na página de Cobrança.',
    category: 'credits',
  },
  {
    id: 'ac-1',
    title: 'Configurações de conta e perfil',
    content: 'Acesse Configurações no menu lateral para:\n- Perfil: alterar nome, foto e telefone\n- Preferências: idioma, tema (claro/escuro), formato padrão\n- Brand Kit: configurar cores e fontes da sua marca\n- API Keys: gerenciar chaves de integração\nTodas as alterações são salvas automaticamente.',
    category: 'account',
  },
  {
    id: 'faq-1',
    title: 'Perguntas frequentes',
    content: 'Veja as perguntas mais comuns abaixo. Se não encontrar sua dúvida, entre em contato pelo support@creatyng.com.',
    category: 'faq',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: HelpCircle },
  { id: 'getting_started', label: 'Primeiros passos', icon: Rocket },
  { id: 'creating', label: 'Criar criativos', icon: Sparkles },
  { id: 'presets', label: 'Presets e estilos', icon: Paintbrush },
  { id: 'chat', label: 'Chat de refinamento', icon: MessageSquare },
  { id: 'credits', label: 'Créditos e planos', icon: CreditCard },
  { id: 'account', label: 'Conta e perfil', icon: UserCircle },
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

  const filtered = ARTICLES.filter((a) => {
    const matchCat = activeCategory === 'all' || a.category === activeCategory;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Instrument Sans','Inter',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: 240, minWidth: 240, padding: '28px 16px',
        borderRight: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card) / 0.7)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: 20, padding: '0 8px' }}>
          {t('help.title')}
        </h2>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 12px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
                background: active ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                border: active ? '1px solid hsl(var(--primary) / 0.2)' : '1px solid transparent',
                color: active ? '#F97316' : 'hsl(var(--muted-foreground))',
                fontWeight: active ? 600 : 400, fontSize: 13.5, fontFamily: 'inherit',
                transition: 'all 150ms',
              }}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '28px 36px 48px', overflowY: 'auto' }}>
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
                {article.title}
              </h3>
              <p style={{
                fontSize: 13.5, color: 'hsl(var(--muted-foreground))',
                lineHeight: 1.6, whiteSpace: 'pre-line',
              }}>
                {article.content}
              </p>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{
              padding: 32, textAlign: 'center',
              color: 'hsl(var(--muted-foreground))', fontSize: 13.5,
            }}>
              Nenhum artigo encontrado. Tente outra busca.
            </div>
          )}
        </div>

        {/* FAQ section */}
        {(activeCategory === 'all' || activeCategory === 'faq') && (
          <div style={{ marginTop: 40, maxWidth: 640 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'hsl(var(--foreground))' }}>
              Perguntas frequentes
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
