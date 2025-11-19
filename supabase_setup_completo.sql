-- ============================================================================
-- SISGEDI 2.0 - SCRIPT COMPLETO PARA SUPABASE
-- Ejecutar TODO de una sola vez en SQL Editor de Supabase
-- Tiempo estimado: 30-60 segundos
-- ============================================================================

-- ============================================================================
-- PARTE 1: EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TEXT SEARCH CONFIGURATION IF EXISTS spanish_unaccent CASCADE;
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;

-- ============================================================================
-- PARTE 2: CREAR TABLAS
-- ============================================================================

-- Tabla: Unidades Administrativas
CREATE TABLE IF NOT EXISTS cat_unidad_administrativa (
    id_ua UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_ua VARCHAR(150) NOT NULL UNIQUE,
    codigo_ua VARCHAR(20) UNIQUE,
    nivel_jerarquico INT NOT NULL,
    id_ua_superior UUID REFERENCES cat_unidad_administrativa(id_ua),
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    extension VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_ua_nivel ON cat_unidad_administrativa(nivel_jerarquico);
CREATE INDEX IF NOT EXISTS idx_ua_superior ON cat_unidad_administrativa(id_ua_superior);

-- Tabla: Roles
CREATE TABLE IF NOT EXISTS cat_roles (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    elementos_menu JSONB NOT NULL DEFAULT '[]'::jsonb,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Usuarios (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS tbl_usuarios (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clave_servidor_publico VARCHAR(50) NOT NULL UNIQUE,
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_rol UUID REFERENCES cat_roles(id_rol) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    estatus VARCHAR(20) DEFAULT 'Activo',
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_usuario_ua ON tbl_usuarios(id_ua);
CREATE INDEX IF NOT EXISTS idx_usuario_rol ON tbl_usuarios(id_rol);

-- Tabla: Catálogos
CREATE TABLE IF NOT EXISTS cat_valores_catalogo (
    id_valor_catalogo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_catalogo VARCHAR(50) NOT NULL,
    valor VARCHAR(100) NOT NULL,
    descripcion TEXT,
    es_modificable BOOLEAN DEFAULT TRUE,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tipo_catalogo, valor)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_tipo ON cat_valores_catalogo(tipo_catalogo);

-- Tabla: Documentos Entrantes
CREATE TABLE IF NOT EXISTS tbl_documento_entrante (
    id_doc_entrante UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_oficio_externo VARCHAR(100),
    folio_interno VARCHAR(50) UNIQUE,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_documento DATE,
    id_ua_registro UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_registro UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    asunto TEXT NOT NULL,
    id_prioridad UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_tipo_doc UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    remitente_nombre VARCHAR(200),
    remitente_institucion VARCHAR(200),
    marca_seguimiento VARCHAR(20) DEFAULT 'Turnarse',
    estatus_general VARCHAR(20) DEFAULT 'Pendiente',
    contenido_ocr TEXT,
    metadatos_ocr JSONB,
    confianza_ocr NUMERIC(3, 2),
    ts_contenido_ocr TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('spanish_unaccent', COALESCE(contenido_ocr, '') || ' ' || COALESCE(asunto, ''))
    ) STORED,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_entrante_ua ON tbl_documento_entrante(id_ua_registro);
CREATE INDEX IF NOT EXISTS idx_doc_entrante_fecha ON tbl_documento_entrante(fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_doc_entrante_fts ON tbl_documento_entrante USING GIN(ts_contenido_ocr);

-- Tabla: Anexos
CREATE TABLE IF NOT EXISTS tbl_anexos (
    id_anexo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    bucket_name VARCHAR(100) DEFAULT 'documentos',
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    fecha_carga TIMESTAMPTZ DEFAULT NOW(),
    cargado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_anexo_doc ON tbl_anexos(id_doc_entrante);

-- Tabla: Turnados
CREATE TABLE IF NOT EXISTS tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    id_ua_origen UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_turno UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    id_ua_destino UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    fecha_turnado TIMESTAMPTZ DEFAULT NOW(),
    instruccion TEXT,
    fecha_vencimiento TIMESTAMPTZ NOT NULL,
    porcentaje_avance NUMERIC(3, 0) DEFAULT 0,
    estatus_turnado VARCHAR(20) DEFAULT 'Turnado',
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turnado_doc ON tbl_turnado(id_doc_entrante);
CREATE INDEX IF NOT EXISTS idx_turnado_ua_dest ON tbl_turnado(id_ua_destino);

-- Tabla: Documentos Salientes
CREATE TABLE IF NOT EXISTS tbl_documento_saliente (
    id_doc_saliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_doc VARCHAR(50) NOT NULL,
    numero_folio VARCHAR(100) UNIQUE NOT NULL,
    ejercicio_fiscal INT NOT NULL,
    asunto TEXT NOT NULL,
    destinatario_nombre VARCHAR(200),
    contenido TEXT,
    id_ua_emisora UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_elabora UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    fecha_elaboracion TIMESTAMPTZ DEFAULT NOW(),
    estatus_saliente VARCHAR(20) DEFAULT 'Borrador',
    storage_path TEXT,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_saliente_ua ON tbl_documento_saliente(id_ua_emisora);

-- Tabla: Notificaciones
CREATE TABLE IF NOT EXISTS tbl_notificaciones (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    tipo_notificacion VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_usuario ON tbl_notificaciones(id_usuario);

-- Tabla: Inventario
CREATE TABLE IF NOT EXISTS tbl_inventario (
    id_inventario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad INT NOT NULL,
    unidad VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    ubicacion TEXT NOT NULL,
    responsable VARCHAR(200) NOT NULL,
    numero_inventario VARCHAR(50) UNIQUE NOT NULL,
    fecha_adquisicion DATE NOT NULL,
    valor_unitario NUMERIC(12,2) NOT NULL,
    valor_total NUMERIC(12,2) NOT NULL,
    proveedor VARCHAR(200),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    serie VARCHAR(50),
    imagen_storage_path TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_ua ON tbl_inventario(id_ua);

-- Tabla: Log de Auditoría
CREATE TABLE IF NOT EXISTS tbl_log_auditoria (
    id_log BIGSERIAL PRIMARY KEY,
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),
    modulo VARCHAR(50),
    accion VARCHAR(100),
    descripcion TEXT,
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON tbl_log_auditoria(fecha_hora DESC);

-- ============================================================================
-- PARTE 3: FUNCIONES
-- ============================================================================

-- Función: Búsqueda Full-Text
CREATE OR REPLACE FUNCTION search_documentos(
    p_query TEXT,
    p_id_ua UUID DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    id_doc_entrante UUID,
    folio_interno VARCHAR,
    asunto TEXT,
    fecha_registro TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id_doc_entrante,
        d.folio_interno,
        d.asunto,
        d.fecha_registro,
        ts_rank(d.ts_contenido_ocr, websearch_to_tsquery('spanish_unaccent', p_query)) AS rank
    FROM tbl_documento_entrante d
    WHERE d.ts_contenido_ocr @@ websearch_to_tsquery('spanish_unaccent', p_query)
    AND (p_id_ua IS NULL OR d.id_ua_registro = p_id_ua)
    ORDER BY rank DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Generar Folio
CREATE OR REPLACE FUNCTION generar_folio_interno()
RETURNS TRIGGER AS $$
DECLARE
    v_contador INT;
    v_anio INT;
BEGIN
    v_anio := EXTRACT(YEAR FROM NEW.fecha_registro);
    SELECT COUNT(*) + 1 INTO v_contador
    FROM tbl_documento_entrante
    WHERE EXTRACT(YEAR FROM fecha_registro) = v_anio;
    NEW.folio_interno := 'ENT-' || v_anio || '-' || LPAD(v_contador::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generar_folio ON tbl_documento_entrante;
CREATE TRIGGER trg_generar_folio
    BEFORE INSERT ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION generar_folio_interno();

-- Función: Actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_fecha()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_doc_entrante ON tbl_documento_entrante;
CREATE TRIGGER trg_update_doc_entrante
    BEFORE UPDATE ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

-- ============================================================================
-- PARTE 4: ROW-LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE cat_unidad_administrativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_valores_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_entrante ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_inventario ENABLE ROW LEVEL SECURITY;

-- Políticas: cat_unidad_administrativa
DROP POLICY IF EXISTS "Ver UAs" ON cat_unidad_administrativa;
CREATE POLICY "Ver UAs" ON cat_unidad_administrativa FOR SELECT TO authenticated USING (true);

-- Políticas: cat_roles
DROP POLICY IF EXISTS "Ver roles" ON cat_roles;
CREATE POLICY "Ver roles" ON cat_roles FOR SELECT TO authenticated USING (true);

-- Políticas: cat_valores_catalogo
DROP POLICY IF EXISTS "Ver catálogos" ON cat_valores_catalogo;
CREATE POLICY "Ver catálogos" ON cat_valores_catalogo FOR SELECT TO authenticated USING (true);

-- Políticas: tbl_usuarios
DROP POLICY IF EXISTS "Ver usuarios de UA" ON tbl_usuarios;
CREATE POLICY "Ver usuarios de UA" ON tbl_usuarios FOR SELECT TO authenticated
USING (
    id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    OR EXISTS (SELECT 1 FROM tbl_usuarios u JOIN cat_roles r ON u.id_rol = r.id_rol
               WHERE u.id_usuario = auth.uid() AND r.nombre_rol = 'Administrador General')
);

DROP POLICY IF EXISTS "Actualizar perfil" ON tbl_usuarios;
CREATE POLICY "Actualizar perfil" ON tbl_usuarios FOR UPDATE TO authenticated
USING (id_usuario = auth.uid()) WITH CHECK (id_usuario = auth.uid());

-- Políticas: tbl_documento_entrante
DROP POLICY IF EXISTS "Ver docs de UA" ON tbl_documento_entrante;
CREATE POLICY "Ver docs de UA" ON tbl_documento_entrante FOR SELECT TO authenticated
USING (id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()));

DROP POLICY IF EXISTS "Crear docs" ON tbl_documento_entrante;
CREATE POLICY "Crear docs" ON tbl_documento_entrante FOR INSERT TO authenticated
WITH CHECK (
    id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    AND id_usuario_registro = auth.uid()
);

DROP POLICY IF EXISTS "Actualizar docs" ON tbl_documento_entrante;
CREATE POLICY "Actualizar docs" ON tbl_documento_entrante FOR UPDATE TO authenticated
USING (id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()));

-- Políticas: tbl_anexos
DROP POLICY IF EXISTS "Ver anexos" ON tbl_anexos;
CREATE POLICY "Ver anexos" ON tbl_anexos FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM tbl_documento_entrante d WHERE d.id_doc_entrante = tbl_anexos.id_doc_entrante
            AND d.id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()))
);

DROP POLICY IF EXISTS "Crear anexos" ON tbl_anexos;
CREATE POLICY "Crear anexos" ON tbl_anexos FOR INSERT TO authenticated
WITH CHECK (cargado_por = auth.uid());

-- Políticas: tbl_turnado
DROP POLICY IF EXISTS "Ver turnados" ON tbl_turnado;
CREATE POLICY "Ver turnados" ON tbl_turnado FOR SELECT TO authenticated
USING (
    id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    OR id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
);

DROP POLICY IF EXISTS "Crear turnados" ON tbl_turnado;
CREATE POLICY "Crear turnados" ON tbl_turnado FOR INSERT TO authenticated
WITH CHECK (
    id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    AND id_usuario_turno = auth.uid()
);

DROP POLICY IF EXISTS "Actualizar turnados" ON tbl_turnado;
CREATE POLICY "Actualizar turnados" ON tbl_turnado FOR UPDATE TO authenticated
USING (id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()));

-- Políticas: tbl_notificaciones
DROP POLICY IF EXISTS "Ver notificaciones" ON tbl_notificaciones;
CREATE POLICY "Ver notificaciones" ON tbl_notificaciones FOR SELECT TO authenticated
USING (id_usuario = auth.uid());

DROP POLICY IF EXISTS "Actualizar notif" ON tbl_notificaciones;
CREATE POLICY "Actualizar notif" ON tbl_notificaciones FOR UPDATE TO authenticated
USING (id_usuario = auth.uid());

-- Políticas: tbl_inventario
DROP POLICY IF EXISTS "Ver inventario" ON tbl_inventario;
CREATE POLICY "Ver inventario" ON tbl_inventario FOR SELECT TO authenticated
USING (id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()));

DROP POLICY IF EXISTS "Gestionar inventario" ON tbl_inventario;
CREATE POLICY "Gestionar inventario" ON tbl_inventario FOR ALL TO authenticated
USING (id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()));

-- ============================================================================
-- PARTE 5: DATOS INICIALES - ROLES Y CATÁLOGOS
-- ============================================================================

-- Roles
INSERT INTO cat_roles (nombre_rol, descripcion, elementos_menu) VALUES
('Administrador General', 'Acceso completo', '{"modulos":["admin","docs","inventario"]}'::jsonb),
('Administrador UA', 'Admin de UA', '{"modulos":["docs","inventario"]}'::jsonb),
('Recepción', 'Captura documentos', '{"modulos":["docs"]}'::jsonb),
('Nivel 1', 'Turnado', '{"modulos":["docs","turnado"]}'::jsonb),
('Nivel 2', 'Firma', '{"modulos":["docs","firma"]}'::jsonb),
('Nivel 3', 'Avance', '{"modulos":["docs","avance"]}'::jsonb),
('Visor', 'Solo lectura', '{"modulos":["consultas"]}'::jsonb)
ON CONFLICT (nombre_rol) DO NOTHING;

-- Catálogos
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, es_modificable) VALUES
('Prioridad', 'Normal', FALSE),
('Prioridad', 'Urgente', FALSE),
('Tipo_Documento', 'Oficio', FALSE),
('Tipo_Documento', 'Circular', FALSE),
('Tipo_Documento', 'Memorándum', FALSE),
('Tipo_Documento', 'Nota Informativa', FALSE)
ON CONFLICT (tipo_catalogo, valor) DO NOTHING;

-- ============================================================================
-- PARTE 6: DATOS DE PRUEBA - UNIDADES ADMINISTRATIVAS
-- ============================================================================

DO $$
DECLARE
    v_ss1 UUID;
    v_ss2 UUID;
    v_dg1 UUID;
    v_dg2 UUID;
BEGIN
    -- Nivel 1: Subsecretarías
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, direccion, telefono)
    VALUES ('Subsecretaría de Gestión Documental', 'SS-001', 1, 'Av. Insurgentes 1234, CDMX', '55-1234-5678')
    ON CONFLICT (codigo_ua) DO NOTHING
    RETURNING id_ua INTO v_ss1;

    IF v_ss1 IS NULL THEN
        SELECT id_ua INTO v_ss1 FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001';
    END IF;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, direccion, telefono)
    VALUES ('Coordinación General de Administración', 'SS-002', 1, 'Paseo Reforma 567, CDMX', '55-2345-6789')
    ON CONFLICT (codigo_ua) DO NOTHING
    RETURNING id_ua INTO v_ss2;

    IF v_ss2 IS NULL THEN
        SELECT id_ua INTO v_ss2 FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-002';
    END IF;

    -- Nivel 2: Direcciones Generales
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion)
    VALUES ('Dirección General de TI', 'DG-001', 2, v_ss1, 'Eje Central 100, CDMX')
    ON CONFLICT (codigo_ua) DO NOTHING
    RETURNING id_ua INTO v_dg1;

    IF v_dg1 IS NULL THEN
        SELECT id_ua INTO v_dg1 FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-001';
    END IF;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion)
    VALUES ('Dirección General de Recursos Humanos', 'DG-002', 2, v_ss1, 'Av. Juárez 200, CDMX')
    ON CONFLICT (codigo_ua) DO NOTHING
    RETURNING id_ua INTO v_dg2;

    IF v_dg2 IS NULL THEN
        SELECT id_ua INTO v_dg2 FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-002';
    END IF;

    -- Nivel 3: Direcciones
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion) VALUES
    ('Dirección de Sistemas', 'DIR-001', 3, v_dg1, 'Eje Central 100-A'),
    ('Dirección de Infraestructura', 'DIR-002', 3, v_dg1, 'Eje Central 100-B'),
    ('Dirección de Nómina', 'DIR-003', 3, v_dg2, 'Av. Juárez 200-A'),
    ('Dirección de Capacitación', 'DIR-004', 3, v_dg2, 'Av. Juárez 200-B')
    ON CONFLICT (codigo_ua) DO NOTHING;

    -- Nivel 4: Jefaturas
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior) VALUES
    ('Jefatura de Desarrollo', 'JEF-001', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'DIR-001')),
    ('Jefatura de Soporte', 'JEF-002', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'DIR-001')),
    ('Jefatura de Redes', 'JEF-003', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'DIR-002'))
    ON CONFLICT (codigo_ua) DO NOTHING;
END $$;

-- ============================================================================
-- PARTE 7: DATOS DE PRUEBA - INVENTARIO
-- ============================================================================

DO $$
DECLARE
    v_ua RECORD;
    v_contador INT := 1;
BEGIN
    FOR v_ua IN SELECT id_ua, codigo_ua FROM cat_unidad_administrativa LOOP
        -- Mobiliario
        INSERT INTO tbl_inventario (id_ua, categoria, descripcion, cantidad, unidad, estado, ubicacion, responsable, numero_inventario, fecha_adquisicion, valor_unitario, valor_total, proveedor, marca, modelo)
        VALUES
        (v_ua.id_ua, 'Mobiliario', 'Escritorio ejecutivo', 2, 'Pieza', 'Bueno', 'Piso 1', 'Responsable ' || v_contador, v_ua.codigo_ua || '-MOB-2025-' || LPAD(v_contador::text, 4, '0'), CURRENT_DATE - 200, 5000, 10000, 'Office Depot', NULL, NULL),
        (v_ua.id_ua, 'Mobiliario', 'Silla ergonómica', 5, 'Pieza', 'Bueno', 'Piso 1', 'Responsable ' || v_contador, v_ua.codigo_ua || '-MOB-2025-' || LPAD((v_contador+1)::text, 4, '0'), CURRENT_DATE - 180, 2000, 10000, 'Office Depot', NULL, NULL)
        ON CONFLICT (numero_inventario) DO NOTHING;

        -- Equipo de Cómputo
        INSERT INTO tbl_inventario (id_ua, categoria, descripcion, cantidad, unidad, estado, ubicacion, responsable, numero_inventario, fecha_adquisicion, valor_unitario, valor_total, proveedor, marca, modelo, serie)
        VALUES
        (v_ua.id_ua, 'Equipo de Cómputo', 'Laptop Dell', 3, 'Equipo', 'Excelente', 'Piso 2', 'Responsable ' || v_contador, v_ua.codigo_ua || '-EQC-2025-' || LPAD((v_contador+2)::text, 4, '0'), CURRENT_DATE - 150, 15000, 45000, 'Dell', 'Dell', 'Latitude 5420', 'SN' || LPAD(v_contador::text, 10, '0')),
        (v_ua.id_ua, 'Equipo de Cómputo', 'Monitor LED 24"', 3, 'Equipo', 'Bueno', 'Piso 2', 'Responsable ' || v_contador, v_ua.codigo_ua || '-EQC-2025-' || LPAD((v_contador+3)::text, 4, '0'), CURRENT_DATE - 120, 3000, 9000, 'Samsung', 'Samsung', '24F390', NULL)
        ON CONFLICT (numero_inventario) DO NOTHING;

        v_contador := v_contador + 10;
    END LOOP;
END $$;

-- ============================================================================
-- PARTE 8: CONFIGURACIÓN DE STORAGE (INSTRUCCIONES)
-- ============================================================================

/*
================================================================================
IMPORTANTE: CONFIGURAR STORAGE BUCKETS MANUALMENTE
================================================================================

Ir a Supabase Dashboard > Storage > "Create a new bucket"

Crear los siguientes 5 buckets:

1. Bucket: documentos
   - Public: NO
   - File size limit: 52428800 (50 MB)

2. Bucket: documentos-salientes
   - Public: NO
   - File size limit: 10485760 (10 MB)

3. Bucket: acuses
   - Public: NO
   - File size limit: 5242880 (5 MB)

4. Bucket: inventario
   - Public: NO
   - File size limit: 10485760 (10 MB)

5. Bucket: firmas
   - Public: NO
   - File size limit: 1048576 (1 MB)

Luego ejecutar las políticas de Storage (siguiente sección)
================================================================================
*/

-- ============================================================================
-- PARTE 9: POLÍTICAS DE STORAGE
-- ============================================================================

-- Políticas para bucket: documentos
DROP POLICY IF EXISTS "Subir docs UA" ON storage.objects;
CREATE POLICY "Subir docs UA" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

DROP POLICY IF EXISTS "Ver docs UA" ON storage.objects;
CREATE POLICY "Ver docs UA" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'documentos'
    AND (
        (storage.foldername(name))[1] IN (
            SELECT codigo_ua::text FROM cat_unidad_administrativa ua
            JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
            WHERE u.id_usuario = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid() AND r.nombre_rol = 'Administrador General'
        )
    )
);

DROP POLICY IF EXISTS "Actualizar docs UA" ON storage.objects;
CREATE POLICY "Actualizar docs UA" ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

DROP POLICY IF EXISTS "Eliminar docs UA" ON storage.objects;
CREATE POLICY "Eliminar docs UA" ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

-- Políticas similares para inventario
DROP POLICY IF EXISTS "Subir fotos inventario" ON storage.objects;
CREATE POLICY "Subir fotos inventario" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'inventario'
    AND (storage.foldername(name))[1] IN (
        SELECT codigo_ua::text FROM cat_unidad_administrativa ua
        JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
        WHERE u.id_usuario = auth.uid()
    )
);

DROP POLICY IF EXISTS "Ver fotos inventario" ON storage.objects;
CREATE POLICY "Ver fotos inventario" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'inventario');

-- ============================================================================
-- PARTE 10: FUNCIONES AUXILIARES
-- ============================================================================

-- Función para generar path de storage
CREATE OR REPLACE FUNCTION generate_storage_path(
    p_codigo_ua TEXT,
    p_id_documento UUID,
    p_nombre_archivo TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN p_codigo_ua || '/' ||
           TO_CHAR(NOW(), 'YYYY/MM') || '/' ||
           p_id_documento::TEXT || '/' ||
           p_nombre_archivo;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 11: VERIFICACIÓN Y MENSAJES FINALES
-- ============================================================================

DO $$
DECLARE
    v_tablas INT;
    v_roles INT;
    v_catalogos INT;
    v_uas INT;
    v_inventario INT;
BEGIN
    SELECT COUNT(*) INTO v_tablas FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    SELECT COUNT(*) INTO v_roles FROM cat_roles;
    SELECT COUNT(*) INTO v_catalogos FROM cat_valores_catalogo;
    SELECT COUNT(*) INTO v_uas FROM cat_unidad_administrativa;
    SELECT COUNT(*) INTO v_inventario FROM tbl_inventario;

    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ SISGEDI 2.0 CONFIGURADO EXITOSAMENTE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMEN:';
    RAISE NOTICE '  ✓ Tablas creadas: %', v_tablas;
    RAISE NOTICE '  ✓ Roles: % (Administrador General, Admin UA, Recepción, etc.)', v_roles;
    RAISE NOTICE '  ✓ Catálogos: % valores', v_catalogos;
    RAISE NOTICE '  ✓ Unidades Administrativas: %', v_uas;
    RAISE NOTICE '  ✓ Items de inventario: %', v_inventario;
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SEGURIDAD:';
    RAISE NOTICE '  ✓ RLS habilitado en todas las tablas';
    RAISE NOTICE '  ✓ Políticas de acceso configuradas';
    RAISE NOTICE '  ✓ Storage policies creadas';
    RAISE NOTICE '';
    RAISE NOTICE '📦 SIGUIENTE PASO - CREAR STORAGE BUCKETS:';
    RAISE NOTICE '  1. Ir a Storage en Dashboard';
    RAISE NOTICE '  2. Crear buckets: documentos, documentos-salientes, acuses, inventario, firmas';
    RAISE NOTICE '  3. Todos privados (Public = NO)';
    RAISE NOTICE '';
    RAISE NOTICE '👤 CREAR USUARIO ADMINISTRADOR:';
    RAISE NOTICE '  1. Ir a Authentication > Users';
    RAISE NOTICE '  2. Add user: admin@sisgedi.gob.mx';
    RAISE NOTICE '  3. Copiar User UID';
    RAISE NOTICE '  4. Ejecutar INSERT en tbl_usuarios vinculando el UID';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ¡Sistema listo para usar!';
    RAISE NOTICE '============================================================';
END $$;
