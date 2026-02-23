-- Create contracts table to store interactive contract data
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_cpf TEXT,
    event_date DATE,
    total_value NUMERIC(10, 2),
    contract_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Simple policies for development
CREATE POLICY "Enable all for all users" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
