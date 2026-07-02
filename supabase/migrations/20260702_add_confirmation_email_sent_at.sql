-- Adicionar coluna para controle de envio de e-mails duplicados
ALTER TABLE public.arraia_purchases 
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ NULL;
