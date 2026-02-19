-- ============================================================
-- POLÍTICAS RLS para financial_movements
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/glfcxeaxztqymagxjvra/sql
-- ============================================================

-- Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS public.financial_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Receita', 'Despesa')),
    category TEXT,
    event_id UUID REFERENCES public.events(id)
);

-- Habilitar RLS
ALTER TABLE public.financial_movements ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.financial_movements;
DROP POLICY IF EXISTS "fm_insert_auth" ON public.financial_movements;
DROP POLICY IF EXISTS "fm_select_auth" ON public.financial_movements;
DROP POLICY IF EXISTS "fm_update_auth" ON public.financial_movements;
DROP POLICY IF EXISTS "fm_delete_auth" ON public.financial_movements;

-- Criar políticas corretas (somente usuários autenticados)
CREATE POLICY "fm_insert_auth" ON public.financial_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "fm_select_auth" ON public.financial_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "fm_update_auth" ON public.financial_movements FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "fm_delete_auth" ON public.financial_movements FOR DELETE USING (auth.role() = 'authenticated');

-- Verificar
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'financial_movements';
