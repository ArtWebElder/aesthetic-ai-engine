// src/app/create/studio/flowStyles.ts
// CREATYNG Studio — pre-molded STYLE sub-types per flow.
//
// Philosophy: the client never writes a raw prompt. They pick a flow (type) and
// then a pre-molded STYLE (subtype) — e.g. Thumbnail → "Dramático" / "MrBeast" /
// "Jornalístico". Picking a style loads the flow with its fields pre-filled, so the
// client only fills the title/topic and hits "Executar". Styles branch infinitely
// over time. This registry is the seed; new styles are added as data.
//
// A style's `fields` are merged into the flow's text_input(fields) node on load
// (see StudioPage.loadFlow). Field VALUES are kept in English (they feed the image
// model); name/vibe are PT-BR labels for the card.

export interface StyleTemplate {
  id: string;
  name: string;
  vibe: string;
  color: string;
  fields: Record<string, string>; // merged into the flow's fields node (style/lighting/assets…)
}

export const FLOW_STYLES: Record<string, StyleTemplate[]> = {
  thumbnail: [
    {
      id: 'denuncia-escandalo-vermelha',
      name: 'Denúncia Explosiva',
      vibe: 'Denúncia investigativa com tensão e escândalo revelado',
      color: '#ef4444',
      fields: {
        style: 'dramatic investigative YouTube thumbnail, central cutout portrait, burning newspaper collage; huge bold sans title, white fill, red block, heavy shadow',
        lighting: 'fiery red backlight, high contrast shadows',
        assets: 'portrait cutout, burning newspapers, scandal headlines, red smoke, warning label',
      },
    },
    {
      id: 'misterio-xadrez-historico',
      name: 'Mistério Intelectual',
      vibe: 'Investigação histórica e estratégica com clima de enigma',
      color: '#06b6d4',
      fields: {
        style: 'cinematic chess mystery thumbnail, serious portrait, historical paper clippings; bold condensed title, white/yellow fill, dark outline',
        lighting: 'moody red and cyan rim lighting',
        assets: 'chess pieces, hanging portraits, question mark, red textured background',
      },
    },
    {
      id: 'bilionarios-segredo-hype',
      name: 'Segredo dos Bilionários',
      vibe: 'Finanças e poder com tom conspiratório e revelação chocante',
      color: '#dc2626',
      fields: {
        style: 'high energy billionaire collage, multiple cutout portraits, money background; massive bold italic title, white and red fill, 3D shadow',
        lighting: 'golden fire glow, intense rim lighting',
        assets: 'billionaire portraits, flying money, flames, dark red background, cash stacks',
      },
    },
    {
      id: 'mentalidade-bilionario-dourada',
      name: 'Mentalidade Bilionária',
      vibe: 'Motivacional financeiro premium, poder e ambição',
      color: '#eab308',
      fields: {
        style: 'luxury finance thumbnail, clean portrait on right, abstract gold background; huge bold block title, yellow fill, black outline, 3D depth',
        lighting: 'warm golden cinematic glow, soft highlights',
        assets: 'entrepreneur portrait, golden texture, finance chart lines, dark gradient',
      },
    },
    {
      id: 'design-secreto-verde',
      name: 'Método Secreto Design',
      vibe: 'Tutorial de design com estética digital neon',
      color: '#22c55e',
      fields: {
        style: 'modern graphic design tutorial thumbnail, designer cutout, Photoshop UI background; huge bold sans title, white and neon green fill, thick shadow',
        lighting: 'green neon glow, dark studio contrast',
        assets: 'designer portrait, Photoshop interface, tool icons, green particles, digital grid',
      },
    },
    {
      id: 'ecommerce-vendas-hype',
      name: 'Vendas Ecommerce',
      vibe: 'Resultado de dropshipping com prova de vendas e energia jovem',
      color: '#10b981',
      fields: {
        style: 'bright ecommerce success thumbnail, creator cutout holding phone, platform logos; huge bold numeric title style, white cards, green glow',
        lighting: 'neon green backlight, bright face highlights',
        assets: 'sales dashboard, smartphone, Shopify bag, social icons, money stacks',
      },
    },
    {
      id: 'youtube-crescimento-vermelho',
      name: 'Crescimento YouTube',
      vibe: 'Crescimento rápido com urgência e expressão exagerada',
      color: '#f43f5e',
      fields: {
        style: 'high CTR YouTube growth thumbnail, shocked face cutout, oversized analytics card; huge bold title, yellow and white fill, red 3D blocks',
        lighting: 'bright red studio lighting, strong highlights',
        assets: 'YouTube icons, analytics paper, green growth arrow, shocked portrait',
      },
    },
  ],
};
