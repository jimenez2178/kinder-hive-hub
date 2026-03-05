
-- Fix RLS: Allow maestro to INSERT on alertas (currently only directora)
-- Actually alertas insert is directora-only by design. Let's fix the UPDATE policies for tables missing them.

-- Allow UPDATE on alertas for directora (already has ALL policy, but let's ensure it works)
-- The ALL policy already covers UPDATE for directora, so that should work.

-- Add UPDATE policies for comunicados, eventos, galeria, notas_maestras
CREATE POLICY "Directora can update comunicados"
ON public.comunicados FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'directora'))
WITH CHECK (public.has_role(auth.uid(), 'directora'));

CREATE POLICY "Staff can update events"
ON public.eventos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'directora') OR public.has_role(auth.uid(), 'maestro'))
WITH CHECK (public.has_role(auth.uid(), 'directora') OR public.has_role(auth.uid(), 'maestro'));

CREATE POLICY "Directora can update gallery"
ON public.galeria FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'directora'))
WITH CHECK (public.has_role(auth.uid(), 'directora'));

CREATE POLICY "Staff can update notes"
ON public.notas_maestras FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'directora') OR public.has_role(auth.uid(), 'maestro'))
WITH CHECK (public.has_role(auth.uid(), 'directora') OR public.has_role(auth.uid(), 'maestro'));

-- Allow maestro to INSERT on alertas too
CREATE POLICY "Maestro insert alerts"
ON public.alertas FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'maestro'));

-- Allow maestro to INSERT gallery photos
CREATE POLICY "Maestro can add photos"
ON public.galeria FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'maestro'));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicados;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notas_maestras;
ALTER PUBLICATION supabase_realtime ADD TABLE public.galeria;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cumpleanos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agradecimientos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pagos;
