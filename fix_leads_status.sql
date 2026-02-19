-- Corrigir leads com status em inglês (schema antigo) para português (schema novo)
UPDATE public.leads SET status = 'Novo' WHERE status = 'new';
UPDATE public.leads SET status = 'Em Negociação' WHERE status = 'contacted' OR status = 'qualified';
UPDATE public.leads SET status = 'Fechado' WHERE status = 'converted';
UPDATE public.leads SET status = 'Perdido' WHERE status = 'lost';

-- Verificar resultado
SELECT id, name, status FROM public.leads ORDER BY created_at DESC;
