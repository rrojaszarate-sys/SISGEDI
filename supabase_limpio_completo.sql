-- ============================================================================
-- SISGEDI 2.0 - INSTALACIÓN LIMPIA COMPLETA
-- ============================================================================
-- ⚠️ ADVERTENCIA: Este script BORRA TODA la base de datos y la crea desde cero
-- Solo ejecutar en base de datos NUEVA o que quieres RESETEAR
-- ============================================================================

-- ============================================================================
-- PASO 1: BORRAR TODO
-- ============================================================================

DROP TABLE IF EXISTS tbl_log_auditoria CASCADE;
DROP TABLE IF EXISTS tbl_inventario CASCADE;
DROP TABLE IF EXISTS tbl_notificaciones CASCADE;
DROP TABLE IF EXISTS tbl_documento_saliente CASCADE;
DROP TABLE IF EXISTS tbl_turnado CASCADE;
DROP TABLE IF EXISTS tbl_anexos CASCADE;
DROP TABLE IF EXISTS tbl_documento_entrante CASCADE;
DROP TABLE IF EXISTS tbl_usuarios CASCADE;
DROP TABLE IF EXISTS cat_valores_catalogo CASCADE;
DROP TABLE IF EXISTS cat_roles CASCADE;
DROP TABLE IF EXISTS cat_unidad_administrativa CASCADE;

DROP FUNCTION IF EXISTS search_documentos CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha CASCADE;
DROP FUNCTION IF EXISTS generar_folio_interno CASCADE;
DROP FUNCTION IF EXISTS actualizar_ts_contenido_ocr CASCADE;

DROP TEXT SEARCH CONFIGURATION IF EXISTS spanish_unaccent CASCADE;

-- ============================================================================
-- PASO 2: EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración FTS
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;

-- ============================================================================
-- PASO 3: CREAR TABLAS
-- ============================================================================

-- Tabla: Unidades Administrativas
CREATE TABLE cat_unidad_administrativa (
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

CREATE INDEX idx_ua_nivel ON cat_unidad_administrativa(nivel_jerarquico);
CREATE INDEX idx_ua_superior ON cat_unidad_administrativa(id_ua_superior);

-- Tabla: Roles
CREATE TABLE cat_roles (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    elementos_menu JSONB NOT NULL DEFAULT '[]'::jsonb,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Catálogos
CREATE TABLE cat_valores_catalogo (
    id_valor_catalogo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_catalogo VARCHAR(50) NOT NULL,
    valor VARCHAR(100) NOT NULL,
    descripcion TEXT,
    es_modificable BOOLEAN DEFAULT TRUE,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tipo_catalogo, valor)
);

CREATE INDEX idx_catalogo_tipo ON cat_valores_catalogo(tipo_catalogo);

-- Tabla: Usuarios
CREATE TABLE tbl_usuarios (
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

CREATE INDEX idx_usuario_ua ON tbl_usuarios(id_ua);
CREATE INDEX idx_usuario_rol ON tbl_usuarios(id_rol);

-- Tabla: Documentos Entrantes
CREATE TABLE tbl_documento_entrante (
    id_doc_entrante UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_oficio_externo VARCHAR(100),
    folio_interno VARCHAR(50) UNIQUE,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_documento DATE,
    id_ua_registro UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_registro UUID REFERENCES tbl_usuarios(id_usuario),
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
    ts_contenido_ocr TSVECTOR,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_entrante_ua ON tbl_documento_entrante(id_ua_registro);
CREATE INDEX idx_doc_entrante_fecha ON tbl_documento_entrante(fecha_registro DESC);
CREATE INDEX idx_doc_entrante_fts ON tbl_documento_entrante USING GIN(ts_contenido_ocr);

-- Tabla: Anexos
CREATE TABLE tbl_anexos (
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

CREATE INDEX idx_anexo_doc ON tbl_anexos(id_doc_entrante);

-- Tabla: Turnados
CREATE TABLE tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    id_ua_origen UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_turno UUID REFERENCES tbl_usuarios(id_usuario),
    id_ua_destino UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    fecha_turnado TIMESTAMPTZ DEFAULT NOW(),
    instruccion TEXT,
    fecha_vencimiento TIMESTAMPTZ NOT NULL,
    porcentaje_avance NUMERIC(3, 0) DEFAULT 0,
    estatus_turnado VARCHAR(20) DEFAULT 'Turnado',
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turnado_doc ON tbl_turnado(id_doc_entrante);
CREATE INDEX idx_turnado_ua_dest ON tbl_turnado(id_ua_destino);

-- Tabla: Documentos Salientes
CREATE TABLE tbl_documento_saliente (
    id_doc_saliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_doc VARCHAR(50) NOT NULL,
    numero_folio VARCHAR(100) UNIQUE NOT NULL,
    ejercicio_fiscal INT NOT NULL,
    asunto TEXT NOT NULL,
    destinatario_nombre VARCHAR(200),
    contenido TEXT,
    id_ua_emisora UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_elabora UUID REFERENCES tbl_usuarios(id_usuario),
    fecha_elaboracion TIMESTAMPTZ DEFAULT NOW(),
    estatus_saliente VARCHAR(20) DEFAULT 'Borrador',
    storage_path TEXT,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_saliente_ua ON tbl_documento_saliente(id_ua_emisora);

-- Tabla: Notificaciones
CREATE TABLE tbl_notificaciones (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    tipo_notificacion VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON tbl_notificaciones(id_usuario);

-- Tabla: Inventario
CREATE TABLE tbl_inventario (
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

CREATE INDEX idx_inventario_ua ON tbl_inventario(id_ua);
CREATE INDEX idx_inventario_categoria ON tbl_inventario(categoria);

-- Tabla: Auditoría
CREATE TABLE tbl_log_auditoria (
    id_log BIGSERIAL PRIMARY KEY,
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),
    modulo VARCHAR(50),
    accion VARCHAR(100),
    descripcion TEXT,
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auditoria_fecha ON tbl_log_auditoria(fecha_hora DESC);

-- ============================================================================
-- PASO 4: FUNCIONES Y TRIGGERS
-- ============================================================================

-- Trigger para actualizar ts_contenido_ocr
CREATE OR REPLACE FUNCTION actualizar_ts_contenido_ocr()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ts_contenido_ocr := to_tsvector('spanish_unaccent',
        COALESCE(NEW.contenido_ocr, '') || ' ' || COALESCE(NEW.asunto, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_ts_ocr
    BEFORE INSERT OR UPDATE OF contenido_ocr, asunto ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION actualizar_ts_contenido_ocr();

-- Trigger para generar folios
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

CREATE TRIGGER trg_generar_folio
    BEFORE INSERT ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION generar_folio_interno();

-- Trigger para actualizar fechas
CREATE OR REPLACE FUNCTION actualizar_fecha()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_doc_entrante
    BEFORE UPDATE ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

CREATE TRIGGER trg_update_doc_saliente
    BEFORE UPDATE ON tbl_documento_saliente
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

-- Función de búsqueda FTS
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

-- ============================================================================
-- PASO 5: DATOS INICIALES
-- ============================================================================

-- Roles
INSERT INTO cat_roles (nombre_rol, descripcion, elementos_menu) VALUES
('Administrador General', 'Acceso completo al sistema', '{"modulos":["admin","documentos","inventario","reportes"]}'::jsonb),
('Administrador UA', 'Administrador de Unidad Administrativa', '{"modulos":["documentos","inventario","usuarios"]}'::jsonb),
('Recepción', 'Captura de documentos entrantes', '{"modulos":["documentos"]}'::jsonb),
('Nivel 1', 'Turnado y firma', '{"modulos":["documentos","turnado"]}'::jsonb),
('Nivel 2', 'Firma y avance', '{"modulos":["documentos","firma"]}'::jsonb),
('Nivel 3', 'Avance y conclusión', '{"modulos":["documentos","avance"]}'::jsonb),
('Visor', 'Solo consulta', '{"modulos":["consultas"]}'::jsonb);

-- Catálogos
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, es_modificable) VALUES
('Prioridad', 'Normal', FALSE),
('Prioridad', 'Urgente', FALSE),
('Tipo_Documento', 'Oficio', FALSE),
('Tipo_Documento', 'Circular', FALSE),
('Tipo_Documento', 'Memorándum', FALSE),
('Tipo_Documento', 'Nota Informativa', FALSE),
('Area_Remitente', 'Secretaría de Hacienda', TRUE),
('Area_Remitente', 'Secretaría de Economía', TRUE);

-- Unidades Administrativas
DO $$
DECLARE
    v_ss1 UUID;
    v_ss2 UUID;
    v_dg1 UUID;
BEGIN
    -- Nivel 1
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, direccion, telefono)
    VALUES ('Subsecretaría de Gestión Documental', 'SS-001', 1, 'Av. Insurgentes Sur 1234, CDMX', '55-1234-5678')
    RETURNING id_ua INTO v_ss1;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, direccion, telefono)
    VALUES ('Coordinación General de Administración', 'SS-002', 1, 'Paseo de la Reforma 567, CDMX', '55-2345-6789')
    RETURNING id_ua INTO v_ss2;

    -- Nivel 2
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion)
    VALUES ('Dirección General de Tecnologías de la Información', 'DG-001', 2, v_ss1, 'Eje Central Lázaro Cárdenas 100, CDMX')
    RETURNING id_ua INTO v_dg1;

    -- Nivel 3
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior) VALUES
    ('Dirección de Sistemas', 'DIR-001', 3, v_dg1),
    ('Dirección de Infraestructura', 'DIR-002', 3, v_dg1);
END $$;

-- ============================================================================
-- PASO 6: RESULTADO
-- ============================================================================

SELECT
    '✅ BASE DE DATOS CREADA EXITOSAMENTE' as estado,
    (SELECT COUNT(*) FROM cat_roles) as roles,
    (SELECT COUNT(*) FROM cat_valores_catalogo) as catalogos,
    (SELECT COUNT(*) FROM cat_unidad_administrativa) as unidades_admin,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tablas_totales;
