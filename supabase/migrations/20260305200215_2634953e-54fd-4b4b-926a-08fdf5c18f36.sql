
-- Fix RLS: Add PERMISSIVE policies so padres can INSERT payments and SELECT estudiantes/galeria

-- 1. Pagos: Allow authenticated parents to insert (permissive to work alongside existing restrictive)
DROP POLICY IF EXISTS "Parents can submit payments" ON public.pagos;
CREATE POLICY "Parents can submit payments"
  ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'padre'::app_role)
    AND EXISTS (
      SELECT 1 FROM familia_estudiante fe
      WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id
    )
  );

-- Make the parent insert policy PERMISSIVE (default is permissive, but let's be explicit)
-- The issue is all existing policies are RESTRICTIVE. We need at least one PERMISSIVE.

-- Drop all restrictive policies and recreate as permissive for pagos
DROP POLICY IF EXISTS "Enable delete for all users" ON public.pagos;
DROP POLICY IF EXISTS "Public access" ON public.pagos;
DROP POLICY IF EXISTS "Directora full access payments" ON public.pagos;
DROP POLICY IF EXISTS "Everyone can view payments" ON public.pagos;
DROP POLICY IF EXISTS "Parents can submit payments" ON public.pagos;

CREATE POLICY "Directora full access payments"
  ON public.pagos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view payments"
  ON public.pagos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Parents can insert payments"
  ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'padre'::app_role)
    AND EXISTS (
      SELECT 1 FROM familia_estudiante fe
      WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id
    )
  );

-- 2. Estudiantes: make SELECT permissive for authenticated
DROP POLICY IF EXISTS "Enable delete for all users" ON public.estudiantes;
DROP POLICY IF EXISTS "Public access" ON public.estudiantes;
DROP POLICY IF EXISTS "Directora can manage students" ON public.estudiantes;
DROP POLICY IF EXISTS "Everyone can view students" ON public.estudiantes;

CREATE POLICY "Directora can manage students"
  ON public.estudiantes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view students"
  ON public.estudiantes FOR SELECT TO authenticated
  USING (true);

-- 3. Galeria: make policies permissive
DROP POLICY IF EXISTS "Public access" ON public.galeria;
DROP POLICY IF EXISTS "Staff can manage gallery" ON public.galeria;
DROP POLICY IF EXISTS "Everyone can view gallery" ON public.galeria;

CREATE POLICY "Staff can manage gallery"
  ON public.galeria FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "Everyone can view gallery"
  ON public.galeria FOR SELECT TO authenticated
  USING (true);
