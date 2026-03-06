
-- =============================================
-- FIX: Convert ALL RLS policies to PERMISSIVE
-- The problem: all policies were created as RESTRICTIVE
-- meaning ALL must pass. We need PERMISSIVE (any can pass).
-- =============================================

-- ========== PAGOS ==========
DROP POLICY IF EXISTS "Directora full access payments" ON public.pagos;
DROP POLICY IF EXISTS "Everyone can view payments" ON public.pagos;
DROP POLICY IF EXISTS "Parents can insert payments" ON public.pagos;
DROP POLICY IF EXISTS "permitir_todo" ON public.pagos;

CREATE POLICY "pagos_directora_all" ON public.pagos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "pagos_everyone_select" ON public.pagos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pagos_parents_insert" ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'padre'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.familia_estudiante fe
      WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id
    )
  );

-- ========== GALERIA ==========
DROP POLICY IF EXISTS "Staff can manage gallery" ON public.galeria;
DROP POLICY IF EXISTS "Everyone can view gallery" ON public.galeria;
DROP POLICY IF EXISTS "permitir_todo" ON public.galeria;

CREATE POLICY "galeria_staff_all" ON public.galeria FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "galeria_everyone_select" ON public.galeria FOR SELECT TO authenticated
  USING (true);

-- ========== ESTUDIANTES ==========
DROP POLICY IF EXISTS "Directora can manage students" ON public.estudiantes;
DROP POLICY IF EXISTS "Everyone can view students" ON public.estudiantes;
DROP POLICY IF EXISTS "permitir_todo" ON public.estudiantes;

CREATE POLICY "estudiantes_directora_all" ON public.estudiantes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "estudiantes_everyone_select" ON public.estudiantes FOR SELECT TO authenticated
  USING (true);

-- ========== FAMILIA_ESTUDIANTE ==========
DROP POLICY IF EXISTS "Directora can manage family links" ON public.familia_estudiante;
DROP POLICY IF EXISTS "Users can view own family links" ON public.familia_estudiante;

CREATE POLICY "familia_directora_all" ON public.familia_estudiante FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "familia_own_select" ON public.familia_estudiante FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ========== ALERTAS ==========
DROP POLICY IF EXISTS "Directora can manage alerts" ON public.alertas;
DROP POLICY IF EXISTS "Everyone can view alerts" ON public.alertas;
DROP POLICY IF EXISTS "Maestro can insert alerts" ON public.alertas;

CREATE POLICY "alertas_directora_all" ON public.alertas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "alertas_everyone_select" ON public.alertas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "alertas_maestro_insert" ON public.alertas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'maestro'::app_role));

-- ========== COMUNICADOS ==========
DROP POLICY IF EXISTS "Directora can manage comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Everyone can view comunicados" ON public.comunicados;
DROP POLICY IF EXISTS "Staff can create comunicados" ON public.comunicados;

CREATE POLICY "comunicados_directora_all" ON public.comunicados FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "comunicados_everyone_select" ON public.comunicados FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "comunicados_staff_insert" ON public.comunicados FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

-- ========== EVENTOS ==========
DROP POLICY IF EXISTS "Staff can manage events" ON public.eventos;
DROP POLICY IF EXISTS "Everyone can view events" ON public.eventos;

CREATE POLICY "eventos_staff_all" ON public.eventos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "eventos_everyone_select" ON public.eventos FOR SELECT TO authenticated
  USING (true);

-- ========== CUMPLEANOS ==========
DROP POLICY IF EXISTS "Directora can manage birthdays" ON public.cumpleanos;
DROP POLICY IF EXISTS "Everyone can view birthdays" ON public.cumpleanos;

CREATE POLICY "cumpleanos_directora_all" ON public.cumpleanos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "cumpleanos_everyone_select" ON public.cumpleanos FOR SELECT TO authenticated
  USING (true);

-- ========== NOTAS_MAESTRAS ==========
DROP POLICY IF EXISTS "Staff can manage notes" ON public.notas_maestras;
DROP POLICY IF EXISTS "Everyone can view notes" ON public.notas_maestras;

CREATE POLICY "notas_staff_all" ON public.notas_maestras FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "notas_everyone_select" ON public.notas_maestras FOR SELECT TO authenticated
  USING (true);

-- ========== AGRADECIMIENTOS ==========
DROP POLICY IF EXISTS "Anyone can create thanks" ON public.agradecimientos;
DROP POLICY IF EXISTS "Directora can delete thanks" ON public.agradecimientos;
DROP POLICY IF EXISTS "Everyone can view thanks" ON public.agradecimientos;

CREATE POLICY "agradecimientos_everyone_select" ON public.agradecimientos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "agradecimientos_anyone_insert" ON public.agradecimientos FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "agradecimientos_directora_delete" ON public.agradecimientos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));

-- ========== MENSAJE_DIA ==========
DROP POLICY IF EXISTS "Directora can manage messages" ON public.mensaje_dia;
DROP POLICY IF EXISTS "Everyone can view messages" ON public.mensaje_dia;

CREATE POLICY "mensaje_directora_all" ON public.mensaje_dia FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "mensaje_everyone_select" ON public.mensaje_dia FOR SELECT TO authenticated
  USING (true);

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ========== USER_ROLES ==========
DROP POLICY IF EXISTS "Directora can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "roles_directora_select" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "roles_own_select" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
