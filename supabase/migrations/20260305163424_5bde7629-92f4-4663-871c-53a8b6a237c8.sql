
-- Fix alertas RLS: Drop conflicting restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Directora can manage alerts" ON public.alertas;
DROP POLICY IF EXISTS "Directora insert alerts" ON public.alertas;
DROP POLICY IF EXISTS "Maestro insert alerts" ON public.alertas;
DROP POLICY IF EXISTS "Everyone can view alerts" ON public.alertas;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Everyone can view alerts" ON public.alertas FOR SELECT USING (true);
CREATE POLICY "Directora can manage alerts" ON public.alertas FOR ALL USING (has_role(auth.uid(), 'directora'::app_role)) WITH CHECK (has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Maestro can insert alerts" ON public.alertas FOR INSERT WITH CHECK (has_role(auth.uid(), 'maestro'::app_role));

-- Fix comunicados INSERT to also allow maestro
DROP POLICY IF EXISTS "Staff can create comunicados" ON public.comunicados;
CREATE POLICY "Staff can create comunicados" ON public.comunicados FOR INSERT WITH CHECK (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role));

-- Fix all other tables to use PERMISSIVE policies where needed
-- agradecimientos: fix INSERT to be permissive
DROP POLICY IF EXISTS "Anyone can create thanks" ON public.agradecimientos;
DROP POLICY IF EXISTS "Directora can delete thanks" ON public.agradecimientos;
DROP POLICY IF EXISTS "Everyone can view thanks" ON public.agradecimientos;

CREATE POLICY "Everyone can view thanks" ON public.agradecimientos FOR SELECT USING (true);
CREATE POLICY "Anyone can create thanks" ON public.agradecimientos FOR INSERT WITH CHECK (true);
CREATE POLICY "Directora can delete thanks" ON public.agradecimientos FOR DELETE USING (has_role(auth.uid(), 'directora'::app_role));
