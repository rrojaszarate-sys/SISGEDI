-- ============================================================================
-- SISGEDI 2.0 - SCRIPT DEFINITIVO SIN RLS (PARA DESARROLLO)
-- ============================================================================
-- Este script NO incluye RLS para facilitar el desarrollo
-- Usar SCRIPT_ACTIVAR_RLS.sql cuando esté listo para producción
-- ============================================================================

-- ============================================================================
-- PARTE 1: LIMPIEZA TOTAL
-- ============================================================================

SET session_replication_role = 'replica';

-- Eliminar políticas RLS existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                       r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Desactivar RLS en todas las tablas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Eliminar objetos existentes
DROP MATERIALIZED VIEW IF EXISTS mv_reporte_documentos CASCADE;
DROP VIEW IF EXISTS v_documentos_activos CASCADE;
DROP VIEW IF EXISTS v_salud_sistema CASCADE;

DROP FUNCTION IF EXISTS search_documentos CASCADE;
DROP FUNCTION IF EXISTS search_documentos_avanzada CASCADE;
DROP FUNCTION IF EXISTS generar_folio_interno CASCADE;
DROP FUNCTION IF EXISTS generar_folio_saliente CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha_actualizacion CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha CASCADE;
DROP FUNCTION IF EXISTS actualizar_ts_contenido_ocr CASCADE;
DROP FUNCTION IF EXISTS fn_bloquear_avance_100 CASCADE;
DROP FUNCTION IF EXISTS fn_bloquear_documento_firmado CASCADE;
DROP FUNCTION IF EXISTS obtener_indicadores_dashboard CASCADE;
DROP FUNCTION IF EXISTS obtener_historial_documento CASCADE;

DROP TABLE IF EXISTS tbl_log_auditoria CASCADE;
DROP TABLE IF EXISTS tbl_notificaciones CASCADE;
DROP TABLE IF EXISTS tbl_inventario CASCADE;
DROP TABLE IF EXISTS tbl_relacion_respuesta CASCADE;
DROP TABLE IF EXISTS tbl_documento_saliente CASCADE;
DROP TABLE IF EXISTS tbl_avance CASCADE;
DROP TABLE IF EXISTS tbl_turnado CASCADE;
DROP TABLE IF EXISTS tbl_anexos CASCADE;
DROP TABLE IF EXISTS tbl_documento_entrante CASCADE;
DROP TABLE IF EXISTS tbl_firmas CASCADE;
DROP TABLE IF EXISTS tbl_sesiones CASCADE;
DROP TABLE IF EXISTS tbl_usuarios CASCADE;
DROP TABLE IF EXISTS cat_valores_catalogo CASCADE;
DROP TABLE IF EXISTS cat_roles CASCADE;
DROP TABLE IF EXISTS cat_unidad_administrativa CASCADE;

DROP SEQUENCE IF EXISTS seq_folio_entrante_2025 CASCADE;
DROP SEQUENCE IF EXISTS seq_folio_saliente_2025 CASCADE;
DROP TEXT SEARCH CONFIGURATION IF EXISTS spanish_unaccent CASCADE;

SET session_replication_role = 'origin';

-- ============================================================================
-- PARTE 2: EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, spanish_stem;

CREATE SEQUENCE IF NOT EXISTS seq_folio_entrante_2025 START 1;
CREATE SEQUENCE IF NOT EXISTS seq_folio_saliente_2025 START 1;

-- ============================================================================
-- PARTE 3: TABLAS DE CATÁLOGOS
-- ============================================================================

CREATE TABLE cat_unidad_administrativa (
    id_ua UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_ua VARCHAR(150) NOT NULL UNIQUE,
    codigo_ua VARCHAR(20) UNIQUE,
    nivel_jerarquico INT NOT NULL CHECK (nivel_jerarquico BETWEEN 1 AND 4),
    id_ua_superior UUID REFERENCES cat_unidad_administrativa(id_ua),
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    extension VARCHAR(10)
);

CREATE INDEX idx_ua_nivel ON cat_unidad_administrativa(nivel_jerarquico);
CREATE INDEX idx_ua_superior ON cat_unidad_administrativa(id_ua_superior);

CREATE TABLE cat_roles (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    elementos_menu JSONB NOT NULL DEFAULT '[]'::jsonb,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cat_valores_catalogo (
    id_valor_catalogo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_catalogo VARCHAR(50) NOT NULL,
    valor VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden_presentacion INT DEFAULT 0,
    es_modificable BOOLEAN DEFAULT TRUE,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tipo_catalogo, valor)
);

CREATE INDEX idx_catalogo_tipo ON cat_valores_catalogo(tipo_catalogo);

-- ============================================================================
-- PARTE 4: TABLAS DE USUARIOS Y SEGURIDAD
-- ============================================================================

CREATE TABLE tbl_usuarios (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clave_servidor_publico VARCHAR(50) NOT NULL UNIQUE,
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_rol UUID REFERENCES cat_roles(id_rol) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    intentos_fallidos INT DEFAULT 0,
    fecha_bloqueo TIMESTAMPTZ,
    estatus VARCHAR(20) DEFAULT 'Activo' CHECK (estatus IN ('Activo', 'Inhabilitado', 'Suspendido', 'Eliminado')),
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    ultima_sesion TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_usuario_ua ON tbl_usuarios(id_ua);
CREATE INDEX idx_usuario_rol ON tbl_usuarios(id_rol);
CREATE INDEX idx_usuario_clave ON tbl_usuarios(clave_servidor_publico);

ALTER TABLE tbl_usuarios
ADD CONSTRAINT chk_correo_formato
CHECK (correo_institucional ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

CREATE TABLE tbl_sesiones (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    token_sesion TEXT NOT NULL,
    fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
    fecha_ultima_actividad TIMESTAMPTZ DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    ip_origen INET,
    user_agent TEXT,
    estatus_sesion VARCHAR(20) DEFAULT 'Activa' CHECK (
        estatus_sesion IN ('Activa', 'Expirada', 'Cerrada_Usuario', 'Cerrada_Sistema')
    )
);

CREATE INDEX idx_sesion_usuario ON tbl_sesiones(id_usuario);

CREATE TABLE tbl_firmas (
    id_firma UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    tipo_firma VARCHAR(20) NOT NULL CHECK (tipo_firma IN ('Recepcion', 'Emision')),
    hash_documento TEXT NOT NULL,
    firma_digital TEXT NOT NULL,
    algoritmo_hash VARCHAR(20) DEFAULT 'SHA-256',
    certificado_thumbprint TEXT,
    certificado_serie VARCHAR(100),
    fecha_firma TIMESTAMPTZ DEFAULT NOW(),
    ip_origen INET,
    metadatos JSONB,
    es_valida BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_firma_usuario ON tbl_firmas(id_usuario);
CREATE INDEX idx_firma_tipo ON tbl_firmas(tipo_firma);

-- ============================================================================
-- PARTE 5: TABLAS DE DOCUMENTOS ENTRANTES
-- ============================================================================

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
    id_area_remitente UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    remitente_nombre VARCHAR(200),
    remitente_cargo VARCHAR(150),
    remitente_institucion VARCHAR(200),
    marca_seguimiento VARCHAR(20) NOT NULL DEFAULT 'Turnarse' CHECK (
        marca_seguimiento IN ('Turnarse', 'Archivo', 'Conocimiento')
    ),
    estatus_general VARCHAR(20) DEFAULT 'Pendiente' CHECK (
        estatus_general IN ('Pendiente', 'En_Proceso', 'Concluido', 'Archivado')
    ),
    fecha_conclusion TIMESTAMPTZ,
    contenido_ocr TEXT,
    metadatos_ocr JSONB,
    confianza_ocr NUMERIC(3, 2),
    ts_contenido_ocr TSVECTOR,
    eliminado BOOLEAN DEFAULT FALSE,
    fecha_eliminacion TIMESTAMPTZ,
    eliminado_por UUID REFERENCES tbl_usuarios(id_usuario),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_doc_entrante_ua ON tbl_documento_entrante(id_ua_registro);
CREATE INDEX idx_doc_entrante_fecha ON tbl_documento_entrante(fecha_registro DESC);
CREATE INDEX idx_doc_entrante_folio ON tbl_documento_entrante(folio_interno);
CREATE INDEX idx_doc_entrante_estatus ON tbl_documento_entrante(estatus_general);
CREATE INDEX idx_doc_entrante_fts ON tbl_documento_entrante USING GIN(ts_contenido_ocr);

CREATE TABLE tbl_anexos (
    id_anexo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    bucket_name VARCHAR(100) DEFAULT 'documentos',
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    es_alcance BOOLEAN DEFAULT FALSE,
    fecha_alcance TIMESTAMPTZ,
    descripcion TEXT,
    fecha_carga TIMESTAMPTZ DEFAULT NOW(),
    cargado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_anexo_doc ON tbl_anexos(id_doc_entrante);

-- ============================================================================
-- PARTE 6: TABLAS DE TURNADO
-- ============================================================================

CREATE TABLE tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    id_ua_origen UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_turno UUID REFERENCES tbl_usuarios(id_usuario),
    id_ua_destino UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    fecha_turnado TIMESTAMPTZ DEFAULT NOW(),
    instruccion VARCHAR(500),
    observaciones TEXT,
    fecha_vencimiento TIMESTAMPTZ NOT NULL,
    dias_para_atencion INT,
    porcentaje_avance NUMERIC(3, 0) DEFAULT 0 CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
    fecha_ultimo_avance TIMESTAMPTZ,
    estatus_turnado VARCHAR(20) DEFAULT 'Turnado' CHECK (
        estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso', 'Concluido', 'Rechazado')
    ),
    id_firma_recepcion UUID REFERENCES tbl_firmas(id_firma),
    fecha_firma_recepcion TIMESTAMPTZ,
    hash_recepcion TEXT,
    motivo_rechazo TEXT,
    fecha_rechazo TIMESTAMPTZ,
    rechazado_por UUID REFERENCES tbl_usuarios(id_usuario),
    ua_sugerida_ia UUID REFERENCES cat_unidad_administrativa(id_ua),
    confianza_ia NUMERIC(3, 2),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turnado_doc ON tbl_turnado(id_doc_entrante);
CREATE INDEX idx_turnado_ua_origen ON tbl_turnado(id_ua_origen);
CREATE INDEX idx_turnado_ua_destino ON tbl_turnado(id_ua_destino);
CREATE INDEX idx_turnado_vencimiento ON tbl_turnado(fecha_vencimiento);
CREATE INDEX idx_turnado_estatus ON tbl_turnado(estatus_turnado);

CREATE TABLE tbl_avance (
    id_avance UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_turnado UUID REFERENCES tbl_turnado(id_turnado) ON DELETE CASCADE,
    porcentaje_anterior NUMERIC(3, 0),
    porcentaje_nuevo NUMERIC(3, 0) NOT NULL,
    comentario TEXT,
    fecha_avance TIMESTAMPTZ DEFAULT NOW(),
    registrado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_avance_turnado ON tbl_avance(id_turnado);

-- ============================================================================
-- PARTE 7: TABLAS DE DOCUMENTOS SALIENTES
-- ============================================================================

CREATE TABLE tbl_documento_saliente (
    id_doc_saliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_doc VARCHAR(50) NOT NULL CHECK (
        tipo_doc IN ('Oficio', 'Nota_Informativa', 'Circular', 'Memorandum')
    ),
    numero_folio VARCHAR(100) UNIQUE NOT NULL,
    ejercicio_fiscal INT NOT NULL,
    asunto TEXT NOT NULL,
    destinatario_nombre VARCHAR(200),
    destinatario_cargo VARCHAR(150),
    destinatario_institucion VARCHAR(200),
    contenido TEXT,
    id_ua_emisora UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_elabora UUID REFERENCES tbl_usuarios(id_usuario),
    fecha_elaboracion TIMESTAMPTZ DEFAULT NOW(),
    estatus_saliente VARCHAR(20) DEFAULT 'Borrador' CHECK (
        estatus_saliente IN ('Borrador', 'Firmado', 'Enviado', 'Cancelado', 'Reactivado')
    ),
    fecha_envio TIMESTAMPTZ,
    id_firma_emision UUID REFERENCES tbl_firmas(id_firma),
    fecha_firma_emision TIMESTAMPTZ,
    hash_documento TEXT,
    tiene_acuse BOOLEAN DEFAULT FALSE,
    storage_path_acuse TEXT,
    fecha_acuse TIMESTAMPTZ,
    fue_reactivado BOOLEAN DEFAULT FALSE,
    fecha_reactivacion TIMESTAMPTZ,
    motivo_reactivacion TEXT,
    storage_path TEXT,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    actualizado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_doc_saliente_ua ON tbl_documento_saliente(id_ua_emisora);
CREATE INDEX idx_doc_saliente_folio ON tbl_documento_saliente(numero_folio);
CREATE INDEX idx_doc_saliente_tipo ON tbl_documento_saliente(tipo_doc);
CREATE INDEX idx_doc_saliente_estatus ON tbl_documento_saliente(estatus_saliente);

CREATE TABLE tbl_relacion_respuesta (
    id_relacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_saliente UUID REFERENCES tbl_documento_saliente(id_doc_saliente) ON DELETE CASCADE,
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    tipo_relacion VARCHAR(50) DEFAULT 'Respuesta' CHECK (
        tipo_relacion IN ('Respuesta', 'Seguimiento', 'Complemento')
    ),
    fecha_relacion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_doc_saliente, id_doc_entrante)
);

CREATE INDEX idx_relacion_saliente ON tbl_relacion_respuesta(id_doc_saliente);
CREATE INDEX idx_relacion_entrante ON tbl_relacion_respuesta(id_doc_entrante);

-- ============================================================================
-- PARTE 8: TABLAS DE NOTIFICACIONES, INVENTARIO Y AUDITORÍA
-- ============================================================================

CREATE TABLE tbl_notificaciones (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    tipo_notificacion VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante),
    id_turnado UUID REFERENCES tbl_turnado(id_turnado),
    leida BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMPTZ,
    enviada_email BOOLEAN DEFAULT FALSE,
    fecha_envio_email TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON tbl_notificaciones(id_usuario);
CREATE INDEX idx_notif_no_leida ON tbl_notificaciones(id_usuario, leida) WHERE leida = FALSE;

CREATE TABLE tbl_inventario (
    id_inventario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad >= 0),
    unidad VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('Bueno', 'Regular', 'Malo', 'Baja')),
    ubicacion TEXT NOT NULL,
    responsable VARCHAR(200) NOT NULL,
    numero_inventario VARCHAR(50) UNIQUE NOT NULL,
    fecha_adquisicion DATE NOT NULL,
    valor_unitario NUMERIC(12,2) NOT NULL CHECK (valor_unitario >= 0),
    valor_total NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
    proveedor VARCHAR(200),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    serie VARCHAR(50),
    imagen_storage_path TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventario_ua ON tbl_inventario(id_ua);
CREATE INDEX idx_inventario_categoria ON tbl_inventario(categoria);

CREATE TABLE tbl_log_auditoria (
    id_log BIGSERIAL PRIMARY KEY,
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),
    ip_origen INET,
    user_agent TEXT,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tabla_afectada VARCHAR(100),
    id_registro_afectado UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auditoria_usuario ON tbl_log_auditoria(id_usuario);
CREATE INDEX idx_auditoria_fecha ON tbl_log_auditoria(fecha_hora DESC);

-- ============================================================================
-- PARTE 9: FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función: Actualizar FTS
CREATE OR REPLACE FUNCTION actualizar_ts_contenido_ocr()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ts_contenido_ocr := to_tsvector('spanish_unaccent',
        COALESCE(NEW.contenido_ocr, '') || ' ' ||
        COALESCE(NEW.asunto, '') || ' ' ||
        COALESCE(NEW.remitente_nombre, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_ts_ocr
    BEFORE INSERT OR UPDATE OF contenido_ocr, asunto, remitente_nombre
    ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_ts_contenido_ocr();

-- Función: Generar Folio Interno
CREATE OR REPLACE FUNCTION generar_folio_interno()
RETURNS TRIGGER AS $$
DECLARE
    v_contador INT;
    v_anio INT;
    v_seq_name TEXT;
BEGIN
    v_anio := EXTRACT(YEAR FROM NEW.fecha_registro);
    v_seq_name := 'seq_folio_entrante_' || v_anio;

    BEGIN
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', v_seq_name);
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    EXECUTE format('SELECT nextval(%L)', v_seq_name) INTO v_contador;
    NEW.folio_interno := 'ENT-' || v_anio || '-' || LPAD(v_contador::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_folio_interno
    BEFORE INSERT ON tbl_documento_entrante
    FOR EACH ROW
    WHEN (NEW.folio_interno IS NULL)
    EXECUTE FUNCTION generar_folio_interno();

-- Función: Generar Folio Saliente
CREATE OR REPLACE FUNCTION generar_folio_saliente()
RETURNS TRIGGER AS $$
DECLARE
    v_contador INT;
    v_anio INT;
    v_seq_name TEXT;
    v_prefijo TEXT;
BEGIN
    v_anio := NEW.ejercicio_fiscal;
    v_seq_name := 'seq_folio_saliente_' || v_anio;

    BEGIN
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', v_seq_name);
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    EXECUTE format('SELECT nextval(%L)', v_seq_name) INTO v_contador;

    v_prefijo := CASE NEW.tipo_doc
        WHEN 'Oficio' THEN 'OF'
        WHEN 'Nota_Informativa' THEN 'NI'
        WHEN 'Circular' THEN 'CIR'
        WHEN 'Memorandum' THEN 'MEM'
        ELSE 'DOC'
    END;

    NEW.numero_folio := v_prefijo || '-' || v_anio || '-' || LPAD(v_contador::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_folio_saliente
    BEFORE INSERT ON tbl_documento_saliente
    FOR EACH ROW
    WHEN (NEW.numero_folio IS NULL OR NEW.numero_folio = '')
    EXECUTE FUNCTION generar_folio_saliente();

-- Función: Actualizar fecha
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_doc_entrante
    BEFORE UPDATE ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trg_update_doc_saliente
    BEFORE UPDATE ON tbl_documento_saliente
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trg_update_turnado
    BEFORE UPDATE ON tbl_turnado
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trg_update_inventario
    BEFORE UPDATE ON tbl_inventario
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Función: Bloquear avance 100%
CREATE OR REPLACE FUNCTION fn_bloquear_avance_100()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.porcentaje_avance = 100 AND NEW.porcentaje_avance != OLD.porcentaje_avance THEN
        RAISE EXCEPTION 'No se puede modificar un documento con avance del 100%%';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bloquear_avance_100
    BEFORE UPDATE ON tbl_turnado
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloquear_avance_100();

-- Función: Búsqueda FTS
CREATE OR REPLACE FUNCTION search_documentos(
    p_query TEXT,
    p_id_ua UUID DEFAULT NULL,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    id_doc_entrante UUID,
    folio_interno VARCHAR,
    asunto TEXT,
    remitente_nombre VARCHAR,
    fecha_registro TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id_doc_entrante,
        d.folio_interno,
        d.asunto,
        d.remitente_nombre,
        d.fecha_registro,
        ts_rank(d.ts_contenido_ocr, websearch_to_tsquery('spanish_unaccent', p_query)) AS rank
    FROM tbl_documento_entrante d
    WHERE
        d.eliminado = FALSE
        AND d.ts_contenido_ocr @@ websearch_to_tsquery('spanish_unaccent', p_query)
        AND (p_id_ua IS NULL OR d.id_ua_registro = p_id_ua)
    ORDER BY rank DESC, d.fecha_registro DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Dashboard
CREATE OR REPLACE FUNCTION obtener_indicadores_dashboard(p_id_ua UUID)
RETURNS TABLE (
    total_documentos BIGINT,
    verdes BIGINT,
    amarillos BIGINT,
    rojos BIGINT,
    promedio_avance NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_documentos,
        COUNT(*) FILTER (WHERE t.fecha_vencimiento > NOW() + INTERVAL '3 days') as verdes,
        COUNT(*) FILTER (WHERE t.fecha_vencimiento BETWEEN NOW() AND NOW() + INTERVAL '3 days') as amarillos,
        COUNT(*) FILTER (WHERE t.fecha_vencimiento < NOW()) as rojos,
        AVG(t.porcentaje_avance) as promedio_avance
    FROM tbl_turnado t
    JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
    WHERE t.id_ua_destino = p_id_ua
      AND t.estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso')
      AND t.porcentaje_avance < 100
      AND de.eliminado = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 10: DATOS INICIALES
-- ============================================================================

-- Roles
INSERT INTO cat_roles (nombre_rol, descripcion, elementos_menu) VALUES
('Administrador General', 'Acceso completo al sistema', '{"modulos":["admin","doc_entrante","seguimiento","doc_saliente","dashboard","consultas","auditoria","inventario"],"acciones":["crear","editar","eliminar","turnar","firmar","rechazar","concluir","exportar"]}'::jsonb),
('Administrador UA', 'Administrador de Unidad Administrativa', '{"modulos":["admin_usuarios","doc_entrante","seguimiento","doc_saliente","dashboard","consultas","inventario"],"acciones":["crear","editar","turnar","firmar","rechazar","concluir"]}'::jsonb),
('Recepción', 'Captura de documentos entrantes', '{"modulos":["doc_entrante","consultas"],"acciones":["crear","editar","turnar"]}'::jsonb),
('Nivel 1', 'Turnado y firma', '{"modulos":["seguimiento","doc_saliente","consultas"],"acciones":["turnar","firmar","avance","elaborar"]}'::jsonb),
('Nivel 2', 'Firma y avance', '{"modulos":["seguimiento","doc_saliente","consultas"],"acciones":["firmar","avance","elaborar"]}'::jsonb),
('Nivel 3', 'Avance y conclusión', '{"modulos":["seguimiento","consultas"],"acciones":["avance","concluir"]}'::jsonb),
('Visor', 'Solo consulta', '{"modulos":["consultas"],"acciones":["ver","exportar"]}'::jsonb)
ON CONFLICT (nombre_rol) DO UPDATE SET elementos_menu = EXCLUDED.elementos_menu;

-- Catálogos
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, descripcion, es_modificable) VALUES
('Prioridad', 'Normal', 'Prioridad normal', FALSE),
('Prioridad', 'Urgente', 'Atención inmediata', FALSE),
('Tipo_Documento', 'Oficio', 'Documento oficial', FALSE),
('Tipo_Documento', 'Circular', 'Comunicado general', FALSE),
('Tipo_Documento', 'Memorándum', 'Comunicación interna', FALSE),
('Tipo_Documento', 'Nota Informativa', 'Documento informativo', FALSE),
('Area_Remitente', 'Secretaría de Hacienda', 'SHCP', TRUE),
('Area_Remitente', 'Secretaría de Economía', 'SE', TRUE),
('Area_Remitente', 'Sector Privado', 'Empresas', TRUE),
('Area_Remitente', 'Ciudadano', 'Personas físicas', TRUE)
ON CONFLICT (tipo_catalogo, valor) DO NOTHING;

-- Unidades Administrativas
DO $$
DECLARE
    v_ss1 UUID;
    v_dg1 UUID;
BEGIN
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, direccion, telefono)
    VALUES ('Subsecretaría de Gestión Documental', 'SS-001', 1, 'Av. Insurgentes Sur 1234', '55-1234-5678')
    ON CONFLICT (codigo_ua) DO UPDATE SET nombre_ua = EXCLUDED.nombre_ua
    RETURNING id_ua INTO v_ss1;

    IF v_ss1 IS NULL THEN
        SELECT id_ua INTO v_ss1 FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001';
    END IF;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion)
    VALUES ('Dirección General de Tecnologías', 'DG-001', 2, v_ss1, 'Eje Central 100')
    ON CONFLICT (codigo_ua) DO UPDATE SET nombre_ua = EXCLUDED.nombre_ua
    RETURNING id_ua INTO v_dg1;

    IF v_dg1 IS NULL THEN
        SELECT id_ua INTO v_dg1 FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-001';
    END IF;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior)
    VALUES
        ('Dirección de Sistemas', 'DIR-001', 3, v_dg1),
        ('Dirección de Infraestructura', 'DIR-002', 3, v_dg1)
    ON CONFLICT (codigo_ua) DO NOTHING;
END $$;

-- ============================================================================
-- PARTE 11: VISTAS
-- ============================================================================

CREATE OR REPLACE VIEW v_documentos_activos AS
SELECT
    de.*,
    ua.nombre_ua,
    ua.codigo_ua,
    p.valor as prioridad,
    td.valor as tipo_documento
FROM tbl_documento_entrante de
JOIN cat_unidad_administrativa ua ON de.id_ua_registro = ua.id_ua
LEFT JOIN cat_valores_catalogo p ON de.id_prioridad = p.id_valor_catalogo
LEFT JOIN cat_valores_catalogo td ON de.id_tipo_doc = td.id_valor_catalogo
WHERE de.eliminado = FALSE;

CREATE OR REPLACE VIEW v_salud_sistema AS
SELECT
    (SELECT COUNT(*) FROM tbl_usuarios WHERE estatus = 'Activo') as usuarios_activos,
    (SELECT COUNT(*) FROM tbl_documento_entrante WHERE fecha_registro > NOW() - INTERVAL '24 hours' AND eliminado = FALSE) as docs_ultimas_24h,
    (SELECT COUNT(*) FROM tbl_turnado WHERE fecha_vencimiento < NOW() AND estatus_turnado != 'Concluido') as documentos_vencidos,
    NOW() as fecha_consulta;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT '✅ SCRIPT SIN RLS EJECUTADO EXITOSAMENTE' as estado, NOW() as fecha;

SELECT 'RESUMEN' as info, COUNT(*) as cantidad FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL SELECT 'Roles', COUNT(*) FROM cat_roles
UNION ALL SELECT 'UAs', COUNT(*) FROM cat_unidad_administrativa
UNION ALL SELECT 'Catálogos', COUNT(*) FROM cat_valores_catalogo;

-- ============================================================================
-- NOTA: RLS DESACTIVADO
-- ============================================================================
-- Este script NO incluye Row Level Security
-- Para activar RLS en producción, ejecutar: SCRIPT_ACTIVAR_RLS.sql
-- ============================================================================
