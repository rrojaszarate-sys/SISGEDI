-- ============================================================================
-- SISGEDI 2.0 - SCRIPT CONSOLIDADO FINAL
-- ============================================================================
-- Este script ejecuta TODO lo que falta y devuelve resultado en formato MD
-- ============================================================================

-- ============================================================================
-- PARTE 1: DOCUMENTOS SALIENTES
-- ============================================================================

-- Tabla Documentos Salientes (mejorada)
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
CREATE INDEX IF NOT EXISTS idx_doc_sal_fecha ON tbl_documento_saliente_v2(fecha_elaboracion DESC);

-- Trigger auto-folio para documentos salientes
CREATE OR REPLACE FUNCTION generar_folio_saliente()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_folio VARCHAR(50);
    contador INTEGER;
    anio VARCHAR(4);
BEGIN
    anio := TO_CHAR(NEW.fecha_elaboracion, 'YYYY');

    SELECT COUNT(*) + 1 INTO contador
    FROM tbl_documento_saliente_v2
    WHERE TO_CHAR(fecha_elaboracion, 'YYYY') = anio;

    nuevo_folio := 'SAL-' || anio || '-' || LPAD(contador::TEXT, 4, '0');

    IF NEW.folio_saliente IS NULL OR NEW.folio_saliente = '' THEN
        NEW.folio_saliente := nuevo_folio;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generar_folio_saliente ON tbl_documento_saliente_v2;
CREATE TRIGGER trigger_generar_folio_saliente
BEFORE INSERT ON tbl_documento_saliente_v2
FOR EACH ROW
EXECUTE FUNCTION generar_folio_saliente();

-- Catálogos para documentos salientes
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

-- ============================================================================
-- PARTE 2: ROW LEVEL SECURITY (RLS) COMPLETO
-- ============================================================================

-- Habilitar RLS en todas las tablas
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

-- Funciones auxiliares para RLS
CREATE OR REPLACE FUNCTION es_usuario_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM tbl_usuarios u
        JOIN cat_roles r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol = 'Administrador General'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_ua()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id_ua
        FROM tbl_usuarios
        WHERE id_usuario = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas básicas (ya existen, las mantenemos)
-- Las políticas ya fueron creadas en el script anterior

-- Políticas para documentos salientes v2
DROP POLICY IF EXISTS "Ver docs salientes v2" ON tbl_documento_saliente_v2;
CREATE POLICY "Ver docs salientes v2" ON tbl_documento_saliente_v2 FOR SELECT TO authenticated
USING (id_ua_emisora = get_user_ua() OR es_usuario_admin());

DROP POLICY IF EXISTS "Crear docs salientes v2" ON tbl_documento_saliente_v2;
CREATE POLICY "Crear docs salientes v2" ON tbl_documento_saliente_v2 FOR INSERT TO authenticated
WITH CHECK (id_ua_emisora = get_user_ua());

DROP POLICY IF EXISTS "Actualizar docs salientes v2" ON tbl_documento_saliente_v2;
CREATE POLICY "Actualizar docs salientes v2" ON tbl_documento_saliente_v2 FOR UPDATE TO authenticated
USING (id_ua_emisora = get_user_ua() OR es_usuario_admin());

DROP POLICY IF EXISTS "Eliminar docs salientes v2" ON tbl_documento_saliente_v2;
CREATE POLICY "Eliminar docs salientes v2" ON tbl_documento_saliente_v2 FOR DELETE TO authenticated
USING (es_usuario_admin());

-- Políticas para Storage (documentos-salientes y acuses)
DROP POLICY IF EXISTS "Subir docs salientes storage" ON storage.objects;
CREATE POLICY "Subir docs salientes storage" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('documentos-salientes', 'acuses') AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Ver docs salientes storage" ON storage.objects;
CREATE POLICY "Ver docs salientes storage" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('documentos-salientes', 'acuses') AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Actualizar docs salientes storage" ON storage.objects;
CREATE POLICY "Actualizar docs salientes storage" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('documentos-salientes', 'acuses') AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eliminar docs salientes storage" ON storage.objects;
CREATE POLICY "Eliminar docs salientes storage" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('documentos-salientes', 'acuses') AND auth.uid() IS NOT NULL);

-- ============================================================================
-- PARTE 3: CREAR USUARIO ADMINISTRADOR (SI NO EXISTE)
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_rol_id UUID;
    v_ua_id UUID;
    v_email VARCHAR := 'admin@sisgedi.gob.mx';
BEGIN
    -- Buscar usuario en auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Buscar rol y UA
        SELECT id_rol INTO v_rol_id FROM cat_roles WHERE nombre_rol = 'Administrador General' LIMIT 1;
        SELECT id_ua INTO v_ua_id FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001' LIMIT 1;

        -- Insertar en tbl_usuarios si no existe
        INSERT INTO tbl_usuarios (id_usuario, clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, estatus)
        VALUES (v_user_id, 'ADMIN001', v_ua_id, v_rol_id, 'Administrador del Sistema', v_email, 'Activo')
        ON CONFLICT (id_usuario) DO NOTHING;
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: REPORTE CONSOLIDADO EN MARKDOWN
-- ============================================================================

SELECT '
# ✅ SISGEDI 2.0 - INSTALACIÓN COMPLETADA

## 📊 Resumen de Base de Datos

### Tablas Creadas
- **Total de tablas**: ' || (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') || '

### Catálogos
- **Roles**: ' || (SELECT COUNT(*) FROM cat_roles) || '
- **Valores de Catálogo**: ' || (SELECT COUNT(*) FROM cat_valores_catalogo) || '
- **Tipos de Catálogo**: ' || (SELECT COUNT(DISTINCT tipo_catalogo) FROM cat_valores_catalogo) || '

### Datos Organizacionales
- **Unidades Administrativas**: ' || (SELECT COUNT(*) FROM cat_unidad_administrativa) || '
- **Usuarios Registrados**: ' || (SELECT COUNT(*) FROM tbl_usuarios) || '

### Documentación
- **Documentos Entrantes**: ' || (SELECT COUNT(*) FROM tbl_documento_entrante) || '
- **Documentos Salientes**: ' || (SELECT COUNT(*) FROM tbl_documento_saliente_v2) || '
- **Turnados**: ' || (SELECT COUNT(*) FROM tbl_turnado) || '
- **Anexos**: ' || (SELECT COUNT(*) FROM tbl_anexos) || '

### Inventario
- **Items de Inventario**: ' || (SELECT COUNT(*) FROM tbl_inventario) || '

### Seguridad
- **RLS Habilitado**: ' ||
    (SELECT COUNT(*) || ' tablas' FROM pg_tables
     WHERE schemaname = 'public'
     AND rowsecurity = true) || '
- **Políticas Activas**: ' || (SELECT COUNT(*) FROM pg_policies) || '

## 📋 Roles Disponibles

' || (SELECT string_agg('- **' || nombre_rol || '**: ' || descripcion, E'\n', ORDER BY nombre_rol) FROM cat_roles) || '

## 📂 Tipos de Catálogo Configurados

' || (SELECT string_agg('- **' || tipo_catalogo || '** (' || COUNT(*) || ' valores)', E'\n', ORDER BY tipo_catalogo)
      FROM cat_valores_catalogo GROUP BY tipo_catalogo) || '

## 🏢 Unidades Administrativas

' || (SELECT string_agg('- ' || codigo_ua || ' - ' || nombre_ua || ' (Nivel ' || nivel_jerarquico || ')', E'\n', ORDER BY nivel_jerarquico, codigo_ua)
      FROM cat_unidad_administrativa) || '

## 👤 Usuarios Configurados

' || CASE
        WHEN (SELECT COUNT(*) FROM tbl_usuarios) > 0
        THEN (SELECT string_agg('- **' || nombre_completo || '** (' || correo_institucional || ') - ' || estatus, E'\n')
              FROM tbl_usuarios
              LIMIT 5)
        ELSE '- ⚠️ **NO HAY USUARIOS CREADOS AÚN**

  **Acción requerida:**
  1. Ve a Authentication > Users en Supabase
  2. Crea el usuario: admin@sisgedi.gob.mx
  3. Ejecuta el script SQL para vincularlo'
     END || '

## 🔒 Seguridad (RLS)

### Tablas Protegidas
' || (SELECT string_agg('- ✅ ' || tablename, E'\n', ORDER BY tablename)
      FROM pg_tables
      WHERE schemaname = 'public'
      AND rowsecurity = true
      AND tablename LIKE 'tbl_%' OR tablename LIKE 'cat_%') || '

## 📦 Storage Buckets Requeridos

### Buckets a Crear Manualmente en Supabase:
1. **documentos** (público) - Para documentos entrantes
2. **documentos-salientes** (público) - Para documentos salientes
3. **acuses** (público) - Para acuses de recibo
4. **inventario** (público) - Para fotos de inventario
5. **firmas** (público) - Para certificados digitales

**⚠️ IMPORTANTE**: Estos buckets deben crearse manualmente en Storage > New bucket

## ✅ Checklist de Deployment

- [x] Scripts SQL ejecutados
- [x] Tablas creadas (' || (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') || ')
- [x] RLS habilitado
- [x] Triggers configurados
- [x] Funciones creadas
- ' || CASE
        WHEN (SELECT COUNT(*) FROM tbl_usuarios) > 0
        THEN '[x]'
        ELSE '[ ]'
     END || ' Usuario administrador creado
- [ ] Storage buckets creados (manual)
- [ ] Variables de entorno en Vercel
- [ ] Deployment en Vercel

## 🚀 Siguientes Pasos

' || CASE
        WHEN (SELECT COUNT(*) FROM tbl_usuarios) = 0
        THEN '### ⚠️ PASO 1: Crear Usuario Admin (URGENTE)

1. Ve a **Authentication** > **Users** > **Add user**
2. Email: `admin@sisgedi.gob.mx`
3. Password: (tu contraseña segura)
4. ✅ Auto Confirm User
5. Ejecuta este SQL después:

```sql
DO $$
DECLARE
    v_user_id UUID;
    v_rol_id UUID;
    v_ua_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = ''admin@sisgedi.gob.mx'' LIMIT 1;
    SELECT id_rol INTO v_rol_id FROM cat_roles WHERE nombre_rol = ''Administrador General'' LIMIT 1;
    SELECT id_ua INTO v_ua_id FROM cat_unidad_administrativa WHERE codigo_ua = ''SS-001'' LIMIT 1;

    INSERT INTO tbl_usuarios (id_usuario, clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, estatus)
    VALUES (v_user_id, ''ADMIN001'', v_ua_id, v_rol_id, ''Administrador del Sistema'', ''admin@sisgedi.gob.mx'', ''Activo'');
END $$;
```

### PASO 2: '
        ELSE '### PASO 1: '
     END || 'Crear Storage Buckets

Ve a **Storage** en Supabase y crea los 5 buckets listados arriba.

### ' || CASE
        WHEN (SELECT COUNT(*) FROM tbl_usuarios) = 0
        THEN 'PASO 3'
        ELSE 'PASO 2'
     END || ': Configurar Variables en Vercel

Usa las variables del archivo `VERCEL_ENV_VARS.txt`

### ' || CASE
        WHEN (SELECT COUNT(*) FROM tbl_usuarios) = 0
        THEN 'PASO 4'
        ELSE 'PASO 3'
     END || ': Deploy en Vercel

El código ya está listo en GitHub, solo haz push para auto-deploy.

---

**🎉 Base de datos lista para producción!**

' as reporte_markdown;
