
-- Drop any that may have been partially created, then recreate ALL as PERMISSIVE

-- PAGOS
DROP POLICY IF EXISTS "Directora full access payments" ON public.pagos;
DROP POLICY IF EXISTS "Everyone can view payments" ON public.pagos;
DROP POLICY IF EXISTS "Parents can insert payments" ON public.pagos;
CREATE POLICY "Directora full access payments" ON public.pagos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Everyone can view payments" ON public.pagos FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Parents can insert payments" ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'padre'::app_role) AND EXISTS (SELECT 1 FROM public.familia_estudiante fe WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id));

-- GALERIA
DROP POLICY IF EXISTS "Staff can manage gallery" ON public.galeria;
DROP POLICY IF EXISTS "Everyone can view gallery" ON public.galeria;
CREATE POLICY "Staff can manage gallery" ON public.galeria FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));
CREATE POLICY "Everyone can view gallery" ON public.galeria FOR SELECT TO authenticated
  USING (true);

-- ESTUDIANTES
DROP POLICY IF EXISTS "Directora can manage students" ON public.estudiantes;
DROP POLICY IF EXISTS "Everyone can view students" ON public.estudiantes;
CREATE POLICY "Directora can manage students" ON public.estudiantes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Everyone can view students" ON public.estudiantes FOR SELECT TO authenticated
  USING (true);

-- ALERTAS
DROP POLICY IF EXISTS "Directora can manage alerts" ON public.alertas;
DROP POLICY IF EXISTS "Everyone can view alerts" ON public.alertas;
DROP POLICY IF EXISTS "Maestro can insert alerts" ON public.alertas;
CREATE POLICY "Directora can manage alerts" ON public.alertas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Everyone can view alerts" ON public.alertas FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Maestro can insert alerts" ON public.alertas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'maestro'::app_role));

-- COMUNICADOS
DROP POLICY IF EXISTS "Directora can manage comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Everyone can view comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Staff can create comunicados" ON public.comunicados;
CREATE POLICY "Directora can manage comunicados" ON public.comunicados FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Everyone can view comunicados" ON public.comunicados FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Staff can create comunicados" ON public.comunicados FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

-- EVENTOS
DROP POLICY IF EXISTS "Staff can manage events" ON public.eventos;
DROP POLICY IF EXISTS "Everyone can view events" ON public.eventos;
CREATE POLICY "Staff can manage events" ON public.eventos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));
CREATE POLICY "Everyone can view events" ON public.eventos FOR SELECT TO authenticated
  USING (true);

-- CUMPLEANOS
DROP POLICY IF EXISTS "Directora can manage birthdays" ON public.cumpleanos;
DROP POLICY IF EXISTS "Everyone can view birthdays" ON public.cumpleanos;
CREATE POLICY "Directora can manage birthdays" ON public.cumpleanos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Everyone can view birthdays" ON public.cumpleanos FOR SELECT TO authenticated
  USING (true);

-- NOTAS_MAESTRAS
DROP POLICY IF EXISTS "Staff can manage notes" ON public.notas_maestras;
DROP POLICY IF EXISTS "Everyone can view notes" ON public.notas_maestras;
CREATE POLICY "Staff can manage notes" ON public.notas_maestras FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));
CREATE POLICY "Everyone can view notes" ON public.notas_maestras FOR SELECT TO authenticated
  USING (true);

-- MENSAJE_DIA
DROP POLICY IF EXISTS "Directora can manage messages" ON public.mensaje_dia;
DROP POLICY IF EXISTS "Everyone can view messages" ON public.mensaje_dia;
CREATE POLICY "Directora can manage messages" ON public.mensaje_dia FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Everyone can view messages" ON public.mensaje_dia FOR SELECT TO authenticated
  USING (true);

-- AGRADECIMIENTOS
DROP POLICY IF EXISTS "Anyone can create thanks" ON public.agradecimientos;
DROP POLICY IF EXISTS "Directora can delete thanks" ON public.agradecimientos;
DROP POLICY IF EXISTS "Everyone can view thanks" ON public.agradecimientos;
CREATE POLICY "Anyone can create thanks" ON public.agradecimientos FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Directora can delete thanks" ON public.agradecimientos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Everyone can view thanks" ON public.agradecimientos FOR SELECT TO authenticated
  USING (true);

-- PROFILES
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- USER_ROLES
DROP POLICY IF EXISTS "Directora can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Directora can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- FAMILIA_ESTUDIANTE
DROP POLICY IF EXISTS "Directora can manage family links" ON public.familia_estudiante;
DROP POLICY IF EXISTS "Users can view own family links" ON public.familia_estudiante;
CREATE POLICY "Directora can manage family links" ON public.familia_estudiante FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));
CREATE POLICY "Users can view own family links" ON public.familia_estudiante FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
