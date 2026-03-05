
-- Fix ALL pagos policies to be PERMISSIVE (not RESTRICTIVE)
DROP POLICY IF EXISTS "Directora full access payments" ON public.pagos;
DROP POLICY IF EXISTS "Everyone can view payments" ON public.pagos;
DROP POLICY IF EXISTS "Parents can submit payments" ON public.pagos;

CREATE POLICY "Directora full access payments" ON public.pagos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view payments" ON public.pagos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Parents can submit payments" ON public.pagos
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'padre'::app_role)
    AND EXISTS (
      SELECT 1 FROM familia_estudiante fe
      WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id
    )
  );

-- Fix estudiantes policies to be PERMISSIVE
DROP POLICY IF EXISTS "Directora can manage students" ON public.estudiantes;
DROP POLICY IF EXISTS "Everyone can view students" ON public.estudiantes;

CREATE POLICY "Directora can manage students" ON public.estudiantes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view students" ON public.estudiantes
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- Fix alertas policies
DROP POLICY IF EXISTS "Directora can manage alerts" ON public.alertas;
DROP POLICY IF EXISTS "Everyone can view alerts" ON public.alertas;
DROP POLICY IF EXISTS "Maestro can insert alerts" ON public.alertas;

CREATE POLICY "Directora can manage alerts" ON public.alertas
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view alerts" ON public.alertas
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Maestro can insert alerts" ON public.alertas
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'maestro'::app_role));

-- Fix comunicados
DROP POLICY IF EXISTS "Directora can delete comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Directora can update comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Everyone can view comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Staff can create comunicados" ON public.comunicados;

CREATE POLICY "Directora can manage comunicados" ON public.comunicados
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view comunicados" ON public.comunicados
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Staff can create comunicados" ON public.comunicados
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

-- Fix cumpleanos
DROP POLICY IF EXISTS "Directora can manage birthdays" ON public.cumpleanos;
DROP POLICY IF EXISTS "Everyone can view birthdays" ON public.cumpleanos;

CREATE POLICY "Directora can manage birthdays" ON public.cumpleanos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view birthdays" ON public.cumpleanos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- Fix eventos
DROP POLICY IF EXISTS "Directora can delete events" ON public.eventos;
DROP POLICY IF EXISTS "Everyone can view events" ON public.eventos;
DROP POLICY IF EXISTS "Staff can create events" ON public.eventos;
DROP POLICY IF EXISTS "Staff can update events" ON public.eventos;

CREATE POLICY "Staff can manage events" ON public.eventos
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "Everyone can view events" ON public.eventos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- Fix galeria
DROP POLICY IF EXISTS "Directora can delete photos" ON public.galeria;
DROP POLICY IF EXISTS "Directora can update gallery" ON public.galeria;
DROP POLICY IF EXISTS "Everyone can view gallery" ON public.galeria;
DROP POLICY IF EXISTS "Staff can add photos" ON public.galeria;

CREATE POLICY "Staff can manage gallery" ON public.galeria
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "Everyone can view gallery" ON public.galeria
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- Fix mensaje_dia
DROP POLICY IF EXISTS "Directora can manage messages" ON public.mensaje_dia;
DROP POLICY IF EXISTS "Everyone can view messages" ON public.mensaje_dia;

CREATE POLICY "Directora can manage messages" ON public.mensaje_dia
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view messages" ON public.mensaje_dia
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- Fix notas_maestras
DROP POLICY IF EXISTS "Directora can delete notes" ON public.notas_maestras;
DROP POLICY IF EXISTS "Everyone can view notes" ON public.notas_maestras;
DROP POLICY IF EXISTS "Staff can create notes" ON public.notas_maestras;
DROP POLICY IF EXISTS "Staff can update notes" ON public.notas_maestras;

CREATE POLICY "Staff can manage notes" ON public.notas_maestras
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "Everyone can view notes" ON public.notas_maestras
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- Fix agradecimientos
DROP POLICY IF EXISTS "Anyone can create thanks" ON public.agradecimientos;
DROP POLICY IF EXISTS "Directora can delete thanks" ON public.agradecimientos;
DROP POLICY IF EXISTS "Everyone can view thanks" ON public.agradecimientos;

CREATE POLICY "Anyone can create thanks" ON public.agradecimientos
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Directora can delete thanks" ON public.agradecimientos
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Everyone can view thanks" ON public.agradecimientos
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- Fix profiles
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Fix user_roles
DROP POLICY IF EXISTS "Directora can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Directora can view all roles" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Users can view own roles" ON public.user_roles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Fix familia_estudiante
DROP POLICY IF EXISTS "Directora can manage family links" ON public.familia_estudiante;
DROP POLICY IF EXISTS "Users can view own family links" ON public.familia_estudiante;

CREATE POLICY "Directora can manage family links" ON public.familia_estudiante
  AS PERMISSIVE FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "Users can view own family links" ON public.familia_estudiante
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
