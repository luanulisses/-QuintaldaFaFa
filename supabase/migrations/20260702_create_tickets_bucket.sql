-- =================================================================
-- EXECUTE NO SUPABASE → SQL Editor
-- Criar bucket público para armazenar imagens dos QR Codes
-- =================================================================

-- 1. Criar o bucket "tickets" (público, para que a URL funcione em e-mails)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tickets', 'tickets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir upload pelo service_role (Edge Functions usam service_role_key)
-- Não precisa de policy extra porque o service_role bypassa RLS.

-- 3. Permitir leitura pública (SELECT) para que Gmail/Outlook acessem a imagem
CREATE POLICY "Public read tickets" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tickets');
