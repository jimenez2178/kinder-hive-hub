
-- Add phone field to profiles for contact info
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefono text DEFAULT NULL;
