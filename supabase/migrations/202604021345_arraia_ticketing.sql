-- Migration: Arraiá do Quintal da Fafá 2026 Ticketing System
-- Description: Sets up tables for event lots, purchases and secure tickets.

-- 1. Table for Ticket Lots (Batches)
CREATE TABLE IF NOT EXISTS public.arraia_ticket_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL, -- ex: '1º Lote', '2º Lote'
    price_geral NUMERIC NOT NULL,
    price_passaporte NUMERIC NOT NULL,
    price_combo NUMERIC NOT NULL,
    active BOOLEAN DEFAULT false,
    max_tickets INTEGER DEFAULT 300,
    current_sold INTEGER DEFAULT 0
);

-- 2. Table for Purchases (Sales)
CREATE TABLE IF NOT EXISTS public.arraia_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    total_amount NUMERIC NOT NULL,
    payment_status TEXT DEFAULT 'pending', -- pending, approved, cancelled
    payment_method TEXT, -- mercadopago, pix, etc
    external_id TEXT, -- Mercado Pago Preference ID or Payment ID
    items JSONB NOT NULL -- details of what was bought
);

-- 3. Table for Individual Tickets (Validation)
CREATE TABLE IF NOT EXISTS public.arraia_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    purchase_id UUID REFERENCES public.arraia_purchases(id) ON DELETE CASCADE,
    ticket_type TEXT NOT NULL, -- 'geral', 'passaporte', 'combo'
    owner_name TEXT,
    secure_hash TEXT UNIQUE NOT NULL, -- Hash for the QR Code
    status_uso BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ
);

-- RLS Configuration
ALTER TABLE public.arraia_ticket_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arraia_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arraia_tickets ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public can read batches (to see prices)
DROP POLICY IF EXISTS "Batches are public" ON public.arraia_ticket_batches;
CREATE POLICY "Batches are public" ON public.arraia_ticket_batches FOR SELECT USING (true);

-- Admin can manage batches
-- (Assuming auth.role() = 'authenticated' for simplicity in admin panel)
DROP POLICY IF EXISTS "Admin manage batches" ON public.arraia_ticket_batches;
CREATE POLICY "Admin manage batches" ON public.arraia_ticket_batches ALL USING (auth.role() = 'authenticated');

-- Purchases: Public can insert (from checkout)
DROP POLICY IF EXISTS "Public can insert purchases" ON public.arraia_purchases;
CREATE POLICY "Public can insert purchases" ON public.arraia_purchases FOR INSERT WITH CHECK (true);

-- Purchases: Only admin can see for now
DROP POLICY IF EXISTS "Admin can see purchases" ON public.arraia_purchases;
CREATE POLICY "Admin can see purchases" ON public.arraia_purchases FOR SELECT USING (auth.role() = 'authenticated');

-- Tickets: Only admin can manage (for validation)
DROP POLICY IF EXISTS "Admin manage tickets" ON public.arraia_tickets;
CREATE POLICY "Admin manage tickets" ON public.arraia_tickets ALL USING (auth.role() = 'authenticated');

-- Seed initial 1st Lot
INSERT INTO public.arraia_ticket_batches (name, price_geral, price_passaporte, price_combo, active, max_tickets)
VALUES ('1º Lote', 20.00, 15.00, 30.00, true, 100);

INSERT INTO public.arraia_ticket_batches (name, price_geral, price_passaporte, price_combo, active, max_tickets)
VALUES ('2º Lote', 25.00, 20.00, 40.00, false, 100);

INSERT INTO public.arraia_ticket_batches (name, price_geral, price_passaporte, price_combo, active, max_tickets)
VALUES ('3º Lote', 35.00, 25.00, 55.00, false, 100);
