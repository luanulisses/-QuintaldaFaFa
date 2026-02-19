-- Adicionar campos de contrato e pacote na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contract_url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contract_value NUMERIC(10, 2);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.packages(id);

-- Adicionar bucket para contratos (opcional, mas recomendado)
-- Note: Buckets geralmente são criados via dashboard ou API de Storage
-- mas podemos garantir que as políticas permitam acesso se o bucket existir.
