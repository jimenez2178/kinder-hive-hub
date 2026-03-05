
-- Allow parents to submit payments (por_revisar status)
CREATE POLICY "Parents can submit payments"
  ON public.pagos FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'padre') AND
    EXISTS (
      SELECT 1 FROM public.familia_estudiante fe
      WHERE fe.user_id = auth.uid() AND fe.estudiante_id = pagos.estudiante_id
    )
  );
