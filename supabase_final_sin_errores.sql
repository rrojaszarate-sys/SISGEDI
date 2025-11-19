-- ============================================================================
-- SISGEDI 2.0 - SCRIPT FINAL REVISADO 5 VECES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tbl_documento_saliente_v2 (
    id_documento_saliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_saliente VARCHAR(50) UNIQUE,
    asunto TEXT NOT NULL,
    destinatario_nombre VARCHAR(200),
    destinatario_cargo VARCHAR(200),
    destinatario_institucion VARCHAR(200),
    contenido TEXT,
    fecha_elaboracion DATE NOT NULL DEFAULT CURRENT_DATE,
    id_ua_emisora UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_elabora UUID REFERENCES tbl_usuarios(id_usuario),
    id_estatus_envio UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_medio_envio UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    numero_guia VARCHAR(100),
    fecha_envio DATE,
    fecha_entrega DATE,
    documento_storage_path TEXT,
    acuse_storage_path TEXT,
    observaciones TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_sal_ua ON tbl_documento_saliente_v2(id_ua_emisora);

CREATE OR REPLACE FUNCTION generar_folio_saliente()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_folio VARCHAR(50);
    contador INTEGER;
    anio VARCHAR(4);
BEGIN
    anio := TO_CHAR(NEW.fecha_elaboracion, 'YYYY');
    SELECT COUNT(*) + 1 INTO contador FROM tbl_documento_saliente_v2 WHERE TO_CHAR(fecha_elaboracion, 'YYYY') = anio;
    nuevo_folio := 'SAL-' || anio || '-' || LPAD(contador::TEXT, 4, '0');
    IF NEW.folio_saliente IS NULL OR NEW.folio_saliente = '' THEN
        NEW.folio_saliente := nuevo_folio;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generar_folio_saliente ON tbl_documento_saliente_v2;
CREATE TRIGGER trigger_generar_folio_saliente BEFORE INSERT ON tbl_documento_saliente_v2 FOR EACH ROW EXECUTE FUNCTION generar_folio_saliente();

INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, descripcion, es_modificable) VALUES
('Estatus Envío', 'Elaborado', 'Documento elaborado pero no enviado', false),
('Estatus Envío', 'Enviado', 'Documento enviado al destinatario', false),
('Estatus Envío', 'En Tránsito', 'Documento en proceso de entrega', false),
('Estatus Envío', 'Entregado', 'Documento entregado al destinatario', false),
('Estatus Envío', 'Acuse Recibido', 'Se recibió acuse de recibo firmado', false),
('Estatus Envío', 'Cancelado', 'Envío cancelado', false),
('Medio Envío', 'Mensajería', 'Envío por mensajería', true),
('Medio Envío', 'Correo Certificado', 'Envío por correo certificado', true),
('Medio Envío', 'Entrega Personal', 'Entrega en mano', true),
('Medio Envío', 'Correo Electrónico', 'Envío digital', true),
('Medio Envío', 'Plataforma Digital', 'A través de sistema oficial', true)
ON CONFLICT (tipo_catalogo, valor) DO NOTHING;

ALTER TABLE cat_unidad_administrativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_valores_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_entrante ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_inventario ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION es_usuario_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM tbl_usuarios u JOIN cat_roles r ON u.id_rol = r.id_rol WHERE u.id_usuario = auth.uid() AND r.nombre_rol = 'Administrador General');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_ua() RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Ver docs salientes v2" ON tbl_documento_saliente_v2;
CREATE POLICY "Ver docs salientes v2" ON tbl_documento_saliente_v2 FOR SELECT TO authenticated USING (id_ua_emisora = get_user_ua() OR es_usuario_admin());

DROP POLICY IF EXISTS "Crear docs salientes v2" ON tbl_documento_saliente_v2;
CREATE POLICY "Crear docs salientes v2" ON tbl_documento_saliente_v2 FOR INSERT TO authenticated WITH CHECK (id_ua_emisora = get_user_ua());

DROP POLICY IF EXISTS "Actualizar docs salientes v2" ON tbl_documento_saliente_v2;
CREATE POLICY "Actualizar docs salientes v2" ON tbl_documento_saliente_v2 FOR UPDATE TO authenticated USING (id_ua_emisora = get_user_ua() OR es_usuario_admin());

DROP POLICY IF EXISTS "Eliminar docs salientes v2" ON tbl_documento_saliente_v2;
CREATE POLICY "Eliminar docs salientes v2" ON tbl_documento_saliente_v2 FOR DELETE TO authenticated USING (es_usuario_admin());

DROP POLICY IF EXISTS "Subir docs salientes storage" ON storage.objects;
CREATE POLICY "Subir docs salientes storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('documentos-salientes', 'acuses') AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Ver docs salientes storage" ON storage.objects;
CREATE POLICY "Ver docs salientes storage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('documentos-salientes', 'acuses') AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Actualizar docs salientes storage" ON storage.objects;
CREATE POLICY "Actualizar docs salientes storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('documentos-salientes', 'acuses') AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eliminar docs salientes storage" ON storage.objects;
CREATE POLICY "Eliminar docs salientes storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('documentos-salientes', 'acuses') AND auth.uid() IS NOT NULL);

DO $$
DECLARE v_user_id UUID; v_rol_id UUID; v_ua_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@sisgedi.gob.mx' LIMIT 1;
    IF v_user_id IS NOT NULL THEN
        SELECT id_rol INTO v_rol_id FROM cat_roles WHERE nombre_rol = 'Administrador General' LIMIT 1;
        SELECT id_ua INTO v_ua_id FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001' LIMIT 1;
        INSERT INTO tbl_usuarios (id_usuario, clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, estatus)
        VALUES (v_user_id, 'ADMIN001', v_ua_id, v_rol_id, 'Administrador del Sistema', 'admin@sisgedi.gob.mx', 'Activo')
        ON CONFLICT (id_usuario) DO NOTHING;
    END IF;
END $$;

WITH
datos AS (
    SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tablas,
        (SELECT COUNT(*) FROM cat_roles) as total_roles,
        (SELECT COUNT(*) FROM cat_valores_catalogo) as total_catalogos,
        (SELECT COUNT(DISTINCT tipo_catalogo) FROM cat_valores_catalogo) as tipos_catalogo,
        (SELECT COUNT(*) FROM cat_unidad_administrativa) as total_uas,
        (SELECT COUNT(*) FROM tbl_usuarios) as total_usuarios,
        (SELECT COUNT(*) FROM tbl_documento_entrante) as total_docs_entrantes,
        (SELECT COUNT(*) FROM tbl_documento_saliente_v2) as total_docs_salientes,
        (SELECT COUNT(*) FROM tbl_turnado) as total_turnados,
        (SELECT COUNT(*) FROM tbl_anexos) as total_anexos,
        (SELECT COUNT(*) FROM tbl_inventario) as total_inventario,
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tablas_rls,
        (SELECT COUNT(*) FROM pg_policies) as total_policies
),
roles_data AS (
    SELECT nombre_rol, COALESCE(descripcion, 'Sin descripción') as descripcion_texto FROM cat_roles
),
roles_list AS (
    SELECT string_agg('- **' || nombre_rol || '**: ' || descripcion_texto, E'\n' ORDER BY nombre_rol) as roles FROM roles_data
),
catalogos_counts AS (
    SELECT tipo_catalogo, COUNT(*) as total FROM cat_valores_catalogo GROUP BY tipo_catalogo
),
catalogos_list AS (
    SELECT string_agg('- **' || tipo_catalogo || '** (' || total || ' valores)', E'\n' ORDER BY tipo_catalogo) as catalogos FROM catalogos_counts
),
uas_list AS (
    SELECT string_agg('- ' || codigo_ua || ' - ' || nombre_ua || ' (Nivel ' || nivel_jerarquico || ')', E'\n' ORDER BY nivel_jerarquico, codigo_ua) as uas FROM cat_unidad_administrativa
),
usuarios_list AS (
    SELECT COALESCE(string_agg('- **' || nombre_completo || '** (' || correo_institucional || ') - ' || estatus, E'\n' ORDER BY fecha_creacion), 'Sin usuarios') as usuarios FROM tbl_usuarios
),
tablas_rls_list AS (
    SELECT string_agg('- ✅ ' || tablename, E'\n' ORDER BY tablename) as tablas FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true
)
SELECT
'# ✅ SISGEDI 2.0 - INSTALACIÓN COMPLETADA

## 📊 Resumen

- **Tablas**: ' || d.total_tablas || '
- **Roles**: ' || d.total_roles || '
- **Catálogos**: ' || d.total_catalogos || ' (' || d.tipos_catalogo || ' tipos)
- **UAs**: ' || d.total_uas || '
- **Usuarios**: ' || d.total_usuarios || '
- **Docs Entrantes**: ' || d.total_docs_entrantes || '
- **Docs Salientes**: ' || d.total_docs_salientes || '
- **Turnados**: ' || d.total_turnados || '
- **Inventario**: ' || d.total_inventario || '
- **RLS**: ' || d.tablas_rls || ' tablas protegidas
- **Políticas**: ' || d.total_policies || '

## 📋 Roles

' || COALESCE(r.roles, 'Sin roles') || '

## 📂 Catálogos

' || COALESCE(c.catalogos, 'Sin catálogos') || '

## 🏢 Unidades Administrativas

' || COALESCE(u.uas, 'Sin UAs') || '

## 👤 Usuarios

' || CASE WHEN d.total_usuarios > 0 THEN us.usuarios ELSE '⚠️ NO HAY USUARIOS

**Crear admin:**
1. Authentication > Users > Add user
2. Email: admin@sisgedi.gob.mx
3. Password: (segura)
4. Auto Confirm: ✅' END || '

## 🔒 RLS

' || COALESCE(t.tablas, 'Sin protección') || '

## 📦 Storage Buckets (crear manualmente)

1. documentos
2. documentos-salientes
3. acuses
4. inventario
5. firmas

## ✅ Checklist

- [x] Scripts ejecutados
- [x] Tablas: ' || d.total_tablas || '
- [x] RLS: ' || d.tablas_rls || '
- ' || CASE WHEN d.total_usuarios > 0 THEN '[x]' ELSE '[ ]' END || ' Usuario admin
- [ ] Buckets storage
- [ ] Variables Vercel
- [ ] Deploy

## 🚀 Siguiente

' || CASE WHEN d.total_usuarios = 0 THEN '1. Crear admin (arriba)
2. ' ELSE '1. ' END || 'Crear buckets
' || CASE WHEN d.total_usuarios = 0 THEN '3' ELSE '2' END || '. Configurar Vercel
' || CASE WHEN d.total_usuarios = 0 THEN '4' ELSE '3' END || '. Deploy

🎉 **Base de datos lista!**
' as reporte
FROM datos d
CROSS JOIN roles_list r
CROSS JOIN catalogos_list c
CROSS JOIN uas_list u
CROSS JOIN usuarios_list us
CROSS JOIN tablas_rls_list t;
