-- 1. Crear tabla de evaluaciones (si no existe)
CREATE TABLE IF NOT EXISTS evaluaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    maestro_id UUID REFERENCES auth.users(id),
    estudiante_id UUID REFERENCES estudiantes(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    observaciones TEXT NOT NULL
);

-- 2. Habilitar RLS en evaluaciones
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para evaluaciones
DROP POLICY IF EXISTS "Maestros pueden insertar evaluaciones" ON evaluaciones;
CREATE POLICY "Maestros pueden insertar evaluaciones" ON evaluaciones
FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'maestro')
);

DROP POLICY IF EXISTS "Todos pueden ver evaluaciones" ON evaluaciones;
CREATE POLICY "Todos pueden ver evaluaciones" ON evaluaciones
FOR SELECT TO authenticated USING (true);

-- 4. Asegurar que el usuario maestro tenga el ROL correcto
-- SUSTITUYE 'maestro@ejemplo.com' por el email real del usuario
UPDATE perfiles 
SET rol = 'maestro' 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'maestro@ejemplo.com'
);
