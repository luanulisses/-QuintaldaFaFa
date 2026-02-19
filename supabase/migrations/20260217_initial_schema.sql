-- Create ENUMs for various statuses if needed (optional, using text is often easier for MVP)
-- But let's stick to text with check constraints for flexibility or simple text.

-- 1. Leads (Orçamentos)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    event_date DATE,
    guests INTEGER,
    status TEXT DEFAULT 'Novo' CHECK (status IN ('Novo', 'Em Negociação', 'Fechado', 'Perdido')),
    notes TEXT,
    source TEXT -- 'Site', 'Instagram', 'Indicação'
);

-- 2. Events (Agenda)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    type TEXT, -- 'Casamento', 'Aniversário', 'Corporativo', 'Outro'
    status TEXT DEFAULT 'Reservado' CHECK (status IN ('Reservado', 'Confirmado', 'Realizado', 'Cancelado')),
    client_id UUID REFERENCES public.leads(id), -- Optional link to lead
    value DECIMAL(10, 2),
    deposit_value DECIMAL(10, 2),
    balance_value DECIMAL(10, 2)
);

-- 3. Financial Movements (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS public.financial_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Receita', 'Despesa')),
    category TEXT, -- 'Aluguel', 'Limpeza', 'Manutenção', 'Marketing', etc.
    event_id UUID REFERENCES public.events(id) -- Optional link to event
);

-- 4. Clients (Can be derived from Leads eventually, but good to have separate for repeat business)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    document TEXT, -- CPF/CNPJ
    address TEXT,
    notes TEXT
);

-- 5. Suppliers (Fornecedores)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    category TEXT, -- 'Buffet', 'Decoração', 'Som', etc.
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT
);

-- Enable RLS (Row Level Security) - Important for production!
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Creating policies (For now, allowing all access for authenticated users or public if needed for development)
-- In a real app, you'd restrict this to admin users essentially.

-- Allow public insert for Leads (from Contact Form)
CREATE POLICY "Allow public insert for leads" ON public.leads FOR INSERT WITH CHECK (true);

-- Allow admins full access (assuming authenticated users are admins for this simple MVP)
-- Or just allow all operations for authenticated users
CREATE POLICY "Allow full access for authenticated users" ON public.leads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for authenticated users" ON public.events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for authenticated users" ON public.financial_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for authenticated users" ON public.clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for authenticated users" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated');
