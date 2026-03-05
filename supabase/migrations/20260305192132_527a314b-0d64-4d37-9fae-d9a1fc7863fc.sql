-- Delete orphaned payments for inactive students
DELETE FROM public.pagos
WHERE estudiante_id IN (
  SELECT id FROM public.estudiantes WHERE activo = false
);