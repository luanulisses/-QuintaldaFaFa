-- ============================================================
-- CORREÇÃO DA TABELA LEADS
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/glfcxeaxztqymagxjvra/sql
-- ============================================================

-- Adicionar colunas que faltam (se ainda não existirem)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS guests INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Corrigir o check constraint do status para aceitar 'Novo' (PT-BR)
-- (O schema antigo usava 'new', o novo usa 'Novo')
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('Novo', 'Em Negociação', 'Fechado', 'Perdido', 'new', 'contacted', 'qualified', 'converted', 'lost'));

-- Corrigir políticas RLS para a tabela leads
-- Remover políticas antigas que podem estar em conflito
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert for leads" ON public.leads;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON public.leads;

-- Criar políticas corretas
-- Qualquer pessoa pode inserir (formulário público de orçamento)
CREATE POLICY "leads_insert_public" ON public.leads FOR INSERT WITH CHECK (true);
-- Apenas autenticados podem ler, atualizar e deletar
CREATE POLICY "leads_select_auth" ON public.leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "leads_update_auth" ON public.leads FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "leads_delete_auth" ON public.leads FOR DELETE USING (auth.role() = 'authenticated');

-- Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND table_schema = 'public'
ORDER BY ordinal_position;
