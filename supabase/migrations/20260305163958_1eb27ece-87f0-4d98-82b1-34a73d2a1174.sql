
-- Fix pagos RLS: Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Directora can manage payments" ON public.pagos;
DROP POLICY IF EXISTS "Directora can update payments" ON public.pagos;
DROP POLICY IF EXISTS "Directora can delete payments" ON public.pagos;
DROP POLICY IF EXISTS "Directora insert payments" ON public.pagos;
DROP POLICY IF EXISTS "Everyone can view payments" ON public.pagos;
DROP POLICY IF EXISTS "Parents can submit payments" ON public.pagos;
DROP POLICY IF EXISTS "Parents can view own student payments" ON public.pagos;

-- Recreate as PERMISSIVE
CREATE POLICY "Directora full access payments" ON public.pagos FOR ALL USING (has_role(auth.uid(), 'directora'::app_role)) WITH CHECK (has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Everyone can view payments" ON public.pagos FOR SELECT USING (true);
CREATE POLICY "Parents can submit payments" ON public.pagos FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'padre'::app_role) AND EXISTS (
    SELECT 1 FROM familia_estudiante fe WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id
  )
);

-- Also fix other tables with same restrictive pattern
-- comunicados
DROP POLICY IF EXISTS "Directora can delete comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Directora can update comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Everyone can view comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Staff can create comunicados" ON public.comunicados;

CREATE POLICY "Everyone can view comunicados" ON public.comunicados FOR SELECT USING (true);
CREATE POLICY "Staff can create comunicados" ON public.comunicados FOR INSERT WITH CHECK (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role));
CREATE POLICY "Directora can update comunicados" ON public.comunicados FOR UPDATE USING (has_role(auth.uid(), 'directora'::app_role)) WITH CHECK (has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Directora can delete comunicados" ON public.comunicados FOR DELETE USING (has_role(auth.uid(), 'directora'::app_role));

-- notas_maestras
DROP POLICY IF EXISTS "Directora can delete notes" ON public.notas_maestras;
DROP POLICY IF EXISTS "Everyone can view notes" ON public.notas_maestras;
DROP POLICY IF EXISTS "Parents can view own student notes" ON public.notas_maestras;
DROP POLICY IF EXISTS "Staff can create notes" ON public.notas_maestras;
DROP POLICY IF EXISTS "Staff can update notes" ON public.notas_maestras;

CREATE POLICY "Everyone can view notes" ON public.notas_maestras FOR SELECT USING (true);
CREATE POLICY "Staff can create notes" ON public.notas_maestras FOR INSERT WITH CHECK (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role));
CREATE POLICY "Staff can update notes" ON public.notas_maestras FOR UPDATE USING (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role));
CREATE POLICY "Directora can delete notes" ON public.notas_maestras FOR DELETE USING (has_role(auth.uid(), 'directora'::app_role));

-- cumpleanos
DROP POLICY IF EXISTS "Directora can manage birthdays" ON public.cumpleanos;
DROP POLICY IF EXISTS "Directora insert birthdays" ON public.cumpleanos;
DROP POLICY IF EXISTS "Everyone can view birthdays" ON public.cumpleanos;

CREATE POLICY "Everyone can view birthdays" ON public.cumpleanos FOR SELECT USING (true);
CREATE POLICY "Directora can manage birthdays" ON public.cumpleanos FOR ALL USING (has_role(auth.uid(), 'directora'::app_role)) WITH CHECK (has_role(auth.uid(), 'directora'::app_role));

-- galeria
DROP POLICY IF EXISTS "Directora can delete photos" ON public.galeria;
DROP POLICY IF EXISTS "Directora can update gallery" ON public.galeria;
DROP POLICY IF EXISTS "Everyone can view gallery" ON public.galeria;
DROP POLICY IF EXISTS "Maestro can add photos" ON public.galeria;
DROP POLICY IF EXISTS "Staff can add photos" ON public.galeria;

CREATE POLICY "Everyone can view gallery" ON public.galeria FOR SELECT USING (true);
CREATE POLICY "Staff can add photos" ON public.galeria FOR INSERT WITH CHECK (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role));
CREATE POLICY "Directora can update gallery" ON public.galeria FOR UPDATE USING (has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Directora can delete photos" ON public.galeria FOR DELETE USING (has_role(auth.uid(), 'directora'::app_role));

-- eventos
DROP POLICY IF EXISTS "Directora can manage events" ON public.eventos;
DROP POLICY IF EXISTS "Everyone can view events" ON public.eventos;
DROP POLICY IF EXISTS "Staff can create events" ON public.eventos;
DROP POLICY IF EXISTS "Staff can update events" ON public.eventos;

CREATE POLICY "Everyone can view events" ON public.eventos FOR SELECT USING (true);
CREATE POLICY "Staff can create events" ON public.eventos FOR INSERT WITH CHECK (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role));
CREATE POLICY "Staff can update events" ON public.eventos FOR UPDATE USING (has_role(auth.uid(), 'directora'::app_role) OR has_role(auth.uid(), 'maestro'::app_role));
CREATE POLICY "Directora can delete events" ON public.eventos FOR DELETE USING (has_role(auth.uid(), 'directora'::app_role));

-- estudiantes
DROP POLICY IF EXISTS "Directora can manage students" ON public.estudiantes;
DROP POLICY IF EXISTS "Directora insert students" ON public.estudiantes;
DROP POLICY IF EXISTS "Everyone can view students" ON public.estudiantes;
DROP POLICY IF EXISTS "Parents can view own students" ON public.estudiantes;

CREATE POLICY "Everyone can view students" ON public.estudiantes FOR SELECT USING (true);
CREATE POLICY "Directora can manage students" ON public.estudiantes FOR ALL USING (has_role(auth.uid(), 'directora'::app_role)) WITH CHECK (has_role(auth.uid(), 'directora'::app_role));
