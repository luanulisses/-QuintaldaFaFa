-- ============================================================
-- Tabela: receipt_logs
-- Logs de recibos gerados (comprovantes de pagamento)
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/glfcxeaxztqymagxjvra/sql
-- ============================================================

-- Criar a tabela
CREATE TABLE IF NOT EXISTS public.receipt_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    number TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL DEFAULT 'Sinal / Entrada',
    method TEXT NOT NULL DEFAULT 'PIX',
    client_name TEXT
);

-- Habilitar RLS
ALTER TABLE public.receipt_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (somente usuários autenticados)
CREATE POLICY "rl_select_auth" ON public.receipt_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "rl_insert_auth" ON public.receipt_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "rl_update_auth" ON public.receipt_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "rl_delete_auth" ON public.receipt_logs FOR DELETE USING (auth.role() = 'authenticated');

-- Verificar criação
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'receipt_logs';
