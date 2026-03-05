
-- Create familia_estudiante linking table
CREATE TABLE IF NOT EXISTS public.familia_estudiante (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estudiante_id uuid NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  parentesco text DEFAULT 'tutor',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, estudiante_id)
);

ALTER TABLE public.familia_estudiante ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family links"
  ON public.familia_estudiante FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Directora can manage family links"
  ON public.familia_estudiante FOR ALL
  USING (public.has_role(auth.uid(), 'directora'));

CREATE POLICY "Directora can insert family links"
  ON public.familia_estudiante FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'directora'));

-- Parents see only their students' notes
CREATE POLICY "Parents can view own student notes"
  ON public.notas_maestras FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.familia_estudiante fe
      WHERE fe.user_id = auth.uid() AND fe.estudiante_id = notas_maestras.estudiante_id
    )
  );

-- Parents see only their students' payments
CREATE POLICY "Parents can view own student payments"
  ON public.pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.familia_estudiante fe
      WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id
    )
  );

-- Parents see only their linked students
CREATE POLICY "Parents can view own students"
  ON public.estudiantes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.familia_estudiante fe
      WHERE fe.user_id = auth.uid() AND fe.estudiante_id = estudiantes.id
    )
  );

-- Replace registration function with auto-link logic
CREATE OR REPLACE FUNCTION public.handle_new_user_registration(
  _user_id uuid,
  _display_name text,
  _role app_role DEFAULT 'pendiente'::app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _found_student_id uuid;
  _email text;
  _final_role app_role;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;

  IF _role NOT IN ('directora', 'maestro') THEN
    SELECT id INTO _found_student_id
    FROM public.estudiantes
    WHERE padre_email = _email
    LIMIT 1;

    IF _found_student_id IS NOT NULL THEN
      _final_role := 'padre';
    ELSE
      _final_role := 'pendiente';
    END IF;
  ELSE
    _final_role := _role;
  END IF;

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (_user_id, _display_name)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _final_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _final_role = 'padre' THEN
    INSERT INTO public.familia_estudiante (user_id, estudiante_id)
    SELECT _user_id, id FROM public.estudiantes WHERE padre_email = _email
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
