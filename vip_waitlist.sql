CREATE TABLE IF NOT EXISTS vip_waitlist (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
nome VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL,
telefone VARCHAR(20) NOT NULL,
origem VARCHAR(100) DEFAULT 'site_2edicao',
status VARCHAR(50) DEFAULT 'aguardando',
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vip_waitlist ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS vip_waitlist_email_telefone_idx
ON vip_waitlist (email, telefone);

CREATE INDEX IF NOT EXISTS vip_waitlist_status_idx
ON vip_waitlist(status);

CREATE INDEX IF NOT EXISTS vip_waitlist_created_at_idx
ON vip_waitlist(created_at);

DROP POLICY IF EXISTS "Permitir inserção anonima na lista VIP" ON vip_waitlist;
DROP POLICY IF EXISTS "Permitir leitura apenas para autenticados" ON vip_waitlist;

CREATE POLICY "Permitir inserção anonima na lista VIP"
ON vip_waitlist
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Permitir leitura apenas para autenticados"
ON vip_waitlist
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir exclusao para autenticados" ON vip_waitlist;

CREATE POLICY "Permitir exclusao para autenticados"
ON vip_waitlist
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir atualizacao para autenticados" ON vip_waitlist;

CREATE POLICY "Permitir atualizacao para autenticados"
ON vip_waitlist
FOR UPDATE
TO authenticated
USING (true);

-- Função RPC para buscar apenas o total de inscritos sem expor dados sensíveis
CREATE OR REPLACE FUNCTION public.get_vip_waitlist_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT COUNT(*)::integer FROM public.vip_waitlist;
$$;

GRANT EXECUTE ON FUNCTION public.get_vip_waitlist_count() TO anon;
