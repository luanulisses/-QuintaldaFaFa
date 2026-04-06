-- =====================================================
-- EXECUTE NO SUPABASE → SQL Editor
-- Arraiá 2026 — Sistema PIX + Lista de Convidados
-- =====================================================

-- 1. Adicionar colunas à tabela arraia_purchases
ALTER TABLE arraia_purchases
  ADD COLUMN IF NOT EXISTS list_number      TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS pix_qr_code      TEXT,
  ADD COLUMN IF NOT EXISTS pix_copy_paste   TEXT,
  ADD COLUMN IF NOT EXISTS pix_expiration   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_id       TEXT,
  ADD COLUMN IF NOT EXISTS checked_in       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS checked_in_at    TIMESTAMPTZ;

-- 2. Sequence para ARRAIA-001, ARRAIA-002, ...
CREATE SEQUENCE IF NOT EXISTS arraia_list_seq START 1 INCREMENT 1;

-- 3. Função para gerar número da lista
CREATE OR REPLACE FUNCTION generate_list_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ARRAIA-' || LPAD(nextval('arraia_list_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- 4. Índices para busca rápida na portaria
CREATE INDEX IF NOT EXISTS idx_arraia_purchases_list_number
  ON arraia_purchases(list_number);

CREATE INDEX IF NOT EXISTS idx_arraia_purchases_customer_name
  ON arraia_purchases(customer_name);

-- 5. Permitir que o frontend leia para o polling de status
-- (ajuste conforme sua política de RLS)
-- CREATE POLICY "Allow read own purchase" ON arraia_purchases
--   FOR SELECT USING (true); -- Deixe comentado se já tiver política configurada

-- =====================================================
-- SECRETS A CONFIGURAR: Supabase → Settings → Functions Secrets
-- MP_ACCESS_TOKEN = <seu token do Mercado Pago>
-- RESEND_API_KEY  = <seu token do Resend>
-- WHATSAPP_TOKEN  = <opcional, Meta Cloud API>
-- WHATSAPP_PHONE_ID = <opcional, Meta Cloud API>
-- =====================================================

-- APÓS RODAR, FAÇA O DEPLOY DAS EDGE FUNCTIONS:
-- npx supabase functions deploy mercadopago-pix
-- npx supabase functions deploy mercadopago-webhook
