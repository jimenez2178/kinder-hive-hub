
-- Allow directora to view all user roles (for pending users count)
CREATE POLICY "Directora can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'directora'));
