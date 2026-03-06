-- supabase/migrations/002_brand_kit.sql
-- CREATYNG — MASTER SPEC DIFF 16.1
-- Tabelas: brand_kits, brand_avatars
-- Storage bucket: brand-assets
-- RLS: usuário só acessa seus próprios kits

-- ─── BRAND KITS ──────────────────────────────────────────────────────────────

CREATE TABLE brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL DEFAULT 'Minha Marca',
  logo_url TEXT,                        -- URL no Supabase Storage (bucket brand-assets)

  -- Cores
  color_primary TEXT NOT NULL DEFAULT '#8B5CF6',
  color_secondary TEXT NOT NULL DEFAULT '#A78BFA',
  color_neutral TEXT NOT NULL DEFAULT '#111827',
  color_extras TEXT[] DEFAULT '{}',     -- até 5 extras

  -- Fontes
  font_headline TEXT NOT NULL DEFAULT 'Anton',
  font_body TEXT NOT NULL DEFAULT 'Inter',

  -- Estilo padrão (preset de imagem)
  style_preset TEXT NOT NULL DEFAULT 'drama'
    CHECK (style_preset IN ('drama','clean','dark','editorial','neon')),
  style_atmosphere TEXT NOT NULL DEFAULT 'none',
  style_lighting TEXT NOT NULL DEFAULT 'none',

  -- Preset vinculado (usa schema CreatygnPreset — type: brand_kit)
  -- Quando criado, inserir também em tabela presets com type='brand_kit', scope='user_private'
  preset_id UUID REFERENCES presets(id),

  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brand_kits_user ON brand_kits(user_id);

ALTER TABLE brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_kits_select" ON brand_kits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "brand_kits_insert" ON brand_kits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "brand_kits_update" ON brand_kits
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "brand_kits_delete" ON brand_kits
  FOR DELETE USING (user_id = auth.uid());

-- Trigger: só 1 kit pode ser default por usuário
CREATE OR REPLACE FUNCTION enforce_single_default_kit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE brand_kits
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_default_kit
  AFTER INSERT OR UPDATE ON brand_kits
  FOR EACH ROW EXECUTE FUNCTION enforce_single_default_kit();

-- ─── BRAND AVATARS ────────────────────────────────────────────────────────────

CREATE TABLE brand_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_kit_id UUID REFERENCES brand_kits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,                     -- gerado por IA ao analisar as fotos

  -- Reference images (5-10 fotos no Storage)
  reference_images TEXT[] NOT NULL DEFAULT '{}',
  best_reference TEXT,                  -- URL da melhor foto (selecionada automaticamente)

  -- Perfil de identidade extraído por IA
  identity_gender TEXT,
  identity_approximate_age TEXT,
  identity_hair_color TEXT,
  identity_skin_tone TEXT,
  identity_distinctive_features TEXT,  -- barba, óculos, etc.

  -- Previews gerados no onboarding (4 estilos)
  preview_images TEXT[] DEFAULT '{}',

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','ready','error')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brand_avatars_kit ON brand_avatars(brand_kit_id);
CREATE INDEX idx_brand_avatars_user ON brand_avatars(user_id);

ALTER TABLE brand_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_avatars_select" ON brand_avatars
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "brand_avatars_insert" ON brand_avatars
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "brand_avatars_update" ON brand_avatars
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "brand_avatars_delete" ON brand_avatars
  FOR DELETE USING (user_id = auth.uid());

-- ─── GERAÇÃO COM AVATAR ───────────────────────────────────────────────────────

-- Vincula gerações ao avatar usado (para galeria 16.6)
ALTER TABLE generation_feedback
  ADD COLUMN IF NOT EXISTS avatar_id UUID REFERENCES brand_avatars(id);

CREATE INDEX idx_generation_feedback_avatar ON generation_feedback(avatar_id)
  WHERE avatar_id IS NOT NULL;

-- ─── STORAGE ──────────────────────────────────────────────────────────────────

-- Criar bucket brand-assets via Supabase Dashboard ou:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', false);

-- RLS no storage (só o dono acessa)
-- CREATE POLICY "brand_assets_user" ON storage.objects
--   FOR ALL USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─── FUNÇÕES UTILITÁRIAS ──────────────────────────────────────────────────────

-- Retorna o brand kit default do usuário
CREATE OR REPLACE FUNCTION get_default_brand_kit(p_user_id UUID)
RETURNS UUID AS $$
  SELECT id FROM brand_kits
  WHERE user_id = p_user_id AND is_default = true
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_brand_kits_updated_at
  BEFORE UPDATE ON brand_kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_brand_avatars_updated_at
  BEFORE UPDATE ON brand_avatars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
