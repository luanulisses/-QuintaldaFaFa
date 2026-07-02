-- Função RPC para consultar o status de um pedido de forma segura pelo frontend (sem expor a tabela toda)
CREATE OR REPLACE FUNCTION public.check_purchase_status(p_purchase_id uuid)
RETURNS TABLE (
    id uuid,
    payment_status text,
    list_number text,
    customer_name text,
    items jsonb,
    total_amount numeric,
    payment_id text
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios de quem criou a função (bypassa o RLS de select, o que é o objetivo aqui)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.payment_status,
        p.list_number,
        p.customer_name,
        p.items,
        p.total_amount,
        p.payment_id
    FROM public.arraia_purchases p
    WHERE p.id = p_purchase_id;
END;
$$;
