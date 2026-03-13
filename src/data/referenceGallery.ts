// src/data/referenceGallery.ts
// CREATYNG — Galeria de referências visuais para o Wizard Step 2

export interface ReferenceItem {
  id: string;
  name: string;
  category: "food" | "fashion" | "beauty" | "tech" | "general";
  imageUrl: string;
  style: string;
  tags: string[];
}

// Por agora: placeholders (sem imagens reais).
// Em produção: hospedar imagens de referência no Supabase Storage.
export const REFERENCE_GALLERY: ReferenceItem[] = [
  // FOOD
  { id: "food-01", name: "Burger Gourmet", category: "food", imageUrl: "", style: "dark-dramatic", tags: ["burger", "gourmet"] },
  { id: "food-02", name: "Açaí Premium", category: "food", imageUrl: "", style: "vibrant", tags: ["açaí", "bowl"] },
  { id: "food-03", name: "Pizza Artesanal", category: "food", imageUrl: "", style: "warm", tags: ["pizza", "italiano"] },
  { id: "food-04", name: "Café Especial", category: "food", imageUrl: "", style: "minimal", tags: ["café", "coffee"] },
  { id: "food-05", name: "Sushi Roll", category: "food", imageUrl: "", style: "clean", tags: ["sushi", "japonês"] },
  // FASHION
  { id: "fashion-01", name: "Streetwear", category: "fashion", imageUrl: "", style: "urban", tags: ["roupa", "street"] },
  { id: "fashion-02", name: "Luxo Minimal", category: "fashion", imageUrl: "", style: "minimal", tags: ["luxo", "clean"] },
  // BEAUTY
  { id: "beauty-01", name: "Skincare", category: "beauty", imageUrl: "", style: "clean", tags: ["skincare", "cosmético"] },
  { id: "beauty-02", name: "Salão Premium", category: "beauty", imageUrl: "", style: "elegant", tags: ["salão", "cabelo"] },
  // TECH
  { id: "tech-01", name: "App Launch", category: "tech", imageUrl: "", style: "modern", tags: ["app", "tech"] },
  // GENERAL
  { id: "general-01", name: "Promoção Flash", category: "general", imageUrl: "", style: "vibrant", tags: ["promo", "desconto"] },
  { id: "general-02", name: "Lançamento", category: "general", imageUrl: "", style: "premium", tags: ["launch", "novo"] },
];

export const REFERENCE_CATEGORIES = [
  { id: "food" as const, label: "Food", icon: "UtensilsCrossed" },
  { id: "fashion" as const, label: "Moda", icon: "Shirt" },
  { id: "beauty" as const, label: "Beleza", icon: "Sparkles" },
  { id: "tech" as const, label: "Tech", icon: "Laptop" },
  { id: "general" as const, label: "Geral", icon: "Zap" },
] as const;
