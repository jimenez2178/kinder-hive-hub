
-- Fix pagos: drop all RESTRICTIVE policies, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Directora full access payments" ON public.pagos;
DROP POLICY IF EXISTS "Everyone can view payments" ON public.pagos;
DROP POLICY IF EXISTS "Parents can insert payments" ON public.pagos;
DROP POLICY IF EXISTS "Enable all for all" ON public.pagos;

CREATE POLICY "Directora full access payments" ON public.pagos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view payments" ON public.pagos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Parents can insert payments" ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'padre'::app_role)
    AND EXISTS (
      SELECT 1 FROM familia_estudiante fe
      WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id
    )
  );

-- Fix galeria: drop all RESTRICTIVE policies, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Staff can manage gallery" ON public.galeria;
DROP POLICY IF EXISTS "Everyone can view gallery" ON public.galeria;
DROP POLICY IF EXISTS "Enable all for all" ON public.galeria;

CREATE POLICY "Staff can manage gallery" ON public.galeria FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "Everyone can view gallery" ON public.galeria FOR SELECT TO authenticated
  USING (true);

-- Fix estudiantes: drop all RESTRICTIVE policies, recreate as PERMISSIVE  
DROP POLICY IF EXISTS "Directora can manage students" ON public.estudiantes;
DROP POLICY IF EXISTS "Everyone can view students" ON public.estudiantes;
DROP POLICY IF EXISTS "Enable all for all" ON public.estudiantes;

CREATE POLICY "Directora can manage students" ON public.estudiantes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view students" ON public.estudiantes FOR SELECT TO authenticated
  USING (true);
