-- ============================================================
-- TABELA: suppliers
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/glfcxeaxztqymagxjvra/sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Decoração, Buffet, Som/Luz, Fotografia, etc.
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    instagram TEXT,
    notes TEXT
);

-- Habilitar RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Políticas (Apenas usuários autenticados)
DROP POLICY IF EXISTS "sup_select_auth" ON public.suppliers;
DROP POLICY IF EXISTS "sup_insert_auth" ON public.suppliers;
DROP POLICY IF EXISTS "sup_update_auth" ON public.suppliers;
DROP POLICY IF EXISTS "sup_delete_auth" ON public.suppliers;

CREATE POLICY "sup_select_auth" ON public.suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sup_insert_auth" ON public.suppliers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "sup_update_auth" ON public.suppliers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "sup_delete_auth" ON public.suppliers FOR DELETE USING (auth.role() = 'authenticated');
