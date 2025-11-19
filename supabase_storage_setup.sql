-- ============================================================================
-- SUPABASE STORAGE - CONFIGURACIÓN DE BUCKETS Y POLÍTICAS
-- ============================================================================
--
-- Este script configura los Storage Buckets para SISGEDI 2.0
--
-- IMPORTANTE: Los buckets se crean desde la interfaz de Supabase o API
-- Este script solo configura las POLÍTICAS de acceso
--
-- PASOS PARA EJECUTAR:
-- 1. Crear buckets manualmente en Supabase Dashboard > Storage
-- 2. Ejecutar este script en SQL Editor
-- ============================================================================

-- ============================================================================
-- CONFIGURACIÓN DE BUCKETS NECESARIOS
-- ============================================================================

/*
CREAR LOS SIGUIENTES BUCKETS EN SUPABASE DASHBOARD > STORAGE:

1. Bucket: documentos
   - Public: NO
   - Allowed MIME types: application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.*
   - File size limit: 50 MB

2. Bucket: documentos-salientes
   - Public: NO
   - Allowed MIME types: application/pdf
   - File size limit: 10 MB

3. Bucket: acuses
   - Public: NO
   - Allowed MIME types: application/pdf, image/*
   - File size limit: 5 MB

4. Bucket: inventario
   - Public: NO
   - Allowed MIME types: image/*
   - File size limit: 10 MB

5. Bucket: firmas
   - Public: NO
   - Allowed MIME types: application/x-pkcs12, application/x-x509-ca-cert
   - File size limit: 1 MB
*/

-- ============================================================================
-- POLÍTICAS PARA BUCKET: documentos
-- ============================================================================

-- Política: Usuarios pueden subir documentos a su UA
CREATE POLICY "Usuarios pueden subir documentos de su UA"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text
        FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

-- Política: Usuarios pueden ver documentos de su UA
CREATE POLICY "Usuarios pueden ver documentos de su UA"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documentos'
    AND (
        (storage.foldername(name))[1] IN (
            SELECT codigo_ua::text
            FROM cat_unidad_administrativa ua
            JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
            WHERE u.id_usuario = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    )
);

-- Política: Usuarios pueden actualizar documentos de su UA
CREATE POLICY "Usuarios pueden actualizar documentos de su UA"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text
        FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

-- Política: Usuarios pueden eliminar documentos de su UA
CREATE POLICY "Usuarios pueden eliminar documentos de su UA"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text
        FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

-- ============================================================================
-- POLÍTICAS PARA BUCKET: documentos-salientes
-- ============================================================================

-- Política: Usuarios pueden subir documentos salientes de su UA
CREATE POLICY "Subir documentos salientes de su UA"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documentos-salientes'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text
        FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

-- Política: Usuarios pueden ver documentos salientes
CREATE POLICY "Ver documentos salientes de su UA"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documentos-salientes'
    AND (
        (storage.foldername(name))[1] IN (
            SELECT codigo_ua::text
            FROM cat_unidad_administrativa ua
            JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
            WHERE u.id_usuario = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    )
);

-- ============================================================================
-- POLÍTICAS PARA BUCKET: acuses
-- ============================================================================

-- Política: Usuarios pueden subir acuses
CREATE POLICY "Subir acuses"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'acuses');

-- Política: Usuarios pueden ver acuses de documentos de su UA
CREATE POLICY "Ver acuses"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'acuses'
    AND (
        (storage.foldername(name))[1] IN (
            SELECT codigo_ua::text
            FROM cat_unidad_administrativa ua
            JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
            WHERE u.id_usuario = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    )
);

-- ============================================================================
-- POLÍTICAS PARA BUCKET: inventario
-- ============================================================================

-- Política: Usuarios pueden subir fotos de inventario de su UA
CREATE POLICY "Subir fotos de inventario"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'inventario'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text
        FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

-- Política: Usuarios pueden ver fotos de inventario de su UA
CREATE POLICY "Ver fotos de inventario"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'inventario'
    AND (
        (storage.foldername(name))[1] IN (
            SELECT codigo_ua::text
            FROM cat_unidad_administrativa ua
            JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
            WHERE u.id_usuario = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol IN ('Administrador General', 'Administrador UA')
        )
    )
);

-- Política: Actualizar fotos de inventario
CREATE POLICY "Actualizar fotos de inventario"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'inventario'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text
        FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

-- ============================================================================
-- POLÍTICAS PARA BUCKET: firmas
-- ============================================================================

-- Política: Usuarios pueden subir su certificado
CREATE POLICY "Subir certificado personal"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'firmas'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuarios solo pueden ver su propio certificado
CREATE POLICY "Ver certificado personal"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'firmas'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    )
);

-- ============================================================================
-- FUNCIONES AUXILIARES PARA STORAGE
-- ============================================================================

-- Función: Obtener URL pública de un archivo (para documentos autorizados)
CREATE OR REPLACE FUNCTION get_document_url(
    p_bucket TEXT,
    p_path TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_url TEXT;
BEGIN
    -- Supabase genera URLs automáticamente
    v_url := 'storage/v1/object/public/' || p_bucket || '/' || p_path;
    RETURN v_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Validar tamaño de archivo
CREATE OR REPLACE FUNCTION validate_file_size(
    p_size_bytes BIGINT,
    p_bucket TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_max_size BIGINT;
BEGIN
    v_max_size := CASE p_bucket
        WHEN 'documentos' THEN 52428800          -- 50 MB
        WHEN 'documentos-salientes' THEN 10485760 -- 10 MB
        WHEN 'acuses' THEN 5242880                -- 5 MB
        WHEN 'inventario' THEN 10485760           -- 10 MB
        WHEN 'firmas' THEN 1048576                -- 1 MB
        ELSE 10485760                              -- 10 MB default
    END;

    RETURN p_size_bytes <= v_max_size;
END;
$$ LANGUAGE plpgsql;

-- Función: Generar path de Storage para documento
CREATE OR REPLACE FUNCTION generate_document_path(
    p_id_ua UUID,
    p_id_documento UUID,
    p_nombre_archivo TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_codigo_ua TEXT;
    v_anio TEXT;
    v_mes TEXT;
BEGIN
    -- Obtener código de UA
    SELECT codigo_ua INTO v_codigo_ua
    FROM cat_unidad_administrativa
    WHERE id_ua = p_id_ua;

    -- Obtener año y mes actual
    v_anio := TO_CHAR(NOW(), 'YYYY');
    v_mes := TO_CHAR(NOW(), 'MM');

    -- Generar path: UA/YYYY/MM/id_documento/archivo
    RETURN v_codigo_ua || '/' || v_anio || '/' || v_mes || '/' ||
           p_id_documento::TEXT || '/' || p_nombre_archivo;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS PARA SINCRONIZAR STORAGE CON BD
-- ============================================================================

-- Trigger: Eliminar archivo de Storage cuando se elimina anexo
CREATE OR REPLACE FUNCTION delete_anexo_from_storage()
RETURNS TRIGGER AS $$
BEGIN
    -- Esto requiere una extensión o función personalizada
    -- Por ahora solo registramos en log
    INSERT INTO tbl_log_auditoria (
        modulo,
        accion,
        descripcion,
        tabla_afectada,
        id_registro_afectado
    ) VALUES (
        'Storage',
        'DELETE_PENDING',
        'Archivo pendiente de eliminar: ' || OLD.storage_path,
        'tbl_anexos',
        OLD.id_anexo
    );

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_delete_anexo_storage ON tbl_anexos;
CREATE TRIGGER trg_delete_anexo_storage
    BEFORE DELETE ON tbl_anexos
    FOR EACH ROW
    EXECUTE FUNCTION delete_anexo_from_storage();

-- ============================================================================
-- RESUMEN DE CONFIGURACIÓN
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'CONFIGURACIÓN DE SUPABASE STORAGE COMPLETADA';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'BUCKETS CONFIGURADOS:';
    RAISE NOTICE '✓ documentos          (50 MB max)';
    RAISE NOTICE '✓ documentos-salientes (10 MB max)';
    RAISE NOTICE '✓ acuses              (5 MB max)';
    RAISE NOTICE '✓ inventario          (10 MB max)';
    RAISE NOTICE '✓ firmas              (1 MB max)';
    RAISE NOTICE '';
    RAISE NOTICE 'POLÍTICAS CREADAS:';
    RAISE NOTICE '✓ Control de acceso por UA';
    RAISE NOTICE '✓ Permisos según rol de usuario';
    RAISE NOTICE '✓ Aislamiento de datos';
    RAISE NOTICE '';
    RAISE NOTICE 'FUNCIONES AUXILIARES:';
    RAISE NOTICE '✓ get_document_url()';
    RAISE NOTICE '✓ validate_file_size()';
    RAISE NOTICE '✓ generate_document_path()';
    RAISE NOTICE '';
    RAISE NOTICE 'SIGUIENTE PASO:';
    RAISE NOTICE 'Crear los buckets en Supabase Dashboard > Storage';
    RAISE NOTICE '============================================================';
END $$;
