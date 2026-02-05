-- Fix overly permissive RLS policy for logs_atividade
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.logs_atividade;

CREATE POLICY "Authenticated users can insert own logs"
ON public.logs_atividade
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);