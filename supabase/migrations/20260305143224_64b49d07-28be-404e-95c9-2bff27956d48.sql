
-- Function to handle new user registration (creates profile + role)
CREATE OR REPLACE FUNCTION public.handle_new_user_registration(
  _user_id uuid,
  _display_name text,
  _role app_role DEFAULT 'maestro'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (_user_id, _display_name)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.handle_new_user_registration TO authenticated;

-- Allow authenticated users to insert own profile (needed for signup flow)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for pagos (directora can edit payments)
CREATE POLICY "Directora can update payments"
ON public.pagos
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'directora'::app_role))
WITH CHECK (has_role(auth.uid(), 'directora'::app_role));

-- Add DELETE policy for pagos
CREATE POLICY "Directora can delete payments"
ON public.pagos
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'directora'::app_role));

-- Storage policies for comprobantes bucket
CREATE POLICY "Anyone can view comprobantes"
ON storage.objects FOR SELECT
USING (bucket_id = 'comprobantes');

CREATE POLICY "Authenticated users can upload comprobantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprobantes');

-- Storage policies for fotos bucket
CREATE POLICY "Anyone can view fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos');

CREATE POLICY "Authenticated users can upload fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fotos');
