# CREATYNG — Brief de Design (handoff p/ atualização visual completa)

> **Para quem desenha (Claude Design):** este doc define o que precisamos receber de volta
> para reimplementar o visual da plataforma de forma limpa, num lugar só, sem retrabalho.
> Devolva **tokens + specs de componente + (opcional) mockups por tela** no formato da seção 10.
>
> **Para quem implementa (Claude Code):** ao receber a resposta, mapear os tokens nas CSS
> variables de `src/index.css` e nas specs do `tailwind.config.ts`. Ver `docs/THEME.md`.

---

## 1. Produto & contexto
**Creatyng** — SaaS premium de criação visual com IA (app.creatyng.com). O usuário preenche
campos simples e recebe um criativo nível agência. Público global (EN, PT-BR, ES).
Tom da marca: **premium, confiável, moderno, criativo** — laranja vibrante sobre superfícies claras.

## 2. Stack & restrições técnicas (importante p/ entregar implementável)
- React + TypeScript + **Tailwind CSS** + **shadcn-ui** (Radix). Ícones: **lucide-react**.
- Tema por **CSS variables** (`:root` claro / `.dark` escuro) + `next-themes` (toggle claro/escuro/auto).
- Cores em **HSL triplet** (ex.: `--brand: 16 100% 62%`) p/ suportar opacidade `hsl(var(--brand) / 0.3)`.
- Fontes atuais: **Instrument Sans** (corpo) + **Outfit** (títulos) + Inter (fallback). Pode propor troca.
- Muitos componentes usam **inline style** hoje; estamos migrando p/ tokens. Entregar **valores de token**, não CSS por elemento.

## 3. O que devolver — CONTRATO DE TOKENS
Preencher os valores (hex ou HSL — a gente converte). Claro **e** escuro.

### 3.1 Cores base (claro / escuro)
| Token | Uso | Claro | Escuro |
|---|---|---|---|
| background | fundo da página | | |
| foreground | texto principal | | |
| card | superfície de cards/modais | | |
| popover | dropdowns/menus | | |
| muted | superfície sutil | | |
| muted-foreground | texto secundário | | |
| border | bordas/divisores | | |
| input | fundo de inputs | | |
| ring | foco | | |
| destructive | erro/perigo | | |
| success / warning / info | estados | | |

### 3.2 Marca (laranja hoje) + gradientes
| Token | Valor | Notas |
|---|---|---|
| brand | (hoje #ff713d) | cor primária da marca |
| brand-2 | (hoje #FF9B70) | fim do gradiente |
| brand-foreground | (hoje #fff) | texto sobre a marca |
| brand-gradient | linear-gradient(...) | usado em botões primários, FABs |
| (estados) | hover / active / disabled da marca | |

### 3.3 Sombras / elevação (definir 3–4 níveis + glow da marca)
`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-brand` (glow laranja). Dar os valores `box-shadow`.

### 3.4 Radius
Raio base (`--radius`, hoje 0.625rem) + variações (sm/md/lg/full). Onde usar cada um.

### 3.5 Tipografia
Família(s), escala (display/h1..h6/body/caption: tamanho, peso, line-height, tracking), e fonte de números.

### 3.6 Spacing & densidade
Escala de espaçamento (4/8/12/16/24…), densidade (compacto vs confortável), grid/gutters.

### 3.7 Motion
Durações + easings (entrada/saída de modal, toast, dropdown, hover). Já temos keyframes; pode redefinir.

## 4. Componentes a especificar (com TODOS os estados)
Para cada um: default / hover / active / focus / disabled / loading (quando aplicável) + tamanhos.
- **Botão** (primário, secundário, ghost, outline, destrutivo; sm/md/lg; com ícone)
- **Input / Select / Textarea / Checkbox / Toggle / Slider**
- **Card** (superfície, header, padding, sombra)
- **Modal / Dialog / Bottom-sheet (mobile)**
- **Toast** (success/error/info; posição; duração)
- **Badge / Chip / Pill** (incl. "Novo", créditos, status)
- **Tabela** (header, linha, hover, zebra?) e **paginação**
- **Tabs / Segmented control**
- **Dropdown / Menu / Command palette (Cmd+K)**
- **Tooltip**, **Avatar**, **Skeleton/Loaders**, **Empty states**
- **Navegação**: sidebar (app), topbar, **barra inferior mobile**, sidebar do Admin
- **Studio node card** (estilo ComfyUI: header colorido por tipo, corpo, porta de conexão, botão Run, preview)

## 5. Telas a cobrir (inventário)
Auth/Login · Onboarding · **Dashboard** (cards de features + carrosséis + discover) · Projetos ·
Billing + modal de Recarga (Pix/cartão) · Configurações (4 abas) · Ajuda · **Studio** (canvas, nodes,
painéis, flow selector, modal de projetos) · **Wizard** /create (4 passos) · Refinamento (split + chat) ·
**Admin** (shell + Dashboard/Usuários/Financeiro/Gerações/Tokens/Notificações) · 404 · Chat de suporte (FAB).

## 6. Regras de UX a definir (a "constituição visual")
- Hierarquia (quando usar marca vs neutro), uso de gradiente (só CTAs primários?), uso de sombra/elevação.
- Estados vazios, loading e erro (padrão consistente).
- Densidade por contexto (Admin denso vs Dashboard arejado).
- Foco/acessibilidade (anel de foco, contraste mínimo AA).
- Microinterações (hover lift, transições) — sutis e premium.

## 7. Responsividade
- Breakpoint mobile: **≤ 767px**. Padrões já usados: sidebar→gaveta/faixa, tabelas→scroll horizontal,
  modais→bottom-sheet, barra de ação inferior. Inputs **16px** no mobile (anti-zoom iOS), safe-area.
- Definir comportamento responsivo dos componentes novos.

## 8. i18n & acessibilidade
- Texto em **EN / PT-BR / ES** — evitar larguras fixas (PT/ES são ~20% mais longos que EN).
- Contraste AA, foco visível, alvos de toque ≥ 40px no mobile.

## 9. Dark mode
Entregar a paleta **clara e escura** (a marca pode manter o mesmo laranja). É obrigatório.

## 10. Formato de entrega (o que mandar de volta)
Em ordem de preferência:
1. **Tabela de tokens / JSON / CSS variables** (cores, marca, gradiente, sombra, radius, tipo, spacing, motion) — claro e escuro. **Essencial.**
2. **Specs de componente** (seção 4) com estados — texto/tabela ou Figma.
3. **(Opcional) Mockups por tela** — **só** se a mudança alterar **layout/estrutura**. Preferência: **Figma**
   (temos integração Figma MCP e conseguimos puxar direto) ou HTML/CSS limpo. Não precisa 1 HTML por
   tela se o layout não muda — os tokens já reskinam tudo.

## 11. Gotchas — NÃO quebrar
- **Cores de dados concatenadas com alpha** (`${cor}25`) precisam ficar em **hex** (não aceitam `hsl(var())`).
  Locais: nodes/flows do Studio, PROJECT_COLORS, QUICK_ACTION_COLORS, cores de notificação, perfis do onboarding.
  → Se mudar a marca, atualizar esses hex também (lista em `docs/THEME.md`).
- Manter os **nomes** dos tokens existentes quando possível (menos refactor).
- Studio é estilo **ComfyUI** (node editor) — não transformar em wizard.

---

### Anexo — tokens atuais (referência rápida)
`src/index.css` `:root`: background `48 14% 97%`, foreground `0 0% 10%`, card `0 0% 100%`,
primary `24 95% 53%`, muted `220 14% 96%`, border `220 13% 91%`, radius `0.625rem`,
**brand `16 100% 62%` (#ff713d)**, brand-2 `18 100% 72%` (#FF9B70). Fontes: Instrument Sans + Outfit.
Detalhes e convenção de uso: `docs/THEME.md`.
