-- Fix existing users that have no profile/role
INSERT INTO public.profiles (user_id, display_name)
VALUES 
  ('58a65f11-872d-4647-8c4d-01de88724e6c', 'Jimenez'),
  ('2e223467-aaf6-4f5b-8a81-4662f4deaa25', 'Punto Ebook')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('58a65f11-872d-4647-8c4d-01de88724e6c', 'directora'),
  ('2e223467-aaf6-4f5b-8a81-4662f4deaa25', 'directora')
ON CONFLICT (user_id, role) DO NOTHING;