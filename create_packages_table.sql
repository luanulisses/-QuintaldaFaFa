-- ============================================================
-- TABELA: packages (Pacotes & Preços)
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/glfcxeaxztqymagxjvra/sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb, -- Lista de itens inclusos
    min_guests INTEGER DEFAULT 0,
    max_guests INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- Habilitar RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "pkg_select_public" ON public.packages;
DROP POLICY IF EXISTS "pkg_insert_auth" ON public.packages;
DROP POLICY IF EXISTS "pkg_update_auth" ON public.packages;
DROP POLICY IF EXISTS "pkg_delete_auth" ON public.packages;

-- Todos podem ver pacotes (útil para o site no futuro)
CREATE POLICY "pkg_select_public" ON public.packages FOR SELECT USING (true);
-- Apenas admin pode modificar
CREATE POLICY "pkg_insert_auth" ON public.packages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pkg_update_auth" ON public.packages FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "pkg_delete_auth" ON public.packages FOR DELETE USING (auth.role() = 'authenticated');
