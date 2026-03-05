
-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('directora', 'maestro');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- ============ PERFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  pin TEXT DEFAULT '1234',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ESTUDIANTES ============
CREATE TABLE public.estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  grado TEXT NOT NULL,
  seccion TEXT,
  cuota_mensual NUMERIC(10,2) NOT NULL DEFAULT 0,
  padre_nombre TEXT,
  padre_telefono TEXT,
  padre_email TEXT,
  foto_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view students" ON public.estudiantes
  FOR SELECT USING (true);
CREATE POLICY "Directora can manage students" ON public.estudiantes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'directora'));
CREATE POLICY "Directora insert students" ON public.estudiantes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'directora'));

CREATE TRIGGER update_estudiantes_updated_at BEFORE UPDATE ON public.estudiantes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EVENTOS ============
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  hora TIME,
  ubicacion TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view events" ON public.eventos
  FOR SELECT USING (true);
CREATE POLICY "Staff can create events" ON public.eventos
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'directora') OR public.has_role(auth.uid(), 'maestro')
  );
CREATE POLICY "Directora can manage events" ON public.eventos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'directora'));

-- ============ PAGOS ============
CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo','transferencia','cheque','tarjeta')),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'saldado' CHECK (estado IN ('pendiente','saldado')),
  nota TEXT,
  comprobante_url TEXT,
  numero_recibo TEXT UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view payments" ON public.pagos
  FOR SELECT USING (true);
CREATE POLICY "Directora can manage payments" ON public.pagos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'directora'));
CREATE POLICY "Directora insert payments" ON public.pagos
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'directora'));

CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COMUNICADOS ============
CREATE TABLE public.comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view comunicados" ON public.comunicados
  FOR SELECT USING (true);
CREATE POLICY "Staff can create comunicados" ON public.comunicados
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'directora')
  );
CREATE POLICY "Directora can delete comunicados" ON public.comunicados
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'directora'));

-- ============ NOTAS DE MAESTRAS ============
CREATE TABLE public.notas_maestras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID REFERENCES public.estudiantes(id) ON DELETE CASCADE NOT NULL,
  maestro_id UUID REFERENCES auth.users(id),
  maestro_nombre TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('lectura','atencion','conducta','escritura','motricidad','general')),
  contenido TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notas_maestras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view notes" ON public.notas_maestras
  FOR SELECT USING (true);
CREATE POLICY "Staff can create notes" ON public.notas_maestras
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'directora') OR public.has_role(auth.uid(), 'maestro')
  );
CREATE POLICY "Directora can delete notes" ON public.notas_maestras
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'directora'));

-- ============ ALERTAS ============
CREATE TABLE public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  prioridad TEXT NOT NULL DEFAULT 'info' CHECK (prioridad IN ('urgente','advertencia','info')),
  activa BOOLEAN DEFAULT true,
  show_banner BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view alerts" ON public.alertas
  FOR SELECT USING (true);
CREATE POLICY "Directora can manage alerts" ON public.alertas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'directora'));
CREATE POLICY "Directora insert alerts" ON public.alertas
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'directora'));

-- ============ CUMPLEAÑOS ============
CREATE TABLE public.cumpleanos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  fecha DATE NOT NULL,
  emoji TEXT DEFAULT '🎂',
  mensaje TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cumpleanos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view birthdays" ON public.cumpleanos
  FOR SELECT USING (true);
CREATE POLICY "Directora can manage birthdays" ON public.cumpleanos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'directora'));
CREATE POLICY "Directora insert birthdays" ON public.cumpleanos
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'directora'));

-- ============ AGRADECIMIENTOS ============
CREATE TABLE public.agradecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje TEXT NOT NULL,
  autor TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agradecimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view thanks" ON public.agradecimientos
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create thanks" ON public.agradecimientos
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Directora can delete thanks" ON public.agradecimientos
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'directora'));

-- ============ MENSAJE DEL DÍA ============
CREATE TABLE public.mensaje_dia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contenido TEXT NOT NULL,
  tipo_mensaje TEXT DEFAULT 'motivacional',
  fecha_iso DATE NOT NULL DEFAULT CURRENT_DATE,
  origen_dato TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mensaje_dia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view messages" ON public.mensaje_dia
  FOR SELECT USING (true);
CREATE POLICY "Directora can manage messages" ON public.mensaje_dia
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'directora'));

-- ============ GALERÍA ============
CREATE TABLE public.galeria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT,
  descripcion TEXT,
  foto_url TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view gallery" ON public.galeria
  FOR SELECT USING (true);
CREATE POLICY "Staff can add photos" ON public.galeria
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'directora')
  );
CREATE POLICY "Directora can delete photos" ON public.galeria
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'directora'));

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('comprobantes', 'comprobantes', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos', 'fotos', true);

CREATE POLICY "Public can view comprobantes" ON storage.objects
  FOR SELECT USING (bucket_id = 'comprobantes');
CREATE POLICY "Auth users can upload comprobantes" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "Public can view fotos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos');
CREATE POLICY "Auth users can upload fotos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos');
