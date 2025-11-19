-- ============================================================================
-- SISGEDI 2.0 - POLÍTICAS RLS (ROW-LEVEL SECURITY)
-- Fecha: 2025-01-01
-- Descripción: Implementación de seguridad a nivel de fila por UA
-- ============================================================================

-- Habilitar RLS en todas las tablas críticas
ALTER TABLE tbl_documento_entrante ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS PARA tbl_documento_entrante
-- ============================================================================

-- Política: Usuario ve solo documentos de su UA
CREATE POLICY "rls_doc_entrante_select_ua"
  ON tbl_documento_entrante
  FOR SELECT
  USING (
    id_ua_registro IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- Política: Administrador General ve todo
CREATE POLICY "rls_doc_entrante_select_admin_general"
  ON tbl_documento_entrante
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM tbl_usuarios u
      JOIN cat_roles r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol = 'Administrador General'
    )
  );

-- Política: Solo usuarios de la UA pueden insertar
CREATE POLICY "rls_doc_entrante_insert"
  ON tbl_documento_entrante
  FOR INSERT
  WITH CHECK (
    id_ua_registro IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- Política: Solo pueden actualizar documentos de su UA
CREATE POLICY "rls_doc_entrante_update"
  ON tbl_documento_entrante
  FOR UPDATE
  USING (
    id_ua_registro IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  )
  WITH CHECK (
    id_ua_registro IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- ============================================================================
-- POLÍTICAS PARA tbl_turnado
-- ============================================================================

-- Política: Ver turnados donde la UA es origen o destino
CREATE POLICY "rls_turnado_select"
  ON tbl_turnado
  FOR SELECT
  USING (
    id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    OR id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
  );

-- Política: Solo puede turnar si es de la UA origen
CREATE POLICY "rls_turnado_insert"
  ON tbl_turnado
  FOR INSERT
  WITH CHECK (
    id_ua_origen IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- Política: Solo puede actualizar turnados de su UA destino
CREATE POLICY "rls_turnado_update"
  ON tbl_turnado
  FOR UPDATE
  USING (
    id_ua_destino IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- ============================================================================
-- POLÍTICAS PARA tbl_documento_saliente
-- ============================================================================

-- Política: Ver solo documentos salientes de su UA
CREATE POLICY "rls_doc_saliente_select"
  ON tbl_documento_saliente
  FOR SELECT
  USING (
    id_ua_elaboracion IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- Política: Insertar solo en su UA
CREATE POLICY "rls_doc_saliente_insert"
  ON tbl_documento_saliente
  FOR INSERT
  WITH CHECK (
    id_ua_elaboracion IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- ============================================================================
-- POLÍTICAS PARA tbl_usuarios (Administración)
-- ============================================================================

-- Solo Admin General puede ver todos los usuarios
CREATE POLICY "rls_usuarios_select_admin_general"
  ON tbl_usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM tbl_usuarios u
      JOIN cat_roles r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol = 'Administrador General'
    )
  );

-- Admin UA solo ve usuarios de su UA (RF3)
CREATE POLICY "rls_usuarios_select_admin_ua"
  ON tbl_usuarios
  FOR SELECT
  USING (
    id_ua IN (
      SELECT u2.id_ua
      FROM tbl_usuarios u2
      JOIN cat_roles r ON u2.id_rol = r.id_rol
      WHERE u2.id_usuario = auth.uid()
        AND r.nombre_rol = 'Administrador UA'
    )
  );

-- Admin UA solo puede crear usuarios en su UA
CREATE POLICY "rls_usuarios_insert_admin_ua"
  ON tbl_usuarios
  FOR INSERT
  WITH CHECK (
    id_ua IN (
      SELECT u.id_ua
      FROM tbl_usuarios u
      WHERE u.id_usuario = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM tbl_usuarios u
      JOIN cat_roles r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol IN ('Administrador UA', 'Administrador General')
    )
  );

-- Usuario puede ver su propio perfil
CREATE POLICY "rls_usuarios_select_self"
  ON tbl_usuarios
  FOR SELECT
  USING (id_usuario = auth.uid());

-- Usuario puede actualizar su propio perfil (campos limitados)
CREATE POLICY "rls_usuarios_update_self"
  ON tbl_usuarios
  FOR UPDATE
  USING (id_usuario = auth.uid())
  WITH CHECK (
    id_usuario = auth.uid()
    -- Asegurar que no cambien campos críticos
    AND id_ua = (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    AND id_rol = (SELECT id_rol FROM tbl_usuarios WHERE id_usuario = auth.uid())
  );

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY "rls_doc_entrante_select_ua" ON tbl_documento_entrante IS
  'RF1: Usuarios solo ven documentos de su Unidad Administrativa';

COMMENT ON POLICY "rls_doc_entrante_select_admin_general" ON tbl_documento_entrante IS
  'RF2: Administrador General tiene acceso total al sistema';

COMMENT ON POLICY "rls_turnado_select" ON tbl_turnado IS
  'RF13: Usuarios ven turnados donde su UA es origen o destino';

COMMENT ON POLICY "rls_usuarios_insert_admin_ua" ON tbl_usuarios IS
  'RF3: Administrador UA crea usuarios solo en su dirección';
