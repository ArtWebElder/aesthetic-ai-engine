// src/features/editor/engine/chatParser.ts
// CREATYNG — Chat Refinement Parser
// Interpreta comandos do usuário em mudanças no state do criativo.
// Zero IA, zero tokens — tudo local com regex e keywords.

export interface ChatCommand {
  type:
    | "change_text"
    | "change_color"
    | "change_size"
    | "change_position"
    | "change_font"
    | "regenerate_image"
    | "unknown";
  target?:
    | "headline"
    | "subheadline"
    | "cta"
    | "price"
    | "whatsapp"
    | "instagram"
    | "accent"
    | "badge"
    | "all";
  value?: string;
  description: string; // descrição legível do que foi interpretado
}

export function parseChat(input: string): ChatCommand {
  const text = input.trim().toLowerCase();
  const original = input.trim();

  // ── TROCAR TEXTOS ─────────────────────────────────────────────────────────

  const headlinePatterns = [
    /(?:muda|troca|altera|coloca|põe?|mude)\s*(?:a?\s*)?(?:headline|título|titulo|chamada|texto\s*principal)\s*(?:pra|para|por|:)\s*(.+)/i,
    /(?:headline|título|titulo)\s*[:=]\s*(.+)/i,
    /(?:quero|coloca)\s*(?:como\s*)?(?:headline|título|titulo)\s*[:=]?\s*(.+)/i,
  ];
  for (const pat of headlinePatterns) {
    const match = original.match(pat);
    if (match) return { type: "change_text", target: "headline", value: match[1].trim(), description: `Headline → "${match[1].trim()}"` };
  }

  const subPatterns = [
    /(?:muda|troca|altera|coloca)\s*(?:o?\s*)?(?:sub\s*(?:titulo|título|headline|texto)|texto\s*secundário|descrição|descricao)\s*(?:pra|para|por|:)\s*(.+)/i,
    /(?:sub\s*(?:headline|titulo|título)|descrição)\s*[:=]\s*(.+)/i,
  ];
  for (const pat of subPatterns) {
    const match = original.match(pat);
    if (match) return { type: "change_text", target: "subheadline", value: match[1].trim(), description: `Subheadline → "${match[1].trim()}"` };
  }

  const ctaPatterns = [
    /(?:muda|troca|altera|coloca)\s*(?:o?\s*)?(?:cta|botão|botao|call\s*to\s*action|ação)\s*(?:pra|para|por|:)\s*(.+)/i,
    /(?:cta|botão|botao)\s*[:=]\s*(.+)/i,
  ];
  for (const pat of ctaPatterns) {
    const match = original.match(pat);
    if (match) return { type: "change_text", target: "cta", value: match[1].trim(), description: `CTA → "${match[1].trim()}"` };
  }

  const pricePatterns = [
    /(?:muda|troca|altera|coloca)\s*(?:o?\s*)?(?:preço|preco|valor|price)\s*(?:pra|para|por|:)\s*[R$]*\s*(.+)/i,
    /(?:preço|preco|valor|price)\s*[:=]\s*[R$]*\s*(.+)/i,
  ];
  for (const pat of pricePatterns) {
    const match = original.match(pat);
    if (match) return { type: "change_text", target: "price", value: match[1].trim(), description: `Preço → R$ ${match[1].trim()}` };
  }

  const whatsPatterns = [
    /(?:muda|troca|altera)\s*(?:o?\s*)?(?:whatsapp|whats|telefone|fone|celular|número|numero)\s*(?:pra|para|por|:)\s*(.+)/i,
    /(?:whatsapp|whats|telefone)\s*[:=]\s*(.+)/i,
  ];
  for (const pat of whatsPatterns) {
    const match = original.match(pat);
    if (match) return { type: "change_text", target: "whatsapp", value: match[1].trim(), description: `WhatsApp → ${match[1].trim()}` };
  }

  const instaPatterns = [
    /(?:muda|troca|altera)\s*(?:o?\s*)?(?:instagram|insta|@|perfil|arroba)\s*(?:pra|para|por|:)\s*(.+)/i,
    /(?:instagram|insta)\s*[:=]\s*(.+)/i,
  ];
  for (const pat of instaPatterns) {
    const match = original.match(pat);
    if (match) return { type: "change_text", target: "instagram", value: match[1].trim().replace(/^@/, ""), description: `Instagram → @${match[1].trim().replace(/^@/, "")}` };
  }

  // ── MUDAR CORES ───────────────────────────────────────────────────────────

  const colorMap: Record<string, string> = {
    vermelho: "#E53935", red: "#E53935",
    azul: "#1E88E5", blue: "#1E88E5",
    verde: "#43A047", green: "#43A047",
    amarelo: "#FDD835", yellow: "#FDD835",
    laranja: "#FB8C00", orange: "#FB8C00",
    roxo: "#8E24AA", purple: "#8E24AA",
    rosa: "#D81B60", pink: "#D81B60",
    preto: "#212121", black: "#212121",
    branco: "#FFFFFF", white: "#FFFFFF",
    dourado: "#D4A853", gold: "#D4A853",
    marrom: "#6D4C41", brown: "#6D4C41",
    cinza: "#757575", gray: "#757575",
    coral: "#FF7043",
    turquesa: "#26A69A", teal: "#26A69A",
    vinho: "#880E4F", wine: "#880E4F",
    bege: "#D7CCC8", beige: "#D7CCC8",
  };

  const colorPatterns = [
    /(?:muda|troca|altera|coloca|quero)\s*(?:a?\s*)?(?:cor|color)\s*(?:do\s*)?(?:accent|destaque|principal|badge|botão|cta)?\s*(?:pra|para|por|:)?\s*(\w+)/i,
    /(?:accent|destaque)\s*(?:em|:)?\s*(\w+)/i,
    /(?:quero|usa|coloca)\s*(?:tudo\s*)?(?:em\s*)?(\w+)\s*(?:como\s*cor)?/i,
  ];
  for (const pat of colorPatterns) {
    const match = text.match(pat);
    if (match) {
      const colorName = match[1].toLowerCase();
      const hex = colorMap[colorName];
      if (hex) return { type: "change_color", target: "accent", value: hex, description: `Cor accent → ${colorName} (${hex})` };
      if (/^#[0-9a-f]{6}$/i.test(match[1])) return { type: "change_color", target: "accent", value: match[1], description: `Cor accent → ${match[1]}` };
    }
  }

  // ── AJUSTAR TAMANHO ───────────────────────────────────────────────────────

  if (/(?:aumenta|maior|grande|bigger|larger)\s*(?:o?\s*)?(?:headline|título|titulo|texto|tudo)?/i.test(text)) {
    return { type: "change_size", target: "headline", value: "up", description: "Headline +15% maior" };
  }
  if (/(?:diminui|menor|pequeno|smaller|reduce)\s*(?:o?\s*)?(?:headline|título|titulo|texto|tudo)?/i.test(text)) {
    return { type: "change_size", target: "headline", value: "down", description: "Headline -15% menor" };
  }

  // ── MUDAR POSIÇÃO ─────────────────────────────────────────────────────────

  const positionMap: Record<string, string> = {
    cima: "top", topo: "top", top: "top", acima: "top",
    centro: "center", meio: "center", center: "center", middle: "center",
    baixo: "bottom", embaixo: "bottom", bottom: "bottom", abaixo: "bottom",
    esquerda: "left", left: "left",
    direita: "right", right: "right",
  };
  const posPatterns = [
    /(?:coloca|move|muda|põe?)\s*(?:o?\s*)?(?:headline|texto|título|badge|preço)\s*(?:pra|para|no|na|em)\s*(?:a?\s*)?(\w+)/i,
    /(?:headline|texto|badge)\s*(?:no|na|em)\s*(\w+)/i,
  ];
  for (const pat of posPatterns) {
    const match = text.match(pat);
    if (match) {
      const pos = positionMap[match[1].toLowerCase()];
      if (pos) return { type: "change_position", target: "headline", value: pos, description: `Posição → ${pos}` };
    }
  }

  // ── TROCAR FONTE ──────────────────────────────────────────────────────────

  const fontMap: Record<string, string> = {
    montserrat: "Montserrat",
    roboto: "Roboto",
    poppins: "Poppins",
    inter: "Inter",
    oswald: "Oswald",
    playfair: "Playfair Display",
    bebas: "Bebas Neue",
    anton: "Anton",
    lato: "Lato",
    raleway: "Raleway",
    "dm sans": "DM Sans",
    "work sans": "Work Sans",
    "space grotesk": "Space Grotesk",
    outfit: "Outfit",
  };
  const fontPatterns = [
    /(?:muda|troca|usa|coloca)\s*(?:a?\s*)?(?:fonte|font|tipografia)\s*(?:pra|para|por|:)?\s*(.+)/i,
    /(?:fonte|font)\s*[:=]\s*(.+)/i,
  ];
  for (const pat of fontPatterns) {
    const match = original.match(pat);
    if (match) {
      const fontName = match[1].trim().toLowerCase();
      const font = fontMap[fontName] ?? match[1].trim();
      return { type: "change_font", target: "all", value: font, description: `Fonte → ${font}` };
    }
  }

  // ── REGENERAR IMAGEM ──────────────────────────────────────────────────────

  if (/(?:regerar?|refaz|gera?\s*(?:de\s*)?novo|regenera|nova\s*imagem|outra\s*imagem)/i.test(text)) {
    return { type: "regenerate_image", description: "Regenerar imagem (mantendo textos)" };
  }

  // ── NÃO ENTENDEU ──────────────────────────────────────────────────────────

  return {
    type: "unknown",
    description: 'Não entendi. Tente: "muda headline pra X", "cor vermelha", "fonte Poppins", "texto maior"',
  };
}
