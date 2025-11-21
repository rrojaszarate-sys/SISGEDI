-- ============================================================================
-- SISGEDI 2.0 - SCRIPT DEFINITIVO COMPLETO
-- ============================================================================
-- ADVERTENCIA: Este script ELIMINA todo y recrea desde cero
-- Ejecutar en SQL Editor de Supabase
-- Tiempo estimado: 1-2 minutos
-- ============================================================================

-- ============================================================================
-- PARTE 1: LIMPIEZA TOTAL (ELIMINAR TODO)
-- ============================================================================

-- Desactivar triggers temporalmente
SET session_replication_role = 'replica';

-- Eliminar todas las políticas RLS
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

-- Eliminar vistas materializadas
DROP MATERIALIZED VIEW IF EXISTS mv_reporte_documentos CASCADE;

-- Eliminar vistas
DROP VIEW IF EXISTS v_documentos_activos CASCADE;
DROP VIEW IF EXISTS v_salud_sistema CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS search_documentos CASCADE;
DROP FUNCTION IF EXISTS search_documentos_avanzada CASCADE;
DROP FUNCTION IF EXISTS generar_folio_interno CASCADE;
DROP FUNCTION IF EXISTS generar_folio_interno_mejorado CASCADE;
DROP FUNCTION IF EXISTS generar_folio_saliente CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha_actualizacion CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha CASCADE;
DROP FUNCTION IF EXISTS actualizar_ts_contenido_ocr CASCADE;
DROP FUNCTION IF EXISTS fn_bloquear_avance_100 CASCADE;
DROP FUNCTION IF EXISTS fn_bloquear_documento_firmado CASCADE;
DROP FUNCTION IF EXISTS fn_registrar_auditoria CASCADE;
DROP FUNCTION IF EXISTS fn_crear_notificacion_vencimiento CASCADE;
DROP FUNCTION IF EXISTS obtener_indicadores_dashboard CASCADE;
DROP FUNCTION IF EXISTS obtener_historial_documento CASCADE;
DROP FUNCTION IF EXISTS obtener_estadisticas_ua CASCADE;
DROP FUNCTION IF EXISTS refrescar_reporte_documentos CASCADE;

-- Eliminar tablas (orden inverso por dependencias)
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

-- Eliminar secuencias
DROP SEQUENCE IF EXISTS seq_folio_entrante_2025 CASCADE;
DROP SEQUENCE IF EXISTS seq_folio_saliente_2025 CASCADE;

-- Eliminar configuración FTS
DROP TEXT SEARCH CONFIGURATION IF EXISTS spanish_unaccent CASCADE;

-- Reactivar triggers
SET session_replication_role = 'origin';

-- ============================================================================
-- PARTE 2: EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración Full-Text Search para español sin acentos
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, spanish_stem;

-- Secuencias para folios (evitar race conditions)
CREATE SEQUENCE IF NOT EXISTS seq_folio_entrante_2025 START 1;
CREATE SEQUENCE IF NOT EXISTS seq_folio_saliente_2025 START 1;

-- ============================================================================
-- PARTE 3: TABLAS DE CATÁLOGOS Y CONFIGURACIÓN
-- ============================================================================

-- Tabla: Unidades Administrativas
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
CREATE INDEX idx_ua_estatus ON cat_unidad_administrativa(estatus) WHERE estatus = TRUE;

COMMENT ON TABLE cat_unidad_administrativa IS 'Catálogo de Unidades Administrativas con jerarquía';
COMMENT ON COLUMN cat_unidad_administrativa.nivel_jerarquico IS '1=Subsecretaría, 2=Dir.General, 3=Dirección, 4=Jefatura';

-- Tabla: Roles del Sistema
CREATE TABLE cat_roles (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    elementos_menu JSONB NOT NULL DEFAULT '[]'::jsonb,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cat_roles IS 'Roles del sistema con permisos de menú';

-- Tabla: Catálogos Dinámicos
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
CREATE INDEX idx_catalogo_estatus ON cat_valores_catalogo(estatus) WHERE estatus = TRUE;

COMMENT ON TABLE cat_valores_catalogo IS 'Catálogos dinámicos: Prioridad, Tipo_Documento, Area_Remitente, etc.';

-- ============================================================================
-- PARTE 4: TABLAS DE USUARIOS Y SEGURIDAD
-- ============================================================================

-- Tabla: Usuarios del Sistema
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
CREATE INDEX idx_usuario_correo ON tbl_usuarios(correo_institucional);
CREATE INDEX idx_usuario_estatus ON tbl_usuarios(estatus) WHERE estatus = 'Activo';

-- Validar formato de correo
ALTER TABLE tbl_usuarios
ADD CONSTRAINT chk_correo_formato
CHECK (correo_institucional ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

COMMENT ON TABLE tbl_usuarios IS 'Usuarios del sistema vinculados a auth.users de Supabase';

-- Tabla: Sesiones de Usuario
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
CREATE INDEX idx_sesion_token ON tbl_sesiones(token_sesion);
CREATE INDEX idx_sesion_activa ON tbl_sesiones(estatus_sesion) WHERE estatus_sesion = 'Activa';

-- Tabla: Firmas Electrónicas
CREATE TABLE tbl_firmas (
    id_firma UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    tipo_firma VARCHAR(20) NOT NULL CHECK (tipo_firma IN ('Recepcion', 'Emision')),
    hash_documento TEXT NOT NULL,
    firma_digital TEXT NOT NULL,
    algoritmo_hash VARCHAR(20) DEFAULT 'SHA-256',
    certificado_thumbprint TEXT,
    certificado_serie VARCHAR(100),
    certificado_emisor VARCHAR(200),
    certificado_valido_desde DATE,
    certificado_valido_hasta DATE,
    fecha_firma TIMESTAMPTZ DEFAULT NOW(),
    ip_origen INET,
    user_agent TEXT,
    metadatos JSONB,
    es_valida BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_firma_usuario ON tbl_firmas(id_usuario);
CREATE INDEX idx_firma_tipo ON tbl_firmas(tipo_firma);
CREATE INDEX idx_firma_fecha ON tbl_firmas(fecha_firma DESC);
CREATE INDEX idx_firma_hash ON tbl_firmas(hash_documento);

COMMENT ON TABLE tbl_firmas IS 'Registro de firmas electrónicas para garantizar no repudio';

-- ============================================================================
-- PARTE 5: TABLAS DE DOCUMENTOS ENTRANTES
-- ============================================================================

-- Tabla Principal: Documentos Entrantes
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

-- Índices para rendimiento
CREATE INDEX idx_doc_entrante_ua ON tbl_documento_entrante(id_ua_registro);
CREATE INDEX idx_doc_entrante_fecha ON tbl_documento_entrante(fecha_registro DESC);
CREATE INDEX idx_doc_entrante_folio ON tbl_documento_entrante(folio_interno);
CREATE INDEX idx_doc_entrante_estatus ON tbl_documento_entrante(estatus_general)
    WHERE estatus_general != 'Concluido';
CREATE INDEX idx_doc_entrante_fts ON tbl_documento_entrante USING GIN(ts_contenido_ocr);
CREATE INDEX idx_doc_entrante_prioridad ON tbl_documento_entrante(id_prioridad);
CREATE INDEX idx_doc_entrante_activos ON tbl_documento_entrante(id_ua_registro, fecha_registro DESC)
    WHERE eliminado = FALSE;

-- Validar fechas lógicas
ALTER TABLE tbl_documento_entrante
ADD CONSTRAINT chk_fecha_documento_valida
CHECK (fecha_documento IS NULL OR fecha_documento <= fecha_registro::date);

COMMENT ON TABLE tbl_documento_entrante IS 'Documentos entrantes con capacidades de OCR y FTS';

-- Tabla: Anexos de Documentos
CREATE TABLE tbl_anexos (
    id_anexo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    bucket_name VARCHAR(100) DEFAULT 'documentos',
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    tamano_mb NUMERIC(10, 2) GENERATED ALWAYS AS (tamano_bytes::NUMERIC / 1048576) STORED,
    es_alcance BOOLEAN DEFAULT FALSE,
    fecha_alcance TIMESTAMPTZ,
    descripcion TEXT,
    fecha_carga TIMESTAMPTZ DEFAULT NOW(),
    cargado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_anexo_doc ON tbl_anexos(id_doc_entrante);
CREATE INDEX idx_anexo_alcance ON tbl_anexos(es_alcance) WHERE es_alcance = TRUE;

COMMENT ON TABLE tbl_anexos IS 'Archivos anexos a documentos (PDFs, imágenes, etc.)';

-- ============================================================================
-- PARTE 6: TABLAS DE TURNADO Y SEGUIMIENTO
-- ============================================================================

-- Tabla: Turnado de Documentos
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
CREATE INDEX idx_turnado_avance ON tbl_turnado(porcentaje_avance) WHERE porcentaje_avance < 100;
CREATE INDEX idx_turnado_pendientes ON tbl_turnado(id_ua_destino, estatus_turnado)
    WHERE estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso');

-- Validar vencimiento futuro
ALTER TABLE tbl_turnado
ADD CONSTRAINT chk_vencimiento_futuro
CHECK (fecha_vencimiento > fecha_turnado);

COMMENT ON TABLE tbl_turnado IS 'Registro de turnados entre UAs con firma electrónica';

-- Tabla: Historial de Avances
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
CREATE INDEX idx_avance_fecha ON tbl_avance(fecha_avance DESC);

COMMENT ON TABLE tbl_avance IS 'Historial de cambios en porcentaje de avance';

-- ============================================================================
-- PARTE 7: TABLAS DE DOCUMENTOS SALIENTES
-- ============================================================================

-- Tabla: Documentos Salientes
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
CREATE INDEX idx_doc_saliente_fecha ON tbl_documento_saliente(fecha_elaboracion DESC);

COMMENT ON TABLE tbl_documento_saliente IS 'Documentos salientes con firma electrónica de emisión';

-- Tabla: Relación entre Documento Saliente y Entrante
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

COMMENT ON TABLE tbl_relacion_respuesta IS 'Vincula documentos salientes como respuesta a entrantes';

-- ============================================================================
-- PARTE 8: TABLAS DE NOTIFICACIONES Y AUDITORÍA
-- ============================================================================

-- Tabla: Notificaciones
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
CREATE INDEX idx_notif_fecha ON tbl_notificaciones(fecha_creacion DESC);

COMMENT ON TABLE tbl_notificaciones IS 'Sistema de notificaciones para usuarios';

-- Tabla: Log de Auditoría
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
CREATE INDEX idx_auditoria_modulo ON tbl_log_auditoria(modulo);
CREATE INDEX idx_auditoria_accion ON tbl_log_auditoria(accion);

COMMENT ON TABLE tbl_log_auditoria IS 'Log completo de auditoría - retención 7 años';

-- ============================================================================
-- PARTE 9: TABLA DE INVENTARIO (MÓDULO ADICIONAL)
-- ============================================================================

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
CREATE INDEX idx_inventario_estado ON tbl_inventario(estado);
CREATE INDEX idx_inventario_numero ON tbl_inventario(numero_inventario);

COMMENT ON TABLE tbl_inventario IS 'Control de inventario por Unidad Administrativa';

-- ============================================================================
-- PARTE 10: FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función: Actualizar ts_contenido_ocr (para FTS)
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

-- Función: Generar Folio Interno (con secuencia)
CREATE OR REPLACE FUNCTION generar_folio_interno()
RETURNS TRIGGER AS $$
DECLARE
    v_contador INT;
    v_anio INT;
    v_seq_name TEXT;
BEGIN
    v_anio := EXTRACT(YEAR FROM NEW.fecha_registro);
    v_seq_name := 'seq_folio_entrante_' || v_anio;

    -- Crear secuencia si no existe
    BEGIN
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', v_seq_name);
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    -- Obtener siguiente valor
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

-- Función: Actualizar fecha de actualización
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

-- Función: Bloquear documentos con avance 100%
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

-- Función: Bloquear documentos firmados
CREATE OR REPLACE FUNCTION fn_bloquear_documento_firmado()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'tbl_turnado' THEN
        IF OLD.id_firma_recepcion IS NOT NULL AND NEW.id_firma_recepcion IS DISTINCT FROM OLD.id_firma_recepcion THEN
            RAISE EXCEPTION 'No se puede modificar un documento con firma electrónica de recepción';
        END IF;
    ELSIF TG_TABLE_NAME = 'tbl_documento_saliente' THEN
        IF OLD.id_firma_emision IS NOT NULL AND NEW.id_firma_emision IS DISTINCT FROM OLD.id_firma_emision THEN
            RAISE EXCEPTION 'No se puede modificar un documento firmado electrónicamente';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bloquear_turnado_firmado
    BEFORE UPDATE ON tbl_turnado
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloquear_documento_firmado();

CREATE TRIGGER trg_bloquear_doc_saliente_firmado
    BEFORE UPDATE ON tbl_documento_saliente
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloquear_documento_firmado();

-- ============================================================================
-- PARTE 11: FUNCIONES DE BÚSQUEDA Y DASHBOARD
-- ============================================================================

-- Función: Búsqueda Full-Text Search
CREATE OR REPLACE FUNCTION search_documentos(
    p_query TEXT,
    p_id_ua UUID DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id_doc_entrante UUID,
    numero_oficio_externo VARCHAR,
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
        d.numero_oficio_externo,
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
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Búsqueda Avanzada
CREATE OR REPLACE FUNCTION search_documentos_avanzada(
    p_query TEXT,
    p_id_ua UUID DEFAULT NULL,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL,
    p_estatus VARCHAR DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id_doc_entrante UUID,
    numero_oficio_externo VARCHAR,
    folio_interno VARCHAR,
    asunto TEXT,
    remitente_nombre VARCHAR,
    fecha_registro TIMESTAMPTZ,
    estatus_general VARCHAR,
    rank REAL,
    snippet TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id_doc_entrante,
        d.numero_oficio_externo,
        d.folio_interno,
        d.asunto,
        d.remitente_nombre,
        d.fecha_registro,
        d.estatus_general,
        ts_rank(d.ts_contenido_ocr, websearch_to_tsquery('spanish_unaccent', p_query)) AS rank,
        ts_headline('spanish_unaccent',
            COALESCE(d.contenido_ocr, d.asunto),
            websearch_to_tsquery('spanish_unaccent', p_query),
            'MaxWords=50, MinWords=25, ShortWord=3'
        ) AS snippet
    FROM tbl_documento_entrante d
    WHERE
        d.eliminado = FALSE
        AND d.ts_contenido_ocr @@ websearch_to_tsquery('spanish_unaccent', p_query)
        AND (p_id_ua IS NULL OR d.id_ua_registro = p_id_ua)
        AND (p_fecha_inicio IS NULL OR d.fecha_registro::date >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR d.fecha_registro::date <= p_fecha_fin)
        AND (p_estatus IS NULL OR d.estatus_general = p_estatus)
    ORDER BY rank DESC, d.fecha_registro DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Dashboard Indicadores Verde/Amarillo/Rojo
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

-- Función: Historial de Documento
CREATE OR REPLACE FUNCTION obtener_historial_documento(p_id_doc_entrante UUID)
RETURNS TABLE (
    fecha TIMESTAMPTZ,
    evento VARCHAR,
    usuario VARCHAR,
    ua_origen VARCHAR,
    ua_destino VARCHAR,
    detalles TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.fecha_turnado,
        'Turnado'::VARCHAR,
        u.nombre_completo,
        uao.nombre_ua,
        uad.nombre_ua,
        COALESCE(t.instruccion, 'Sin instrucciones')
    FROM tbl_turnado t
    JOIN tbl_usuarios u ON t.id_usuario_turno = u.id_usuario
    JOIN cat_unidad_administrativa uao ON t.id_ua_origen = uao.id_ua
    JOIN cat_unidad_administrativa uad ON t.id_ua_destino = uad.id_ua
    WHERE t.id_doc_entrante = p_id_doc_entrante

    UNION ALL

    SELECT
        a.fecha_avance,
        'Avance'::VARCHAR,
        u.nombre_completo,
        NULL::VARCHAR,
        NULL::VARCHAR,
        'Avance: ' || a.porcentaje_anterior || '% → ' || a.porcentaje_nuevo || '%. ' || COALESCE(a.comentario, '')
    FROM tbl_avance a
    JOIN tbl_usuarios u ON a.registrado_por = u.id_usuario
    JOIN tbl_turnado t ON a.id_turnado = t.id_turnado
    WHERE t.id_doc_entrante = p_id_doc_entrante

    ORDER BY fecha DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTE 12: ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en tablas críticas
ALTER TABLE tbl_documento_entrante ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_inventario ENABLE ROW LEVEL SECURITY;

-- Políticas para tbl_documento_entrante
CREATE POLICY "doc_entrante_select_ua"
    ON tbl_documento_entrante FOR SELECT
    USING (
        eliminado = FALSE AND (
            id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
            OR EXISTS (
                SELECT 1 FROM tbl_usuarios u
                JOIN cat_roles r ON u.id_rol = r.id_rol
                WHERE u.id_usuario = auth.uid()
                AND r.nombre_rol = 'Administrador General'
            )
        )
    );

CREATE POLICY "doc_entrante_insert"
    ON tbl_documento_entrante FOR INSERT
    WITH CHECK (
        id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

CREATE POLICY "doc_entrante_update"
    ON tbl_documento_entrante FOR UPDATE
    USING (
        id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Políticas para tbl_turnado
CREATE POLICY "turnado_select"
    ON tbl_turnado FOR SELECT
    USING (
        id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

CREATE POLICY "turnado_insert"
    ON tbl_turnado FOR INSERT
    WITH CHECK (
        id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

CREATE POLICY "turnado_update"
    ON tbl_turnado FOR UPDATE
    USING (
        id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Políticas para tbl_documento_saliente
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

CREATE POLICY "doc_saliente_insert"
    ON tbl_documento_saliente FOR INSERT
    WITH CHECK (
        id_ua_emisora IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

CREATE POLICY "doc_saliente_update"
    ON tbl_documento_saliente FOR UPDATE
    USING (
        id_ua_emisora IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Políticas para tbl_usuarios
CREATE POLICY "usuarios_select_admin_general"
    ON tbl_usuarios FOR SELECT
    USING (
        id_usuario = auth.uid()
        OR id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol IN ('Administrador General', 'Administrador UA')
        )
    );

-- Políticas para tbl_notificaciones
CREATE POLICY "notificaciones_select"
    ON tbl_notificaciones FOR SELECT
    USING (id_usuario = auth.uid());

CREATE POLICY "notificaciones_update"
    ON tbl_notificaciones FOR UPDATE
    USING (id_usuario = auth.uid());

-- Políticas para tbl_inventario
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

CREATE POLICY "inventario_insert"
    ON tbl_inventario FOR INSERT
    WITH CHECK (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

CREATE POLICY "inventario_update"
    ON tbl_inventario FOR UPDATE
    USING (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- ============================================================================
-- PARTE 13: DATOS INICIALES
-- ============================================================================

-- Roles del sistema
INSERT INTO cat_roles (nombre_rol, descripcion, elementos_menu) VALUES
('Administrador General', 'Acceso completo al sistema', '{
    "modulos": ["admin", "doc_entrante", "seguimiento", "doc_saliente", "dashboard", "consultas", "auditoria", "inventario"],
    "acciones": ["crear", "editar", "eliminar", "turnar", "firmar", "rechazar", "concluir", "exportar"]
}'::jsonb),
('Administrador UA', 'Administrador de Unidad Administrativa', '{
    "modulos": ["admin_usuarios", "doc_entrante", "seguimiento", "doc_saliente", "dashboard", "consultas", "inventario"],
    "acciones": ["crear", "editar", "turnar", "firmar", "rechazar", "concluir"]
}'::jsonb),
('Recepción', 'Captura de documentos entrantes', '{
    "modulos": ["doc_entrante", "consultas"],
    "acciones": ["crear", "editar", "turnar"]
}'::jsonb),
('Nivel 1', 'Turnado y firma', '{
    "modulos": ["seguimiento", "doc_saliente", "consultas"],
    "acciones": ["turnar", "firmar", "avance", "elaborar"]
}'::jsonb),
('Nivel 2', 'Firma y avance', '{
    "modulos": ["seguimiento", "doc_saliente", "consultas"],
    "acciones": ["firmar", "avance", "elaborar"]
}'::jsonb),
('Nivel 3', 'Avance y conclusión', '{
    "modulos": ["seguimiento", "consultas"],
    "acciones": ["avance", "concluir"]
}'::jsonb),
('Visor', 'Solo consulta', '{
    "modulos": ["consultas"],
    "acciones": ["ver", "exportar"]
}'::jsonb)
ON CONFLICT (nombre_rol) DO UPDATE SET
    descripcion = EXCLUDED.descripcion,
    elementos_menu = EXCLUDED.elementos_menu;

-- Catálogos base
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, descripcion, es_modificable, orden_presentacion) VALUES
-- Prioridades
('Prioridad', 'Normal', 'Prioridad normal de atención', FALSE, 1),
('Prioridad', 'Urgente', 'Requiere atención inmediata', FALSE, 2),
-- Tipos de Documento
('Tipo_Documento', 'Oficio', 'Documento oficial entre dependencias', FALSE, 1),
('Tipo_Documento', 'Circular', 'Comunicado de aplicación general', FALSE, 2),
('Tipo_Documento', 'Memorándum', 'Comunicación interna breve', FALSE, 3),
('Tipo_Documento', 'Nota Informativa', 'Documento informativo', FALSE, 4),
-- Áreas Remitentes (ejemplos)
('Area_Remitente', 'Secretaría de Hacienda', 'SHCP', TRUE, 1),
('Area_Remitente', 'Secretaría de Economía', 'SE', TRUE, 2),
('Area_Remitente', 'Secretaría de Gobernación', 'SEGOB', TRUE, 3),
('Area_Remitente', 'Sector Privado', 'Empresas y particulares', TRUE, 4),
('Area_Remitente', 'Ciudadano', 'Personas físicas', TRUE, 5)
ON CONFLICT (tipo_catalogo, valor) DO NOTHING;

-- Unidades Administrativas de ejemplo
DO $$
DECLARE
    v_ss1 UUID;
    v_ss2 UUID;
    v_dg1 UUID;
    v_dg2 UUID;
BEGIN
    -- Nivel 1: Subsecretarías
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, direccion, telefono)
    VALUES ('Subsecretaría de Gestión Documental', 'SS-001', 1, 'Av. Insurgentes Sur 1234, CDMX', '55-1234-5678')
    ON CONFLICT (codigo_ua) DO UPDATE SET nombre_ua = EXCLUDED.nombre_ua
    RETURNING id_ua INTO v_ss1;

    IF v_ss1 IS NULL THEN
        SELECT id_ua INTO v_ss1 FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001';
    END IF;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, direccion, telefono)
    VALUES ('Coordinación General de Administración', 'SS-002', 1, 'Paseo de la Reforma 567, CDMX', '55-2345-6789')
    ON CONFLICT (codigo_ua) DO UPDATE SET nombre_ua = EXCLUDED.nombre_ua
    RETURNING id_ua INTO v_ss2;

    IF v_ss2 IS NULL THEN
        SELECT id_ua INTO v_ss2 FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-002';
    END IF;

    -- Nivel 2: Direcciones Generales
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion)
    VALUES ('Dirección General de Tecnologías', 'DG-001', 2, v_ss1, 'Eje Central 100, CDMX')
    ON CONFLICT (codigo_ua) DO UPDATE SET nombre_ua = EXCLUDED.nombre_ua
    RETURNING id_ua INTO v_dg1;

    IF v_dg1 IS NULL THEN
        SELECT id_ua INTO v_dg1 FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-001';
    END IF;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion)
    VALUES ('Dirección General de Recursos Humanos', 'DG-002', 2, v_ss2, 'Reforma 890, CDMX')
    ON CONFLICT (codigo_ua) DO UPDATE SET nombre_ua = EXCLUDED.nombre_ua
    RETURNING id_ua INTO v_dg2;

    IF v_dg2 IS NULL THEN
        SELECT id_ua INTO v_dg2 FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-002';
    END IF;

    -- Nivel 3: Direcciones
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior)
    VALUES
        ('Dirección de Sistemas', 'DIR-001', 3, v_dg1),
        ('Dirección de Infraestructura', 'DIR-002', 3, v_dg1),
        ('Dirección de Nóminas', 'DIR-003', 3, v_dg2),
        ('Dirección de Capacitación', 'DIR-004', 3, v_dg2)
    ON CONFLICT (codigo_ua) DO NOTHING;

    -- Nivel 4: Jefaturas de Departamento
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior)
    SELECT 'Jefatura de Desarrollo', 'JEF-001', 4, id_ua
    FROM cat_unidad_administrativa WHERE codigo_ua = 'DIR-001'
    ON CONFLICT (codigo_ua) DO NOTHING;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior)
    SELECT 'Jefatura de Soporte', 'JEF-002', 4, id_ua
    FROM cat_unidad_administrativa WHERE codigo_ua = 'DIR-001'
    ON CONFLICT (codigo_ua) DO NOTHING;
END $$;

-- ============================================================================
-- PARTE 14: VISTAS ÚTILES
-- ============================================================================

-- Vista: Documentos activos (no eliminados)
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

-- Vista: Salud del sistema
CREATE OR REPLACE VIEW v_salud_sistema AS
SELECT
    (SELECT COUNT(*) FROM tbl_usuarios WHERE estatus = 'Activo') as usuarios_activos,
    (SELECT COUNT(*) FROM tbl_sesiones WHERE estatus_sesion = 'Activa') as sesiones_activas,
    (SELECT COUNT(*) FROM tbl_documento_entrante
     WHERE fecha_registro > NOW() - INTERVAL '24 hours' AND eliminado = FALSE) as docs_ultimas_24h,
    (SELECT AVG(porcentaje_avance) FROM tbl_turnado
     WHERE estatus_turnado IN ('En_Proceso', 'Recibido')) as avance_promedio,
    (SELECT COUNT(*) FROM tbl_turnado t
     JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
     WHERE t.fecha_vencimiento < NOW()
     AND t.estatus_turnado != 'Concluido'
     AND de.eliminado = FALSE) as documentos_vencidos,
    (SELECT pg_size_pretty(pg_database_size(current_database()))) as tamano_base_datos,
    (SELECT COUNT(*) FROM tbl_log_auditoria
     WHERE fecha_hora > NOW() - INTERVAL '1 hour') as eventos_ultima_hora,
    NOW() as fecha_consulta;

-- ============================================================================
-- PARTE 15: VERIFICACIÓN FINAL
-- ============================================================================

SELECT
    '✅ SCRIPT DEFINITIVO EJECUTADO EXITOSAMENTE' as estado,
    NOW() as fecha_ejecucion;

SELECT
    'TABLAS CREADAS' as categoria,
    COUNT(*) as cantidad
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT
    'FUNCIONES CREADAS',
    COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'

UNION ALL

SELECT
    'TRIGGERS CREADOS',
    COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT
    'ÍNDICES CREADOS',
    COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT
    'POLÍTICAS RLS',
    COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT
    'ROLES',
    COUNT(*)
FROM cat_roles

UNION ALL

SELECT
    'UNIDADES ADMINISTRATIVAS',
    COUNT(*)
FROM cat_unidad_administrativa

UNION ALL

SELECT
    'VALORES DE CATÁLOGO',
    COUNT(*)
FROM cat_valores_catalogo;

-- ============================================================================
-- FIN DEL SCRIPT DEFINITIVO
-- ============================================================================
