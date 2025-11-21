-- ============================================================================
-- SISGEDI 2.0 - CONFIGURACIÓN DE SUPABASE STORAGE
-- ============================================================================
-- Buckets para almacenamiento de archivos
-- Políticas RLS para seguridad
-- ============================================================================

-- ============================================================================
-- CREAR BUCKETS
-- ============================================================================

-- Bucket: Documentos Entrantes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documentos-entrantes',
    'documentos-entrantes',
    false,
    52428800, -- 50 MB
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/jpeg',
        'image/png',
        'image/tiff'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/jpeg',
        'image/png',
        'image/tiff'
    ];

-- Bucket: Documentos Salientes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documentos-salientes',
    'documentos-salientes',
    false,
    52428800, -- 50 MB
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

-- Bucket: Inventario (Fotos de bienes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'inventario',
    'inventario',
    false,
    10485760, -- 10 MB por imagen
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

-- Bucket: Seguimientos (Evidencias de avance)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'seguimientos',
    'seguimientos',
    false,
    20971520, -- 20 MB
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];

-- Bucket: Avatares (Fotos de perfil)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatares',
    'avatares',
    true, -- Público para mostrar avatares
    2097152, -- 2 MB
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

-- ============================================================================
-- POLÍTICAS RLS PARA DOCUMENTOS ENTRANTES
-- ============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos entrantes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir documentos entrantes" ON storage.objects;
DROP POLICY IF EXISTS "Solo el usuario que subió puede eliminar" ON storage.objects;

-- Política: Ver documentos entrantes (usuarios autenticados)
CREATE POLICY "Ver documentos entrantes"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documentos-entrantes'
    AND auth.uid() IN (
        SELECT id_usuario FROM public.tbl_usuarios WHERE estatus = 'Activo'
    )
);

-- Política: Subir documentos entrantes
CREATE POLICY "Subir documentos entrantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documentos-entrantes'
    AND auth.uid() IN (
        SELECT id_usuario FROM public.tbl_usuarios WHERE estatus = 'Activo'
    )
);

-- Política: Actualizar documentos entrantes (solo quien subió)
CREATE POLICY "Actualizar documentos entrantes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documentos-entrantes'
    AND auth.uid() = owner
);

-- Política: Eliminar documentos entrantes (solo admins)
CREATE POLICY "Eliminar documentos entrantes"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documentos-entrantes'
    AND auth.uid() IN (
        SELECT u.id_usuario
        FROM public.tbl_usuarios u
        JOIN public.cat_roles r ON u.id_rol = r.id_rol
        WHERE r.nombre_rol IN ('Administrador General', 'Administrador UA')
        AND u.estatus = 'Activo'
    )
);

-- ============================================================================
-- POLÍTICAS RLS PARA DOCUMENTOS SALIENTES
-- ============================================================================

CREATE POLICY "Ver documentos salientes"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documentos-salientes'
    AND auth.uid() IN (
        SELECT id_usuario FROM public.tbl_usuarios WHERE estatus = 'Activo'
    )
);

CREATE POLICY "Subir documentos salientes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documentos-salientes'
    AND auth.uid() IN (
        SELECT id_usuario FROM public.tbl_usuarios WHERE estatus = 'Activo'
    )
);

CREATE POLICY "Actualizar documentos salientes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documentos-salientes'
    AND auth.uid() = owner
);

CREATE POLICY "Eliminar documentos salientes"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documentos-salientes'
    AND auth.uid() IN (
        SELECT u.id_usuario
        FROM public.tbl_usuarios u
        JOIN public.cat_roles r ON u.id_rol = r.id_rol
        WHERE r.nombre_rol IN ('Administrador General', 'Administrador UA')
        AND u.estatus = 'Activo'
    )
);

-- ============================================================================
-- POLÍTICAS RLS PARA INVENTARIO
-- ============================================================================

CREATE POLICY "Ver imágenes inventario"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'inventario'
    AND auth.uid() IN (
        SELECT id_usuario FROM public.tbl_usuarios WHERE estatus = 'Activo'
    )
);

CREATE POLICY "Subir imágenes inventario"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'inventario'
    AND auth.uid() IN (
        SELECT id_usuario FROM public.tbl_usuarios WHERE estatus = 'Activo'
    )
);

CREATE POLICY "Actualizar imágenes inventario"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'inventario' AND auth.uid() = owner);

CREATE POLICY "Eliminar imágenes inventario"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'inventario'
    AND (
        auth.uid() = owner
        OR auth.uid() IN (
            SELECT u.id_usuario
            FROM public.tbl_usuarios u
            JOIN public.cat_roles r ON u.id_rol = r.id_rol
            WHERE r.nombre_rol IN ('Administrador General', 'Administrador UA')
        )
    )
);

-- ============================================================================
-- POLÍTICAS RLS PARA SEGUIMIENTOS
-- ============================================================================

CREATE POLICY "Ver seguimientos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'seguimientos'
    AND auth.uid() IN (
        SELECT id_usuario FROM public.tbl_usuarios WHERE estatus = 'Activo'
    )
);

CREATE POLICY "Subir seguimientos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'seguimientos'
    AND auth.uid() IN (
        SELECT id_usuario FROM public.tbl_usuarios WHERE estatus = 'Activo'
    )
);

CREATE POLICY "Actualizar seguimientos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'seguimientos' AND auth.uid() = owner);

CREATE POLICY "Eliminar seguimientos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'seguimientos' AND auth.uid() = owner);

-- ============================================================================
-- POLÍTICAS RLS PARA AVATARES (PÚBLICO)
-- ============================================================================

-- Avatares son públicos para lectura
CREATE POLICY "Avatares públicos para lectura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatares');

-- Solo el dueño puede subir su avatar
CREATE POLICY "Usuario sube su propio avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Solo el dueño puede actualizar su avatar
CREATE POLICY "Usuario actualiza su propio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Solo el dueño puede eliminar su avatar
CREATE POLICY "Usuario elimina su propio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatares'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- FUNCIONES HELPER PARA STORAGE
-- ============================================================================

-- Función: Generar path único para archivo
CREATE OR REPLACE FUNCTION generar_storage_path(
    p_bucket VARCHAR,
    p_id_entidad UUID,
    p_nombre_archivo VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_anio INT;
    v_mes INT;
    v_extension VARCHAR;
    v_timestamp BIGINT;
    v_random VARCHAR;
BEGIN
    v_anio := EXTRACT(YEAR FROM NOW());
    v_mes := EXTRACT(MONTH FROM NOW());
    v_timestamp := EXTRACT(EPOCH FROM NOW())::BIGINT;
    v_random := substr(md5(random()::text), 1, 8);

    -- Extraer extensión
    v_extension := substring(p_nombre_archivo from '\.([^\.]*)$');

    -- Formato: {año}/{mes}/{id_entidad}_{timestamp}_{random}.{ext}
    RETURN format('%s/%s/%s_%s_%s.%s',
        v_anio,
        LPAD(v_mes::TEXT, 2, '0'),
        p_id_entidad,
        v_timestamp,
        v_random,
        v_extension
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_storage_path IS 'Genera paths únicos organizados por año/mes para Storage';

-- Función: Validar MIME type permitido
CREATE OR REPLACE FUNCTION validar_mime_type(
    p_bucket VARCHAR,
    p_mime_type VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_allowed_types TEXT[];
BEGIN
    SELECT allowed_mime_types INTO v_allowed_types
    FROM storage.buckets
    WHERE id = p_bucket;

    IF v_allowed_types IS NULL THEN
        RETURN TRUE; -- Sin restricciones
    END IF;

    RETURN p_mime_type = ANY(v_allowed_types);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validar_mime_type IS 'Valida si un MIME type está permitido en un bucket';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT '✅ STORAGE CONFIGURADO' as estado;

SELECT
    id as bucket_id,
    name as nombre,
    public as es_publico,
    file_size_limit / 1024 / 1024 as tamaño_max_mb,
    array_length(allowed_mime_types, 1) as tipos_permitidos
FROM storage.buckets
WHERE id IN (
    'documentos-entrantes',
    'documentos-salientes',
    'inventario',
    'seguimientos',
    'avatares'
)
ORDER BY name;

-- Verificar políticas creadas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
ORDER BY policyname;
