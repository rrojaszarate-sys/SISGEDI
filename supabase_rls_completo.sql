-- ============================================================================
-- SISGEDI 2.0 - ROW LEVEL SECURITY (RLS) COMPLETO
-- ============================================================================
-- Script para activar y configurar RLS en todas las tablas
-- CRÍTICO: Ejecutar antes de deployment en producción
-- ============================================================================

-- ============================================================================
-- PASO 1: ACTIVAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE cat_unidad_administrativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_valores_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_entrante ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_inventario ENABLE ROW LEVEL SECURITY;

-- Si existe la tabla de documentos salientes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tbl_documento_saliente') THEN
        ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================================
-- PASO 2: ELIMINAR POLÍTICAS EXISTENTES (SI LAS HAY)
-- ============================================================================

DROP POLICY IF EXISTS "Usuarios ven UAs activas" ON cat_unidad_administrativa;
DROP POLICY IF EXISTS "Usuarios ven roles" ON cat_roles;
DROP POLICY IF EXISTS "Usuarios ven catálogos activos" ON cat_valores_catalogo;
DROP POLICY IF EXISTS "Usuarios ven perfil propio y de su UA" ON tbl_usuarios;
DROP POLICY IF EXISTS "Usuarios actualizan su perfil" ON tbl_usuarios;
DROP POLICY IF EXISTS "Usuarios ven documentos de su UA" ON tbl_documento_entrante;
DROP POLICY IF EXISTS "Usuarios crean documentos para su UA" ON tbl_documento_entrante;
DROP POLICY IF EXISTS "Usuarios actualizan documentos de su UA" ON tbl_documento_entrante;
DROP POLICY IF EXISTS "Usuarios ven turnados relacionados con su UA" ON tbl_turnado;
DROP POLICY IF EXISTS "Usuarios crean turnados desde su UA" ON tbl_turnado;
DROP POLICY IF EXISTS "Usuarios actualizan turnados recibidos" ON tbl_turnado;
DROP POLICY IF EXISTS "Usuarios ven inventario de su UA" ON tbl_inventario;
DROP POLICY IF EXISTS "Usuarios crean inventario en su UA" ON tbl_inventario;
DROP POLICY IF EXISTS "Usuarios actualizan inventario de su UA" ON tbl_inventario;
DROP POLICY IF EXISTS "Usuarios ven documentos de su UA" ON tbl_documento_saliente;
DROP POLICY IF EXISTS "Usuarios crean documentos de su UA" ON tbl_documento_saliente;
DROP POLICY IF EXISTS "Usuarios actualizan sus documentos" ON tbl_documento_saliente;

-- ============================================================================
-- PASO 3: CATÁLOGOS - Acceso de solo lectura para todos
-- ============================================================================

-- cat_unidad_administrativa: Todos ven UAs activas
CREATE POLICY "Usuarios ven UAs activas" ON cat_unidad_administrativa
    FOR SELECT
    USING (activa = true);

-- cat_roles: Todos ven roles
CREATE POLICY "Usuarios ven roles" ON cat_roles
    FOR SELECT
    USING (true);

-- cat_valores_catalogo: Todos ven catálogos activos
CREATE POLICY "Usuarios ven catálogos activos" ON cat_valores_catalogo
    FOR SELECT
    USING (activo = true);

-- ============================================================================
-- PASO 4: USUARIOS - Ver solo usuarios de su UA o su propio perfil
-- ============================================================================

-- Ver: Usuarios ven su perfil y usuarios de su misma UA
CREATE POLICY "Usuarios ven perfil propio y de su UA" ON tbl_usuarios
    FOR SELECT
    USING (
        id_usuario = auth.uid() -- Ver su propio perfil
        OR
        id_ua IN ( -- O usuarios de su misma UA
            SELECT id_ua
            FROM tbl_usuarios
            WHERE id_usuario = auth.uid()
        )
    );

-- Actualizar: Usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Usuarios actualizan su perfil" ON tbl_usuarios
    FOR UPDATE
    USING (id_usuario = auth.uid())
    WITH CHECK (id_usuario = auth.uid());

-- ============================================================================
-- PASO 5: DOCUMENTOS ENTRANTES
-- ============================================================================

-- Ver: Usuarios ven documentos de su UA o documentos que han registrado
CREATE POLICY "Usuarios ven documentos de su UA" ON tbl_documento_entrante
    FOR SELECT
    USING (
        id_ua_destinataria IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
        OR
        id_usuario_registro = auth.uid()
    );

-- Insertar: Usuarios pueden crear documentos para su UA
CREATE POLICY "Usuarios crean documentos para su UA" ON tbl_documento_entrante
    FOR INSERT
    WITH CHECK (
        id_ua_destinataria IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
    );

-- Actualizar: Usuarios pueden actualizar documentos de su UA
CREATE POLICY "Usuarios actualizan documentos de su UA" ON tbl_documento_entrante
    FOR UPDATE
    USING (
        id_ua_destinataria IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
    )
    WITH CHECK (
        id_ua_destinataria IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
    );

-- ============================================================================
-- PASO 6: TURNADOS
-- ============================================================================

-- Ver: Usuarios ven turnados donde su UA es origen o destino
CREATE POLICY "Usuarios ven turnados relacionados con su UA" ON tbl_turnado
    FOR SELECT
    USING (
        id_ua_origen IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
        OR
        id_ua_destino IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
        OR
        id_usuario_turna = auth.uid()
        OR
        id_usuario_destino = auth.uid()::text
    );

-- Insertar: Usuarios pueden crear turnados desde su UA
CREATE POLICY "Usuarios crean turnados desde su UA" ON tbl_turnado
    FOR INSERT
    WITH CHECK (
        id_ua_origen IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
    );

-- Actualizar: Usuarios de UA destino pueden actualizar el turnado
CREATE POLICY "Usuarios actualizan turnados recibidos" ON tbl_turnado
    FOR UPDATE
    USING (
        id_ua_destino IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
        OR
        id_usuario_turna = auth.uid()
    )
    WITH CHECK (
        id_ua_destino IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
        OR
        id_usuario_turna = auth.uid()
    );

-- ============================================================================
-- PASO 7: INVENTARIO
-- ============================================================================

-- Ver: Usuarios ven inventario de su UA o del que son responsables
CREATE POLICY "Usuarios ven inventario de su UA" ON tbl_inventario
    FOR SELECT
    USING (
        id_ua_asignada IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
        OR
        id_usuario_responsable = auth.uid()::text
        OR
        id_usuario_resguardo = auth.uid()::text
    );

-- Insertar: Usuarios pueden crear inventario en su UA
CREATE POLICY "Usuarios crean inventario en su UA" ON tbl_inventario
    FOR INSERT
    WITH CHECK (
        id_ua_asignada IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
    );

-- Actualizar: Usuarios pueden actualizar inventario de su UA
CREATE POLICY "Usuarios actualizan inventario de su UA" ON tbl_inventario
    FOR UPDATE
    USING (
        id_ua_asignada IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
    )
    WITH CHECK (
        id_ua_asignada IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
    );

-- ============================================================================
-- PASO 8: DOCUMENTOS SALIENTES (Si la tabla existe)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tbl_documento_saliente') THEN
        -- Ver: Usuarios ven documentos de su UA o que ellos elaboraron
        EXECUTE 'CREATE POLICY "Usuarios ven documentos de su UA" ON tbl_documento_saliente
            FOR SELECT
            USING (
                id_ua_remitente IN (
                    SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
                )
                OR id_usuario_elabora = auth.uid()
            )';

        -- Insertar: Usuarios pueden crear documentos de su UA
        EXECUTE 'CREATE POLICY "Usuarios crean documentos de su UA" ON tbl_documento_saliente
            FOR INSERT
            WITH CHECK (
                id_ua_remitente IN (
                    SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
                )
            )';

        -- Actualizar: Usuarios pueden actualizar documentos que elaboraron
        EXECUTE 'CREATE POLICY "Usuarios actualizan sus documentos" ON tbl_documento_saliente
            FOR UPDATE
            USING (id_usuario_elabora = auth.uid())
            WITH CHECK (id_usuario_elabora = auth.uid())';
    END IF;
END $$;

-- ============================================================================
-- PASO 9: FUNCIONES HELPER PARA RLS
-- ============================================================================

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION es_usuario_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM tbl_usuarios u
        JOIN cat_roles r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol = 'Administrador'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener UA del usuario actual
CREATE OR REPLACE FUNCTION get_user_ua()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT id_ua
        FROM tbl_usuarios
        WHERE id_usuario = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario tiene un rol específico
CREATE OR REPLACE FUNCTION tiene_rol(nombre_rol_buscar TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM tbl_usuarios u
        JOIN cat_roles r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol = nombre_rol_buscar
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 10: POLÍTICAS ESPECIALES PARA ADMINISTRADORES
-- ============================================================================

-- Los administradores pueden ver todos los documentos
CREATE POLICY "Administradores ven todos los documentos" ON tbl_documento_entrante
    FOR ALL
    USING (es_usuario_admin())
    WITH CHECK (es_usuario_admin());

CREATE POLICY "Administradores ven todos los turnados" ON tbl_turnado
    FOR ALL
    USING (es_usuario_admin())
    WITH CHECK (es_usuario_admin());

CREATE POLICY "Administradores ven todo el inventario" ON tbl_inventario
    FOR ALL
    USING (es_usuario_admin())
    WITH CHECK (es_usuario_admin());

CREATE POLICY "Administradores ven todos los usuarios" ON tbl_usuarios
    FOR ALL
    USING (es_usuario_admin())
    WITH CHECK (es_usuario_admin());

-- ============================================================================
-- PASO 11: STORAGE POLICIES (Para Supabase Storage)
-- ============================================================================

-- Políticas para bucket 'documentos'
-- Usuarios pueden subir archivos
CREATE POLICY "Usuarios pueden subir documentos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documentos'
    AND auth.role() = 'authenticated'
);

-- Usuarios pueden leer archivos de su UA
CREATE POLICY "Usuarios pueden leer documentos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documentos'
    AND auth.role() = 'authenticated'
);

-- Políticas similares para otros buckets
CREATE POLICY "Usuarios pueden subir a inventario"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'inventario'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuarios pueden leer inventario"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'inventario'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuarios pueden subir acuses"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'acuses'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuarios pueden leer acuses"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'acuses'
    AND auth.role() = 'authenticated'
);

-- ============================================================================
-- PASO 12: VERIFICACIÓN
-- ============================================================================

-- Ver todas las políticas creadas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Ver funciones helper creadas
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('es_usuario_admin', 'get_user_ua', 'tiene_rol');

-- Verificar que RLS está activado
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- PASO 13: ROLLBACK (SI ES NECESARIO)
-- ============================================================================

-- En caso de querer desactivar RLS temporalmente (solo para debugging):
/*
ALTER TABLE cat_unidad_administrativa DISABLE ROW LEVEL SECURITY;
ALTER TABLE cat_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE cat_valores_catalogo DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_entrante DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente DISABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. RLS DEBE ESTAR ACTIVADO EN PRODUCCIÓN
   - Protege datos sensibles
   - Previene acceso no autorizado
   - Cumple con normativas de seguridad

2. TESTING DESPUÉS DE ACTIVAR RLS:
   - Probar con usuarios de diferentes UAs
   - Verificar que solo ven sus documentos
   - Probar creación, lectura, actualización

3. ROLES ESPECIALES:
   - Administrador: Ve y modifica todo
   - Usuario normal: Solo su UA
   - Responsable de inventario: Sus bienes asignados

4. STORAGE:
   - Los archivos también tienen RLS
   - Solo usuarios autenticados pueden subir
   - Pueden leer según su UA

5. MONITOREO:
   - Revisar logs de acceso
   - Auditar intentos de acceso denegado
   - Actualizar políticas según necesidades

6. PERFORMANCE:
   - RLS puede afectar rendimiento
   - Crear índices en columnas usadas en políticas
   - Monitorear queries lentas

7. ACTUALIZACIONES:
   - Al agregar nuevas tablas, agregar RLS
   - Documentar cambios en políticas
   - Probar exhaustivamente antes de deployment
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RLS CONFIGURADO EXITOSAMENTE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Políticas creadas para:';
    RAISE NOTICE '  - Catálogos (lectura)';
    RAISE NOTICE '  - Usuarios (su UA)';
    RAISE NOTICE '  - Documentos Entrantes (su UA)';
    RAISE NOTICE '  - Turnados (origen/destino UA)';
    RAISE NOTICE '  - Inventario (su UA)';
    RAISE NOTICE '  - Documentos Salientes (su UA)';
    RAISE NOTICE '  - Storage (autenticados)';
    RAISE NOTICE '';
    RAISE NOTICE 'Funciones helper creadas:';
    RAISE NOTICE '  - es_usuario_admin()';
    RAISE NOTICE '  - get_user_ua()';
    RAISE NOTICE '  - tiene_rol(nombre)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE: Probar exhaustivamente antes de usar en producción';
    RAISE NOTICE '============================================================================';
END $$;
