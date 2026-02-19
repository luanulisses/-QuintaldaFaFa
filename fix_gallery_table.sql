-- ============================================================
-- SCRIPT DE REPARO DEFINITIVO (V3): Galeria e Álbuns
-- Corrige duplicidade de políticas e colunas faltantes
-- ============================================================

-- 1. Garante a extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabelas
CREATE TABLE IF NOT EXISTS public.galleries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    url TEXT NOT NULL,
    caption TEXT,
    gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'Geral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Atualização de Colunas Faltantes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='gallery_images' AND column_name='gallery_id') THEN
        ALTER TABLE public.gallery_images ADD COLUMN gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='gallery_images' AND column_name='created_at') THEN
        ALTER TABLE public.gallery_images ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- 4. Segurança (RLS)
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- 5. Limpeza e Recriação de Políticas (Evita erro de "already exists")
-- Álbuns
DROP POLICY IF EXISTS "g_select" ON public.galleries;
DROP POLICY IF EXISTS "g_insert" ON public.galleries;
DROP POLICY IF EXISTS "g_update" ON public.galleries;
DROP POLICY IF EXISTS "g_delete" ON public.galleries;

CREATE POLICY "g_select" ON public.galleries FOR SELECT USING (true);
CREATE POLICY "g_insert" ON public.galleries FOR INSERT WITH CHECK (true);
CREATE POLICY "g_update" ON public.galleries FOR UPDATE USING (true);
CREATE POLICY "g_delete" ON public.galleries FOR DELETE USING (true);

-- Imagens
DROP POLICY IF EXISTS "gi_select" ON public.gallery_images;
DROP POLICY IF EXISTS "gi_insert" ON public.gallery_images;
DROP POLICY IF EXISTS "gi_update" ON public.gallery_images;
DROP POLICY IF EXISTS "gi_delete" ON public.gallery_images;

CREATE POLICY "gi_select" ON public.gallery_images FOR SELECT USING (true);
CREATE POLICY "gi_insert" ON public.gallery_images FOR INSERT WITH CHECK (true);
CREATE POLICY "gi_update" ON public.gallery_images FOR UPDATE USING (true);
CREATE POLICY "gi_delete" ON public.gallery_images FOR DELETE USING (true);
