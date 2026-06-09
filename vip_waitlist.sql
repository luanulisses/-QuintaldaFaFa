CREATE TABLE IF NOT EXISTS vip_waitlist (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
nome VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL,
telefone VARCHAR(20) NOT NULL,
origem VARCHAR(100) DEFAULT 'site_2edicao',
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vip_waitlist ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS vip_waitlist_email_telefone_idx
ON vip_waitlist (email, telefone);

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
