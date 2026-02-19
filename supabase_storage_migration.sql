-- ============================================================
-- SCRIPT: Criar bucket site_assets e configurar políticas de storage
-- Execute no SQL Editor: https://supabase.com/dashboard/project/glfcxeaxztqymagxjvra/sql
-- ============================================================

-- 1. Criar bucket público (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site_assets',
  'site_assets',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- 2. Remover políticas antigas para evitar conflito
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "site_assets_select" ON storage.objects;
DROP POLICY IF EXISTS "site_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "site_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "site_assets_delete" ON storage.objects;

-- 3. Criar políticas corretas para o bucket site_assets
-- Leitura pública
CREATE POLICY "site_assets_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site_assets');

-- Upload para autenticados
CREATE POLICY "site_assets_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site_assets' AND auth.role() = 'authenticated');

-- Atualização para autenticados
CREATE POLICY "site_assets_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site_assets' AND auth.role() = 'authenticated');

-- Exclusão para autenticados
CREATE POLICY "site_assets_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site_assets' AND auth.role() = 'authenticated');

-- 4. Verificar
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'site_assets';
