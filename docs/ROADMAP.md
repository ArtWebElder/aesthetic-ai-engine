# CREATYNG — Roadmap / Backlog de Tasks

> Plano vivo. Filosofia central: **produtos prontos, não IA solta.** O cliente lê
> poucas linhas, escolhe um TIPO (fluxo) → um ESTILO pré-moldado (subtipo), é guiado
> por 2-3 nodes + "Executar" e recebe um design completo. Tipos e subtipos ramificam
> infinitamente conforme as IAs avançam e o mercado pede.

## ✅ Concluído (em produção)
- 6 modos no Studio: Remover Fundo, Re-color, Thumbnail (OpenAI), Card de Citação, Headshot, Produto em Cena.
- Fundação de tiers (`featureTiers.ts`, Eco/Pro/Ultra + piso de margem).
- Thumbnail OpenAI (texto desenhado na imagem) + provider `openai-image` roteado por `module`.
- **Fase 0 — Sub-seletor de Estilos** do Thumbnail (categorias → estilos pré-moldados; 7 templates seed em `flowStyles.ts`). *Funciona; falta lapidar visual.*
- Fix Pix avulso (creditava só `credits` legado → agora `bonus_credits`).
- Admin: removidos mocks/fakes (Churn sempre-0, badges "+%" inventados, arrays mortos) → KPIs reais (MRR, Receita Total, Conversão de pagantes).

## ⏳ Falta VOCÊ (curto)
- Creditar sua conta: Admin → Ajustar Créditos → **Adicionar 90** (R$9,90 = 100 cr; você já pôs 10).
- Testar/validar ao vivo: os 6 modos + sub-seletor de estilos.
- (Opcional) Reativar auto-deploy Git na Vercel (GitHub App). Hoje deploy é por CLI e funciona.

## 🅿️ Parado (decisão consciente)
- **Híbrido do Thumbnail** (compositor multi-camada + multi-upload de logos/prints + multi-texto): pesado e alto-toque → só com ambiente **local + Chrome** ou decisão de investir dias.
- **Tiers premium / providers** (Upscale, Bria, InstantID, OpenAI fallback p/ outras features): quando o mercado pedir.

## 🔜 Backlog priorizado

### 1. Memória de projetos criados (alta prioridade)
- Salvar/carregar fluxos do usuário (nodes + conexões + estilo escolhido) no Supabase.
- Histórico de gerações por projeto (thumbnail X, banner Y) com preview.
- "Meus projetos" — abrir, duplicar, continuar de onde parou.
- *Por quê:* hoje o trabalho do usuário some ao recarregar. É base pra retenção.

### 2. Cards de features na Dashboard → abre o Studio (alta)
- Dashboard mostra um card por feature (descoberta de "novas features").
- Clicar no card → abre o **modal do Studio já na categoria** (FlowSelector) → escolhe o estilo pré-moldado → carrega os nodes.
- Reaproveita o `FlowSelector` (categorias) + `flowStyles.ts` (subtipos).
- *Por quê:* é o funil de descoberta — guia o cliente pro produto pronto.

### 3. Mais estilos pré-moldados (contínuo)
- Gerar templates via prompt do Behance (ver `thumbnail.md` / `thumbnail-templates.md`).
- Adicionar styles a `flowStyles.ts` por feature (não só thumbnail).
- Cada feature nova nasce já com seu submenu de estilos.

### 4. Limpeza de ruído / bugs bobos (média, contínua)
- ✅ Admin: mocks de Churn/Conversão + badges "+%" fake removidos → KPIs reais (feito).
- ⏳ **Recarga real vs bônus:** usar `credit_history.type` como fonte + verificar/corrigir a CHECK constraint do `credit_history` (pode rejeitar `subscription`/`admin_bonus`). *— ainda aberto.*
- ⏳ **Node-add no canvas:** node nasce em posição fixa (ignora pan/zoom) → parece que "não adiciona". Nascer no centro da view atual. *— ainda aberto.*
- ⏳ **Lapidar o sub-seletor de estilos** (visual) + auditoria dos 17 nodes. *— ainda aberto.*

> Híbrido do Thumbnail e Tiers premium/providers → ver seção "🅿️ Parado" no topo.

## Notas de processo
- Deploy: frontend via `vercel --prod` (CLI); edge functions via `supabase functions deploy <nome>`. Git auto-deploy NÃO está ligado (webhook GitHub→Vercel inativo).
- Cada feature: preset + i18n (EN/PT/ES) + custo no `featureTiers` + playbook em `docs/playbooks/`.
