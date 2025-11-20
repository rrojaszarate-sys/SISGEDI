--
-- SISGEDI 2.0 - CONFIGURACIÓN DE SUPABASE STORAGE
-- Buckets para archivos (antes BLOBs en Oracle)
-- Fecha: 2025-11-20
--

-- ============================================================================
-- ELIMINAR BUCKETS EXISTENTES (SI EXISTEN)
-- ============================================================================

-- Nota: En Supabase Dashboard o mediante API, eliminar buckets manualmente si es necesario

-- ============================================================================
-- CREAR BUCKETS
-- ============================================================================

-- Bucket: documentos-entrantes
-- Estructura: {año}/{id_doc_entrante}/archivo.pdf
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos-entrantes',
  'documentos-entrantes',
  false, -- Privado, requiere autenticación
  52428800, -- 50 MB máximo por archivo
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: seguimientos
-- Estructura: {id_seguimiento_turno}/archivo.pdf
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'seguimientos',
  'seguimientos',
  false,
  52428800, -- 50 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: alcances
-- Estructura: {año}/{id_alcance_entrante}/archivo.pdf
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'alcances',
  'alcances',
  false,
  52428800, -- 50 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: seguimientos-salientes
-- Estructura: {id_seguimiento_saliente}/acuse.pdf
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'seguimientos-salientes',
  'seguimientos-salientes',
  false,
  52428800, -- 50 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: unidades
-- Estructura: {id_unidad_administrativa}/logo.png, sello.png, plantilla.pdf
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'unidades',
  'unidades',
  false,
  10485760, -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: avatars (usuarios)
-- Estructura: {id_usuario}/avatar.jpg
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Público (solo lectura)
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- ============================================================================

-- ============================================================================
-- Políticas para bucket: documentos-entrantes
-- ============================================================================

-- Política: Los usuarios autenticados pueden subir documentos a su propia unidad
CREATE POLICY "Usuarios autenticados pueden subir documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-entrantes' AND
  auth.uid() IN (
    SELECT id_usuario::text
    FROM tbl_usuarios
    WHERE id_estatus_usuario IN (1, 4) -- Activo o Primer Ingreso
  )
);

-- Política: Los usuarios pueden ver documentos de su unidad activa
CREATE POLICY "Usuarios pueden ver documentos de su unidad"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-entrantes' AND
  auth.uid() IN (
    SELECT u.id_usuario::text
    FROM tbl_usuarios u
    INNER JOIN tbl_usuario_unidad_admin uua ON u.id_usuario = uua.id_usuario
    WHERE uua.activa = 1
  )
);

-- Política: Los usuarios pueden actualizar archivos que subieron
CREATE POLICY "Usuarios pueden actualizar sus propios archivos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos-entrantes' AND
  owner = auth.uid()
);

-- Política: Solo administradores pueden eliminar
CREATE POLICY "Solo administradores pueden eliminar documentos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos-entrantes' AND
  auth.uid() IN (
    SELECT u.id_usuario::text
    FROM tbl_usuarios u
    INNER JOIN tbl_usuario_rol ur ON u.id_usuario = ur.id_usuario
    INNER JOIN rol r ON ur.id_rol = r.id_rol
    WHERE r.rol = 'ADMINISTRADOR' AND ur.permiso_activar = 1
  )
);

-- ============================================================================
-- Políticas para bucket: seguimientos
-- ============================================================================

CREATE POLICY "Usuarios autenticados pueden subir seguimientos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seguimientos' AND
  auth.uid() IN (SELECT id_usuario::text FROM tbl_usuarios WHERE id_estatus_usuario IN (1, 4))
);

CREATE POLICY "Usuarios pueden ver seguimientos de su unidad"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'seguimientos' AND
  auth.uid() IN (SELECT id_usuario::text FROM tbl_usuarios)
);

-- ============================================================================
-- Políticas para bucket: alcances
-- ============================================================================

CREATE POLICY "Usuarios autenticados pueden subir alcances"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'alcances' AND
  auth.uid() IN (SELECT id_usuario::text FROM tbl_usuarios WHERE id_estatus_usuario IN (1, 4))
);

CREATE POLICY "Usuarios pueden ver alcances"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'alcances' AND
  auth.uid() IN (SELECT id_usuario::text FROM tbl_usuarios)
);

-- ============================================================================
-- Políticas para bucket: seguimientos-salientes
-- ============================================================================

CREATE POLICY "Usuarios autenticados pueden subir seguimientos salientes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seguimientos-salientes' AND
  auth.uid() IN (SELECT id_usuario::text FROM tbl_usuarios WHERE id_estatus_usuario IN (1, 4))
);

CREATE POLICY "Usuarios pueden ver seguimientos salientes"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'seguimientos-salientes' AND
  auth.uid() IN (SELECT id_usuario::text FROM tbl_usuarios)
);

-- ============================================================================
-- Políticas para bucket: unidades
-- ============================================================================

CREATE POLICY "Solo administradores pueden subir archivos de unidades"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'unidades' AND
  auth.uid() IN (
    SELECT u.id_usuario::text
    FROM tbl_usuarios u
    INNER JOIN tbl_usuario_rol ur ON u.id_usuario = ur.id_usuario
    INNER JOIN rol r ON ur.id_rol = r.id_rol
    WHERE r.rol IN ('ADMINISTRADOR', 'COORDINADOR') AND ur.permiso_activar = 1
  )
);

CREATE POLICY "Todos los usuarios autenticados pueden ver archivos de unidades"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'unidades'
);

-- ============================================================================
-- Políticas para bucket: avatars (público)
-- ============================================================================

CREATE POLICY "Usuarios pueden subir su propio avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatars son públicamente visibles"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'avatars'
);

CREATE POLICY "Usuarios pueden actualizar su propio avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- FUNCIONES AUXILIARES PARA STORAGE
-- ============================================================================

-- Función: Obtener URL pública de archivo
CREATE OR REPLACE FUNCTION get_storage_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url TEXT;
BEGIN
  -- Obtener URL base de Supabase
  base_url := current_setting('app.settings.supabase_url', true);
  IF base_url IS NULL THEN
    base_url := 'https://vhltbvkymrdgtimkuytn.supabase.co';
  END IF;

  RETURN base_url || '/storage/v1/object/' || bucket_name || '/' || file_path;
END;
$$;

-- Función: Generar path para documento entrante
CREATE OR REPLACE FUNCTION generate_doc_entrante_path(
  p_id_doc_entrante UUID,
  p_folio_interno VARCHAR,
  p_filename VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  anio TEXT;
BEGIN
  -- Extraer año del folio (formato: YYYY-NNNNNN)
  anio := SUBSTRING(p_folio_interno FROM 1 FOR 4);

  RETURN anio || '/' || p_id_doc_entrante::text || '/' || p_filename;
END;
$$;

-- Función: Generar path para seguimiento
CREATE OR REPLACE FUNCTION generate_seguimiento_path(
  p_id_seguimiento BIGINT,
  p_filename VARCHAR
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN p_id_seguimiento::text || '/' || p_filename;
END;
$$;

-- Función: Validar tamaño de archivo antes de upload
CREATE OR REPLACE FUNCTION validate_file_size(
  p_bucket_name TEXT,
  p_file_size BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  max_size BIGINT;
BEGIN
  SELECT file_size_limit INTO max_size
  FROM storage.buckets
  WHERE id = p_bucket_name;

  IF max_size IS NULL THEN
    RETURN false; -- Bucket no existe
  END IF;

  RETURN p_file_size <= max_size;
END;
$$;

-- Función: Validar tipo MIME de archivo
CREATE OR REPLACE FUNCTION validate_mime_type(
  p_bucket_name TEXT,
  p_mime_type VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  allowed_types TEXT[];
BEGIN
  SELECT allowed_mime_types INTO allowed_types
  FROM storage.buckets
  WHERE id = p_bucket_name;

  IF allowed_types IS NULL THEN
    RETURN true; -- Sin restricciones
  END IF;

  RETURN p_mime_type = ANY(allowed_types);
END;
$$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Buckets de Supabase Storage configurados exitosamente' AS status;
SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY id;

COMMENT ON FUNCTION get_storage_url IS 'Genera URL completa de archivo en Storage';
COMMENT ON FUNCTION generate_doc_entrante_path IS 'Genera path estándar para documentos entrantes: {año}/{id}/archivo.pdf';
COMMENT ON FUNCTION generate_seguimiento_path IS 'Genera path estándar para seguimientos: {id}/archivo.pdf';
COMMENT ON FUNCTION validate_file_size IS 'Valida que el tamaño del archivo no exceda el límite del bucket';
COMMENT ON FUNCTION validate_mime_type IS 'Valida que el tipo MIME esté permitido en el bucket';
