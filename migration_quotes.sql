-- Adicionar colunas de tipo e validade na tabela de contratos
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'contract';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Comentário para expiração automática (opcional no banco, será controlado pelo frontend por enquanto)
COMMENT ON COLUMN public.contracts.expires_at IS 'Data de validade para orçamentos (quotes)';
