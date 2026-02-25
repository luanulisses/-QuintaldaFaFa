-- ============================================================
-- SCRIPT DEFINITIVO: Corrigir Tabela de Orçamentos (Leads)
-- Este script garante que todos os campos existem e que o 
-- formulário do site pode salvar os dados corretamente.
-- ============================================================

-- 1. Garante que os campos necessários existem
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS guests INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Site';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Corrigir a restrição de status (permitir 'Novo' em português)
-- Removemos qualquer restrição antiga e criamos uma nova abrangente
DO $$ 
BEGIN
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check1;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
    CHECK (status IN ('Novo', 'Em Negociação', 'Fechado', 'Perdido', 'new', 'contacted', 'qualified', 'converted', 'lost'));

-- 3. Configurar RLS (Permissões)
-- Habilita RLS na tabela
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "leads_insert_public" ON public.leads;
DROP POLICY IF EXISTS "leads_select_auth" ON public.leads;
DROP POLICY IF EXISTS "leads_update_auth" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_auth" ON public.leads;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert for leads" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.leads;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.leads;

-- Cria a política que permite QUALQUER UM enviar o formulário (público)
CREATE POLICY "leads_insert_public" ON public.leads 
    FOR INSERT 
    WITH CHECK (true);

-- Cria a política que permite apenas ADMINISTRADORES (logados) verem os leads
CREATE POLICY "leads_select_auth" ON public.leads 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Adiciona políticas para update e delete (apenas autenticados)
CREATE POLICY "leads_update_auth" ON public.leads FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "leads_delete_auth" ON public.leads FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Verificar se a extensão UUID está ativa (necessária para gerar IDs automáticos)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 5. Mostrar estrutura final para conferência
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND table_schema = 'public'
ORDER BY ordinal_position;
