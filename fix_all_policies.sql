-- ============================================================
-- SCRIPT COMPLETO: Corrigir políticas RLS de todas as tabelas
-- Execute no SQL Editor: https://supabase.com/dashboard/project/glfcxeaxztqymagxjvra/sql
-- ============================================================

-- ========================
-- TABELA: site_content
-- ========================
DROP POLICY IF EXISTS "Allow public read access on site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow public read on site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow auth update on site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow auth insert on site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow auth delete on site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.site_content;

CREATE POLICY "sc_select" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "sc_insert" ON public.site_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sc_update" ON public.site_content FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "sc_delete" ON public.site_content FOR DELETE USING (auth.role() = 'authenticated');

-- ========================
-- TABELA: site_sections
-- ========================
DROP POLICY IF EXISTS "Allow public read access on site_sections" ON public.site_sections;
DROP POLICY IF EXISTS "Allow auth insert on site_sections" ON public.site_sections;
DROP POLICY IF EXISTS "Allow auth update on site_sections" ON public.site_sections;
DROP POLICY IF EXISTS "Allow auth delete on site_sections" ON public.site_sections;

CREATE POLICY "ss_select" ON public.site_sections FOR SELECT USING (true);
CREATE POLICY "ss_insert" ON public.site_sections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "ss_update" ON public.site_sections FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "ss_delete" ON public.site_sections FOR DELETE USING (auth.role() = 'authenticated');

-- ========================
-- TABELA: gallery_images
-- ========================
DROP POLICY IF EXISTS "Allow public read access on gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow auth insert on gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow auth update on gallery_images" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow auth delete on gallery_images" ON public.gallery_images;

CREATE POLICY "gi_select" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "gi_insert" ON public.gallery_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "gi_update" ON public.gallery_images FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "gi_delete" ON public.gallery_images FOR DELETE USING (auth.role() = 'authenticated');

-- ========================
-- TABELA: testimonials
-- ========================
DROP POLICY IF EXISTS "Allow public read access on testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow auth insert on testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow auth update on testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Allow auth delete on testimonials" ON public.testimonials;

CREATE POLICY "t_select" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "t_insert" ON public.testimonials FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "t_update" ON public.testimonials FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "t_delete" ON public.testimonials FOR DELETE USING (auth.role() = 'authenticated');

-- ========================
-- VERIFICAÇÃO FINAL
-- ========================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('site_content', 'site_sections', 'gallery_images', 'testimonials')
ORDER BY tablename, cmd;
