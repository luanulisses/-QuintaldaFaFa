-- ============================================================
-- Fix: Políticas RLS completas para a tabela events
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/<seu-projeto>/sql
-- ============================================================

-- Remove políticas antigas (criadas no schema.sql original)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.events;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.events;
DROP POLICY IF EXISTS "ev_select" ON public.events;
DROP POLICY IF EXISTS "ev_insert" ON public.events;
DROP POLICY IF EXISTS "ev_update" ON public.events;
DROP POLICY IF EXISTS "ev_delete" ON public.events;

-- Cria políticas novas com DELETE habilitado para usuários autenticados
CREATE POLICY "ev_select" ON public.events FOR SELECT USING (true);
CREATE POLICY "ev_insert" ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "ev_update" ON public.events FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "ev_delete" ON public.events FOR DELETE USING (auth.role() = 'authenticated');

-- Verificação
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'events' ORDER BY cmd;
