-- CREATYNG — MASTER SPEC — Schema do banco de dados
-- Criar ANTES de qualquer diff que salva dados.
-- Execute via Supabase Dashboard > SQL Editor ou supabase db push.

-- ─── TABELA PRINCIPAL DE PRESETS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'image_style', 'text_style', 'composition', 'color_palette', 'full', 'brand_kit'
  )),
  scope TEXT NOT NULL CHECK (scope IN (
    'system', 'user_private', 'user_public', 'team'
  )),
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  approval_count INTEGER DEFAULT 0,
  rejection_count INTEGER DEFAULT 0,
  approval_rate DECIMAL(5,2) DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  marketplace_published BOOLEAN DEFAULT false,
  marketplace_price INTEGER DEFAULT 0,
  marketplace_category TEXT,
  marketplace_tags TEXT[] DEFAULT '{}',
  marketplace_featured BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FEEDBACK DE GERAÇÃO ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS generation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  generation_id UUID NOT NULL,
  preset_id UUID REFERENCES presets(id),
  config_snapshot JSONB NOT NULL,
  image_url TEXT NOT NULL,
  image_thumbnail_url TEXT NOT NULL,
  rating TEXT CHECK (rating IN ('approved', 'rejected', 'favorited')),
  rated_at TIMESTAMPTZ,
  quality_score INTEGER,
  quality_checks JSONB,
  provider_used TEXT,
  dna_used BOOLEAN DEFAULT false,
  generation_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRESETS SALVOS PELO USUÁRIO ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_saved_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  preset_id UUID REFERENCES presets(id) NOT NULL,
  pinned BOOLEAN DEFAULT false,
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preset_id)
);

-- ─── ÍNDICES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_presets_type_scope ON presets(type, scope);
CREATE INDEX IF NOT EXISTS idx_presets_approval_rate ON presets(approval_rate DESC);
CREATE INDEX IF NOT EXISTS idx_generation_feedback_user ON generation_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_feedback_preset ON generation_feedback(preset_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presets_read" ON presets FOR SELECT USING (
  scope IN ('system', 'user_public') OR author_id = auth.uid()
);
CREATE POLICY "presets_write" ON presets FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "presets_update" ON presets FOR UPDATE USING (author_id = auth.uid());

ALTER TABLE generation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_read" ON generation_feedback FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "feedback_write" ON generation_feedback FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

ALTER TABLE user_saved_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_presets_read" ON user_saved_presets FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "saved_presets_write" ON user_saved_presets FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- ─── FUNÇÃO: atualiza approval_rate automaticamente após feedback ──────────────

CREATE OR REPLACE FUNCTION update_preset_approval_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE presets SET
    approval_rate = CASE
      WHEN (approval_count + rejection_count) = 0 THEN 0
      ELSE ROUND((approval_count::DECIMAL / (approval_count + rejection_count)) * 100, 2)
    END,
    updated_at = NOW()
  WHERE id = NEW.preset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── FUNÇÃO: incrementa favorite_count ───────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_preset_favorite(preset_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE presets SET
    favorite_count = favorite_count + 1,
    updated_at = NOW()
  WHERE id = preset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── SEED: presets do sistema ─────────────────────────────────────────────────
-- Os dados reais vêm de src/data/systemPresets.ts (TypeScript)
-- Esta migration serve para o ambiente de produção do Supabase.
-- Execute separadamente quando o banco estiver configurado.
