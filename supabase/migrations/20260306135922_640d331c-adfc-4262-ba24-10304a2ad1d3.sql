
-- =====================================================
-- DEFINITIVE FIX: Convert ALL RLS policies to PERMISSIVE
-- =====================================================

-- PAGOS: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "pagos_directora_all" ON public.pagos;
DROP POLICY IF EXISTS "pagos_everyone_select" ON public.pagos;
DROP POLICY IF EXISTS "pagos_parents_insert" ON public.pagos;
DROP POLICY IF EXISTS "Directora full access payments" ON public.pagos;
DROP POLICY IF EXISTS "Parents can insert payments" ON public.pagos;
DROP POLICY IF EXISTS "Everyone can view payments" ON public.pagos;

CREATE POLICY "pagos_directora_all" ON public.pagos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "pagos_everyone_select" ON public.pagos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pagos_parents_insert" ON public.pagos FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'padre'::app_role)
    AND EXISTS (SELECT 1 FROM public.familia_estudiante fe WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id)
  );

-- ESTUDIANTES: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "estudiantes_directora_all" ON public.estudiantes;
DROP POLICY IF EXISTS "estudiantes_everyone_select" ON public.estudiantes;

CREATE POLICY "estudiantes_directora_all" ON public.estudiantes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "estudiantes_everyone_select" ON public.estudiantes FOR SELECT TO authenticated
  USING (true);

-- FAMILIA_ESTUDIANTE: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "familia_directora_all" ON public.familia_estudiante;
DROP POLICY IF EXISTS "familia_own_select" ON public.familia_estudiante;

CREATE POLICY "familia_directora_all" ON public.familia_estudiante FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "familia_own_select" ON public.familia_estudiante FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- GALERIA: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "galeria_staff_all" ON public.galeria;
DROP POLICY IF EXISTS "galeria_everyone_select" ON public.galeria;

CREATE POLICY "galeria_staff_all" ON public.galeria FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "galeria_everyone_select" ON public.galeria FOR SELECT TO authenticated
  USING (true);

-- ALERTAS: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "alertas_directora_all" ON public.alertas;
DROP POLICY IF EXISTS "alertas_everyone_select" ON public.alertas;
DROP POLICY IF EXISTS "alertas_maestro_insert" ON public.alertas;

CREATE POLICY "alertas_directora_all" ON public.alertas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "alertas_everyone_select" ON public.alertas FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "alertas_maestro_insert" ON public.alertas FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'maestro'::app_role));

-- COMUNICADOS: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "comunicados_directora_all" ON public.comunicados;
DROP POLICY IF EXISTS "comunicados_everyone_select" ON public.comunicados;
DROP POLICY IF EXISTS "comunicados_staff_insert" ON public.comunicados;

CREATE POLICY "comunicados_directora_all" ON public.comunicados FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "comunicados_everyone_select" ON public.comunicados FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "comunicados_staff_insert" ON public.comunicados FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

-- EVENTOS: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "eventos_staff_all" ON public.eventos;
DROP POLICY IF EXISTS "eventos_everyone_select" ON public.eventos;

CREATE POLICY "eventos_staff_all" ON public.eventos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "eventos_everyone_select" ON public.eventos FOR SELECT TO authenticated
  USING (true);

-- NOTAS_MAESTRAS: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "notas_staff_all" ON public.notas_maestras;
DROP POLICY IF EXISTS "notas_everyone_select" ON public.notas_maestras;

CREATE POLICY "notas_staff_all" ON public.notas_maestras FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role) OR public.has_role(auth.uid(), 'maestro'::app_role));

CREATE POLICY "notas_everyone_select" ON public.notas_maestras FOR SELECT TO authenticated
  USING (true);

-- CUMPLEANOS: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "cumpleanos_directora_all" ON public.cumpleanos;
DROP POLICY IF EXISTS "cumpleanos_everyone_select" ON public.cumpleanos;

CREATE POLICY "cumpleanos_directora_all" ON public.cumpleanos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "cumpleanos_everyone_select" ON public.cumpleanos FOR SELECT TO authenticated
  USING (true);

-- MENSAJE_DIA: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "mensaje_directora_all" ON public.mensaje_dia;
DROP POLICY IF EXISTS "mensaje_everyone_select" ON public.mensaje_dia;

CREATE POLICY "mensaje_directora_all" ON public.mensaje_dia FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "mensaje_everyone_select" ON public.mensaje_dia FOR SELECT TO authenticated
  USING (true);

-- AGRADECIMIENTOS: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "agradecimientos_everyone_select" ON public.agradecimientos;
DROP POLICY IF EXISTS "agradecimientos_anyone_insert" ON public.agradecimientos;
DROP POLICY IF EXISTS "agradecimientos_directora_delete" ON public.agradecimientos;

CREATE POLICY "agradecimientos_everyone_select" ON public.agradecimientos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "agradecimientos_anyone_insert" ON public.agradecimientos FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "agradecimientos_directora_delete" ON public.agradecimientos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));

-- PROFILES: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- USER_ROLES: Drop all and recreate as PERMISSIVE
DROP POLICY IF EXISTS "roles_directora_select" ON public.user_roles;
DROP POLICY IF EXISTS "roles_own_select" ON public.user_roles;

CREATE POLICY "roles_directora_select" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'directora'::app_role));

CREATE POLICY "roles_own_select" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
