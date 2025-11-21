-- ============================================================================
-- SISGEDI 2.0 - ACTIVAR ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Ejecutar SOLO cuando el sistema esté listo para producción
-- Prerequisito: Haber ejecutado SCRIPT_DEFINITIVO_SIN_RLS.sql
-- ============================================================================

-- ============================================================================
-- PARTE 1: HABILITAR RLS EN TABLAS CRÍTICAS
-- ============================================================================

-- Documentos Entrantes
ALTER TABLE tbl_documento_entrante ENABLE ROW LEVEL SECURITY;

-- Turnados
ALTER TABLE tbl_turnado ENABLE ROW LEVEL SECURITY;

-- Documentos Salientes
ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;

-- Usuarios
ALTER TABLE tbl_usuarios ENABLE ROW LEVEL SECURITY;

-- Notificaciones
ALTER TABLE tbl_notificaciones ENABLE ROW LEVEL SECURITY;

-- Inventario
ALTER TABLE tbl_inventario ENABLE ROW LEVEL SECURITY;

-- Firmas
ALTER TABLE tbl_firmas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PARTE 2: POLÍTICAS PARA tbl_documento_entrante
-- ============================================================================

-- Usuarios ven documentos de su UA (no eliminados)
CREATE POLICY "doc_entrante_select_ua"
    ON tbl_documento_entrante FOR SELECT
    USING (
        eliminado = FALSE AND (
            -- Usuario de la misma UA
            id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
            -- O es Admin General
            OR EXISTS (
                SELECT 1 FROM tbl_usuarios u
                JOIN cat_roles r ON u.id_rol = r.id_rol
                WHERE u.id_usuario = auth.uid()
                AND r.nombre_rol = 'Administrador General'
            )
        )
    );

-- Solo usuarios de la UA pueden insertar
CREATE POLICY "doc_entrante_insert"
    ON tbl_documento_entrante FOR INSERT
    WITH CHECK (
        id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Solo usuarios de la UA pueden actualizar
CREATE POLICY "doc_entrante_update"
    ON tbl_documento_entrante FOR UPDATE
    USING (
        id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Solo Admin General puede eliminar (soft delete)
CREATE POLICY "doc_entrante_delete"
    ON tbl_documento_entrante FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

-- ============================================================================
-- PARTE 3: POLÍTICAS PARA tbl_turnado
-- ============================================================================

-- Ver turnados donde la UA es origen o destino
CREATE POLICY "turnado_select"
    ON tbl_turnado FOR SELECT
    USING (
        -- UA origen
        id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        -- O UA destino
        OR id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        -- O Admin General
        OR EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

-- Solo puede turnar si es de la UA origen
CREATE POLICY "turnado_insert"
    ON tbl_turnado FOR INSERT
    WITH CHECK (
        id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Solo UA destino puede actualizar (recibir, avanzar, etc.)
CREATE POLICY "turnado_update"
    ON tbl_turnado FOR UPDATE
    USING (
        id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

-- ============================================================================
-- PARTE 4: POLÍTICAS PARA tbl_documento_saliente
-- ============================================================================

-- Ver documentos de su UA
CREATE POLICY "doc_saliente_select"
    ON tbl_documento_saliente FOR SELECT
    USING (
        id_ua_emisora IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

-- Insertar en su UA
CREATE POLICY "doc_saliente_insert"
    ON tbl_documento_saliente FOR INSERT
    WITH CHECK (
        id_ua_emisora IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Actualizar en su UA
CREATE POLICY "doc_saliente_update"
    ON tbl_documento_saliente FOR UPDATE
    USING (
        id_ua_emisora IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- ============================================================================
-- PARTE 5: POLÍTICAS PARA tbl_usuarios
-- ============================================================================

-- Usuarios pueden ver su propio perfil
CREATE POLICY "usuarios_select_self"
    ON tbl_usuarios FOR SELECT
    USING (id_usuario = auth.uid());

-- Admin UA ve usuarios de su UA
CREATE POLICY "usuarios_select_admin_ua"
    ON tbl_usuarios FOR SELECT
    USING (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        AND EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol IN ('Administrador UA', 'Administrador General')
        )
    );

-- Admin General ve todos
CREATE POLICY "usuarios_select_admin_general"
    ON tbl_usuarios FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

-- Admin UA puede insertar en su UA
CREATE POLICY "usuarios_insert"
    ON tbl_usuarios FOR INSERT
    WITH CHECK (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        AND EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol IN ('Administrador UA', 'Administrador General')
        )
    );

-- Admin puede actualizar usuarios de su UA
CREATE POLICY "usuarios_update"
    ON tbl_usuarios FOR UPDATE
    USING (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        AND EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol IN ('Administrador UA', 'Administrador General')
        )
    );

-- ============================================================================
-- PARTE 6: POLÍTICAS PARA tbl_notificaciones
-- ============================================================================

-- Solo el usuario destinatario ve sus notificaciones
CREATE POLICY "notificaciones_select"
    ON tbl_notificaciones FOR SELECT
    USING (id_usuario = auth.uid());

-- Solo el usuario puede marcar como leídas
CREATE POLICY "notificaciones_update"
    ON tbl_notificaciones FOR UPDATE
    USING (id_usuario = auth.uid());

-- Sistema puede insertar (service role)
CREATE POLICY "notificaciones_insert"
    ON tbl_notificaciones FOR INSERT
    WITH CHECK (true);  -- El sistema crea notificaciones

-- ============================================================================
-- PARTE 7: POLÍTICAS PARA tbl_inventario
-- ============================================================================

-- Ver inventario de su UA
CREATE POLICY "inventario_select"
    ON tbl_inventario FOR SELECT
    USING (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

-- Insertar en su UA
CREATE POLICY "inventario_insert"
    ON tbl_inventario FOR INSERT
    WITH CHECK (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Actualizar en su UA
CREATE POLICY "inventario_update"
    ON tbl_inventario FOR UPDATE
    USING (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- ============================================================================
-- PARTE 8: POLÍTICAS PARA tbl_firmas
-- ============================================================================

-- Ver sus propias firmas
CREATE POLICY "firmas_select_self"
    ON tbl_firmas FOR SELECT
    USING (id_usuario = auth.uid());

-- Admin General ve todas las firmas
CREATE POLICY "firmas_select_admin"
    ON tbl_firmas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

-- Usuario puede crear sus propias firmas
CREATE POLICY "firmas_insert"
    ON tbl_firmas FOR INSERT
    WITH CHECK (id_usuario = auth.uid());

-- ============================================================================
-- PARTE 9: VERIFICACIÓN
-- ============================================================================

-- Verificar que RLS está activo
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
      'tbl_documento_entrante',
      'tbl_turnado',
      'tbl_documento_saliente',
      'tbl_usuarios',
      'tbl_notificaciones',
      'tbl_inventario',
      'tbl_firmas'
  )
ORDER BY tablename;

-- Contar políticas creadas
SELECT
    '✅ RLS ACTIVADO EXITOSAMENTE' as estado,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as politicas_creadas,
    NOW() as fecha;

-- Listar todas las políticas
SELECT
    tablename,
    policyname,
    cmd as operacion
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- FIN DEL SCRIPT DE RLS
-- ============================================================================
