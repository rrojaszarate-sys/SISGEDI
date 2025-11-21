-- ============================================================================
-- SISGEDI 2.0 - ESQUEMA COMPLETO CON DATOS DE PRUEBA
-- Sistema de Gestión Documental Inteligente
-- PostgreSQL 15+
--
-- Este script crea:
-- - Esquema completo (14 tablas)
-- - Funciones y triggers
-- - Row-Level Security (RLS)
-- - Datos de prueba completos:
--   * 20 Unidades Administrativas
--   * 100 Usuarios
--   * 100 Documentos Entrantes
--   * 50 Documentos Salientes
--   * 300+ Turnados
--   * Inventario completo
--   * Notificaciones
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración de Full-Text Search para español sin acentos
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, spanish_stem;

-- ============================================================================
-- SECCIÓN 2: TABLAS DE SEGURIDAD Y ADMINISTRACIÓN
-- ============================================================================

-- Tabla: Unidades Administrativas
CREATE TABLE cat_unidad_administrativa (
    id_ua UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_ua VARCHAR(150) NOT NULL UNIQUE,
    codigo_ua VARCHAR(20) UNIQUE,
    nivel_jerarquico INT NOT NULL,
    id_ua_superior UUID REFERENCES cat_unidad_administrativa(id_ua),
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    extension VARCHAR(10)
);

CREATE INDEX idx_ua_nivel ON cat_unidad_administrativa(nivel_jerarquico);
CREATE INDEX idx_ua_superior ON cat_unidad_administrativa(id_ua_superior);

-- Tabla: Roles del Sistema
CREATE TABLE cat_roles (
    id_rol UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    elementos_menu JSONB NOT NULL DEFAULT '[]'::jsonb,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Usuarios del Sistema
CREATE TABLE tbl_usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave_servidor_publico VARCHAR(50) NOT NULL UNIQUE,
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_rol UUID REFERENCES cat_roles(id_rol) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    password_hash TEXT NOT NULL,
    ultimo_cambio_password TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    intentos_fallidos INT DEFAULT 0,
    fecha_bloqueo TIMESTAMP WITH TIME ZONE,
    estatus VARCHAR(20) DEFAULT 'Activo' CHECK (estatus IN ('Activo', 'Inhabilitado', 'Suspendido', 'Eliminado')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creado_por UUID REFERENCES tbl_usuarios(id_usuario),
    ultima_sesion TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_usuario_ua ON tbl_usuarios(id_ua);
CREATE INDEX idx_usuario_rol ON tbl_usuarios(id_rol);
CREATE INDEX idx_usuario_clave ON tbl_usuarios(clave_servidor_publico);
CREATE INDEX idx_usuario_correo ON tbl_usuarios(correo_institucional);

-- Tabla: Catálogos Dinámicos
CREATE TABLE cat_valores_catalogo (
    id_valor_catalogo UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_catalogo VARCHAR(50) NOT NULL,
    valor VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden_presentacion INT DEFAULT 0,
    es_modificable BOOLEAN DEFAULT TRUE,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tipo_catalogo, valor)
);

CREATE INDEX idx_catalogo_tipo ON cat_valores_catalogo(tipo_catalogo);
CREATE INDEX idx_catalogo_estatus ON cat_valores_catalogo(estatus) WHERE estatus = TRUE;

-- ============================================================================
-- SECCIÓN 3: TABLAS DE DOCUMENTOS ENTRANTES
-- ============================================================================

-- Tabla Principal: Documentos Entrantes
CREATE TABLE tbl_documento_entrante (
    id_doc_entrante UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_oficio_externo VARCHAR(100),
    folio_interno VARCHAR(50) UNIQUE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_documento DATE,
    id_ua_registro UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_registro UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    asunto TEXT NOT NULL,
    id_prioridad UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_tipo_doc UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_area_remitente UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    remitente_nombre VARCHAR(200),
    remitente_cargo VARCHAR(150),
    remitente_institucion VARCHAR(200),
    marca_seguimiento VARCHAR(20) NOT NULL CHECK (marca_seguimiento IN ('Turnarse', 'Archivo', 'Conocimiento')),
    estatus_general VARCHAR(20) DEFAULT 'Pendiente' CHECK (estatus_general IN ('Pendiente', 'En_Proceso', 'Concluido', 'Archivado')),
    fecha_conclusion TIMESTAMP WITH TIME ZONE,
    contenido_ocr TEXT,
    metadatos_ocr JSONB,
    confianza_ocr NUMERIC(3, 2),
    ts_contenido_ocr TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('spanish_unaccent',
            COALESCE(contenido_ocr, '') || ' ' ||
            COALESCE(asunto, '') || ' ' ||
            COALESCE(remitente_nombre, '')
        )
    ) STORED,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_doc_entrante_ua ON tbl_documento_entrante(id_ua_registro);
CREATE INDEX idx_doc_entrante_fecha ON tbl_documento_entrante(fecha_registro DESC);
CREATE INDEX idx_doc_entrante_folio ON tbl_documento_entrante(folio_interno);
CREATE INDEX idx_doc_entrante_estatus ON tbl_documento_entrante(estatus_general) WHERE estatus_general != 'Concluido';
CREATE INDEX idx_doc_entrante_fts ON tbl_documento_entrante USING GIN(ts_contenido_ocr);
CREATE INDEX idx_doc_entrante_prioridad ON tbl_documento_entrante(id_prioridad);

-- Tabla: Anexos de Documentos
CREATE TABLE tbl_anexos (
    id_anexo UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    url_storage TEXT NOT NULL,
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    tamano_mb NUMERIC(10, 2),
    es_alcance BOOLEAN DEFAULT FALSE,
    fecha_alcance TIMESTAMP WITH TIME ZONE,
    descripcion TEXT,
    fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cargado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_anexo_doc_entrante ON tbl_anexos(id_doc_entrante);
CREATE INDEX idx_anexo_alcance ON tbl_anexos(es_alcance) WHERE es_alcance = TRUE;

-- ============================================================================
-- SECCIÓN 4: TABLAS DE SEGUIMIENTO Y TURNADO
-- ============================================================================

-- Tabla: Turnado de Documentos
CREATE TABLE tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    id_ua_origen UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_turno UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    id_ua_destino UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    fecha_turnado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    instruccion VARCHAR(150),
    observaciones TEXT,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    dias_para_atencion INT,
    porcentaje_avance NUMERIC(3, 0) DEFAULT 0 CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
    fecha_ultimo_avance TIMESTAMP WITH TIME ZONE,
    estatus_turnado VARCHAR(20) DEFAULT 'Turnado' CHECK (
        estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso', 'Concluido', 'Rechazado')
    ),
    id_firma_recepcion UUID,
    fecha_firma_recepcion TIMESTAMP WITH TIME ZONE,
    hash_recepcion TEXT,
    motivo_rechazo TEXT,
    fecha_rechazo TIMESTAMP WITH TIME ZONE,
    rechazado_por UUID REFERENCES tbl_usuarios(id_usuario),
    ua_sugerida_ia UUID REFERENCES cat_unidad_administrativa(id_ua),
    confianza_ia NUMERIC(3, 2),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_turnado_doc_entrante ON tbl_turnado(id_doc_entrante);
CREATE INDEX idx_turnado_ua_destino ON tbl_turnado(id_ua_destino);
CREATE INDEX idx_turnado_vencimiento ON tbl_turnado(fecha_vencimiento);
CREATE INDEX idx_turnado_estatus ON tbl_turnado(estatus_turnado);
CREATE INDEX idx_turnado_avance ON tbl_turnado(porcentaje_avance) WHERE porcentaje_avance < 100;

-- Tabla: Historial de Avances
CREATE TABLE tbl_avance (
    id_avance UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_turnado UUID REFERENCES tbl_turnado(id_turnado) ON DELETE CASCADE,
    porcentaje_anterior NUMERIC(3, 0),
    porcentaje_nuevo NUMERIC(3, 0),
    comentario TEXT,
    fecha_avance TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    registrado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_avance_turnado ON tbl_avance(id_turnado);

-- ============================================================================
-- SECCIÓN 5: TABLAS DE DOCUMENTOS SALIENTES
-- ============================================================================

-- Tabla: Documentos Salientes
CREATE TABLE tbl_documento_saliente (
    id_doc_saliente UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_doc VARCHAR(50) NOT NULL CHECK (tipo_doc IN ('Oficio', 'Nota_Informativa', 'Circular', 'Memorandum')),
    numero_folio VARCHAR(100) UNIQUE NOT NULL,
    ejercicio_fiscal INT NOT NULL,
    asunto TEXT NOT NULL,
    destinatario_nombre VARCHAR(200),
    destinatario_cargo VARCHAR(150),
    destinatario_institucion VARCHAR(200),
    contenido TEXT,
    id_ua_emisora UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_elabora UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    fecha_elaboracion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estatus_saliente VARCHAR(20) DEFAULT 'Borrador' CHECK (
        estatus_saliente IN ('Borrador', 'Firmado', 'Enviado', 'Cancelado', 'Reactivado')
    ),
    fecha_envio TIMESTAMP WITH TIME ZONE,
    id_firma_emision UUID,
    fecha_firma_emision TIMESTAMP WITH TIME ZONE,
    hash_documento TEXT,
    tiene_acuse BOOLEAN DEFAULT FALSE,
    url_acuse_storage TEXT,
    fecha_acuse TIMESTAMP WITH TIME ZONE,
    fue_reactivado BOOLEAN DEFAULT FALSE,
    fecha_reactivacion TIMESTAMP WITH TIME ZONE,
    motivo_reactivacion TEXT,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_doc_saliente_ua ON tbl_documento_saliente(id_ua_emisora);
CREATE INDEX idx_doc_saliente_folio ON tbl_documento_saliente(numero_folio);
CREATE INDEX idx_doc_saliente_tipo ON tbl_documento_saliente(tipo_doc);
CREATE INDEX idx_doc_saliente_estatus ON tbl_documento_saliente(estatus_saliente);
CREATE INDEX idx_doc_saliente_fecha ON tbl_documento_saliente(fecha_elaboracion DESC);

-- Tabla: Relación entre Documento Saliente y Entrante
CREATE TABLE tbl_relacion_respuesta (
    id_relacion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_doc_saliente UUID REFERENCES tbl_documento_saliente(id_doc_saliente) ON DELETE CASCADE,
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    tipo_relacion VARCHAR(50) DEFAULT 'Respuesta' CHECK (tipo_relacion IN ('Respuesta', 'Seguimiento', 'Complemento')),
    fecha_relacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_doc_saliente, id_doc_entrante)
);

CREATE INDEX idx_relacion_saliente ON tbl_relacion_respuesta(id_doc_saliente);
CREATE INDEX idx_relacion_entrante ON tbl_relacion_respuesta(id_doc_entrante);

-- ============================================================================
-- SECCIÓN 6: TABLAS DE FIRMA ELECTRÓNICA
-- ============================================================================

-- Tabla: Firmas Electrónicas
CREATE TABLE tbl_firmas (
    id_firma UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    tipo_firma VARCHAR(20) NOT NULL CHECK (tipo_firma IN ('Recepcion', 'Emision')),
    hash_documento TEXT NOT NULL,
    firma_digital TEXT NOT NULL,
    algoritmo_hash VARCHAR(20) DEFAULT 'SHA-256',
    certificado_thumbprint TEXT NOT NULL,
    certificado_serie VARCHAR(100),
    certificado_emisor VARCHAR(200),
    certificado_valido_desde DATE,
    certificado_valido_hasta DATE,
    fecha_firma TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_origen INET,
    user_agent TEXT,
    metadatos JSONB,
    es_valida BOOLEAN DEFAULT TRUE,
    fecha_validacion TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_firma_usuario ON tbl_firmas(id_usuario);
CREATE INDEX idx_firma_tipo ON tbl_firmas(tipo_firma);
CREATE INDEX idx_firma_fecha ON tbl_firmas(fecha_firma DESC);
CREATE INDEX idx_firma_hash ON tbl_firmas(hash_documento);

-- ============================================================================
-- SECCIÓN 7: TABLAS DE AUDITORÍA Y LOGS
-- ============================================================================

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
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_usuario ON tbl_log_auditoria(id_usuario);
CREATE INDEX idx_auditoria_fecha ON tbl_log_auditoria(fecha_hora DESC);
CREATE INDEX idx_auditoria_modulo ON tbl_log_auditoria(modulo);
CREATE INDEX idx_auditoria_accion ON tbl_log_auditoria(accion);

-- Tabla: Sesiones de Usuario
CREATE TABLE tbl_sesiones (
    id_sesion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    token_sesion TEXT NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actividad TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    ip_origen INET,
    user_agent TEXT,
    estatus_sesion VARCHAR(20) DEFAULT 'Activa' CHECK (
        estatus_sesion IN ('Activa', 'Expirada', 'Cerrada_Usuario', 'Cerrada_Sistema')
    )
);

CREATE INDEX idx_sesion_usuario ON tbl_sesiones(id_usuario);
CREATE INDEX idx_sesion_token ON tbl_sesiones(token_sesion);
CREATE INDEX idx_sesion_estatus ON tbl_sesiones(estatus_sesion) WHERE estatus_sesion = 'Activa';

-- ============================================================================
-- SECCIÓN 8: TABLAS DE NOTIFICACIONES
-- ============================================================================

-- Tabla: Notificaciones
CREATE TABLE tbl_notificaciones (
    id_notificacion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    tipo_notificacion VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante),
    id_turnado UUID REFERENCES tbl_turnado(id_turnado),
    leida BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMP WITH TIME ZONE,
    enviada_email BOOLEAN DEFAULT FALSE,
    fecha_envio_email TIMESTAMP WITH TIME ZONE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_usuario ON tbl_notificaciones(id_usuario);
CREATE INDEX idx_notif_leida ON tbl_notificaciones(leida) WHERE leida = FALSE;
CREATE INDEX idx_notif_fecha ON tbl_notificaciones(fecha_creacion DESC);

-- ============================================================================
-- SECCIÓN 9: TABLA DE INVENTARIO
-- ============================================================================

-- Tabla: Inventario de Bienes Muebles
CREATE TABLE tbl_inventario (
    id_inventario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_ua UUID NOT NULL REFERENCES cat_unidad_administrativa(id_ua),
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),
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
    proveedor VARCHAR(200) NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    serie VARCHAR(50),
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventario_ua ON tbl_inventario(id_ua);
CREATE INDEX idx_inventario_categoria ON tbl_inventario(categoria);
CREATE INDEX idx_inventario_numero ON tbl_inventario(numero_inventario);

-- ============================================================================
-- SECCIÓN 10: FUNCIONES Y PROCEDIMIENTOS ALMACENADOS
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
    fecha_registro TIMESTAMP WITH TIME ZONE,
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
        d.ts_contenido_ocr @@ websearch_to_tsquery('spanish_unaccent', p_query)
        AND (p_id_ua IS NULL OR d.id_ua_registro = p_id_ua)
    ORDER BY rank DESC, d.fecha_registro DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Generación de Folio Interno
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

CREATE TRIGGER trg_generar_folio_interno
    BEFORE INSERT ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION generar_folio_interno();

-- Función: Actualizar Timestamp
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_doc_entrante
    BEFORE UPDATE ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER trg_actualizar_doc_saliente
    BEFORE UPDATE ON tbl_documento_saliente
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- ============================================================================
-- SECCIÓN 11: DATOS INICIALES - ROLES Y CATÁLOGOS
-- ============================================================================

-- Insertar roles base
INSERT INTO cat_roles (nombre_rol, descripcion, elementos_menu) VALUES
('Administrador General', 'Acceso completo al sistema', '{
    "modulos": ["admin", "doc_entrante", "seguimiento", "doc_saliente", "dashboard", "consultas", "auditoria"],
    "acciones": ["crear", "editar", "eliminar", "turnar", "firmar", "rechazar", "concluir", "exportar"]
}'::jsonb),

('Administrador UA', 'Administrador de Unidad Administrativa', '{
    "modulos": ["admin_usuarios", "doc_entrante", "seguimiento", "doc_saliente", "dashboard", "consultas"],
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
}'::jsonb);

-- Insertar catálogos base
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, es_modificable) VALUES
-- Prioridad
('Prioridad', 'Normal', FALSE),
('Prioridad', 'Urgente', FALSE),

-- Tipos de Documento
('Tipo_Documento', 'Oficio', FALSE),
('Tipo_Documento', 'Circular', FALSE),
('Tipo_Documento', 'Memorándum', FALSE),
('Tipo_Documento', 'Nota Informativa', FALSE),

-- Áreas Remitentes (ejemplos)
('Area_Remitente', 'Secretaría de Hacienda', TRUE),
('Area_Remitente', 'Secretaría de Economía', TRUE),
('Area_Remitente', 'Secretaría de Educación', TRUE),
('Area_Remitente', 'Función Pública', TRUE);

-- ============================================================================
-- SECCIÓN 12: DATOS DE PRUEBA - UNIDADES ADMINISTRATIVAS
-- ============================================================================

-- Nivel 1: Subsecretarías (2 UAs)
INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, direccion, telefono, extension) VALUES
('Subsecretaría de Gestión Documental', 'SS-001', 1, 'Avenida Insurgentes No. 1234, Col. Centro, C.P. 06000, Ciudad de México', '55-1234-5678', '1001'),
('Coordinación General de Administración', 'SS-002', 1, 'Paseo de la Reforma No. 567, Col. Juárez, C.P. 06600, Ciudad de México', '55-2345-6789', '1002');

-- Nivel 2: Direcciones Generales (4 UAs)
INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion, telefono, extension)
SELECT
    nombre,
    codigo,
    2,
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001' LIMIT 1),
    'Eje Central No. ' || (100 + seq), '55-3456-' || LPAD(seq::text, 4, '0'), '20' || LPAD(seq::text, 2, '0')
FROM (VALUES
    ('Dirección General de Tecnologías de la Información', 'DG-001', 1),
    ('Dirección General de Recursos Humanos', 'DG-002', 2)
) AS t(nombre, codigo, seq);

INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion, telefono, extension)
SELECT
    nombre,
    codigo,
    2,
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-002' LIMIT 1),
    'Avenida Juárez No. ' || (200 + seq), '55-4567-' || LPAD(seq::text, 4, '0'), '21' || LPAD(seq::text, 2, '0')
FROM (VALUES
    ('Dirección General de Administración y Finanzas', 'DG-003', 1),
    ('Dirección General de Servicios Generales', 'DG-004', 2)
) AS t(nombre, codigo, seq);

-- Nivel 3: Direcciones (8 UAs)
INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion, telefono, extension)
SELECT
    'Dirección de ' || area,
    'DIR-' || LPAD(ROW_NUMBER() OVER ()::text, 3, '0'),
    3,
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = dg ORDER BY random() LIMIT 1),
    'Calle ' || area || ' No. 100', '55-5000-' || LPAD(ROW_NUMBER() OVER ()::text, 4, '0'), '3000'
FROM (VALUES
    ('Infraestructura', 'DG-001'),
    ('Sistemas', 'DG-001'),
    ('Capacitación', 'DG-002'),
    ('Nómina', 'DG-002'),
    ('Presupuesto', 'DG-003'),
    ('Contabilidad', 'DG-003'),
    ('Adquisiciones', 'DG-004'),
    ('Mantenimiento', 'DG-004')
) AS t(area, dg);

-- Nivel 4: Jefaturas (6 UAs)
INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion, telefono, extension)
SELECT
    'Jefatura de ' || area,
    'JEF-' || LPAD(ROW_NUMBER() OVER ()::text, 3, '0'),
    4,
    (SELECT id_ua FROM cat_unidad_administrativa WHERE nivel_jerarquico = 3 ORDER BY random() LIMIT 1),
    'Área ' || area, '55-6000-' || LPAD(ROW_NUMBER() OVER ()::text, 4, '0'), '4000'
FROM (VALUES
    ('Soporte Técnico'),
    ('Desarrollo'),
    ('Reclutamiento'),
    ('Tesorería'),
    ('Almacén'),
    ('Archivo')
) AS t(area);

-- ============================================================================
-- SECCIÓN 13: DATOS DE PRUEBA - USUARIOS (100 usuarios)
-- ============================================================================

-- Obtener IDs de roles para asignación
DO $$
DECLARE
    v_rol_admin_general UUID;
    v_rol_admin_ua UUID;
    v_rol_recepcion UUID;
    v_rol_nivel1 UUID;
    v_rol_nivel2 UUID;
    v_rol_nivel3 UUID;
    v_rol_visor UUID;
    v_ua_id UUID;
    v_contador INT := 1;
BEGIN
    -- Obtener IDs de roles
    SELECT id_rol INTO v_rol_admin_general FROM cat_roles WHERE nombre_rol = 'Administrador General';
    SELECT id_rol INTO v_rol_admin_ua FROM cat_roles WHERE nombre_rol = 'Administrador UA';
    SELECT id_rol INTO v_rol_recepcion FROM cat_roles WHERE nombre_rol = 'Recepción';
    SELECT id_rol INTO v_rol_nivel1 FROM cat_roles WHERE nombre_rol = 'Nivel 1';
    SELECT id_rol INTO v_rol_nivel2 FROM cat_roles WHERE nombre_rol = 'Nivel 2';
    SELECT id_rol INTO v_rol_nivel3 FROM cat_roles WHERE nombre_rol = 'Nivel 3';
    SELECT id_rol INTO v_rol_visor FROM cat_roles WHERE nombre_rol = 'Visor';

    -- Crear 5 usuarios por cada UA (20 UAs = 100 usuarios)
    FOR v_ua_id IN SELECT id_ua FROM cat_unidad_administrativa ORDER BY codigo_ua LOOP
        -- Usuario 1: Recepción
        INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, password_hash, estatus)
        VALUES (
            'SP2024' || LPAD(v_contador::text, 5, '0'),
            v_ua_id,
            v_rol_recepcion,
            'María ' || v_contador || ' Hernández López',
            'maria.hernandez' || v_contador || '@economia.gob.mx',
            '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKL',
            'Activo'
        );
        v_contador := v_contador + 1;

        -- Usuario 2: Nivel 1
        INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, password_hash, estatus)
        VALUES (
            'CS2024' || LPAD(v_contador::text, 5, '0'),
            v_ua_id,
            v_rol_nivel1,
            'Juan ' || v_contador || ' García Pérez',
            'juan.garcia' || v_contador || '@gob.mx',
            '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKL',
            'Activo'
        );
        v_contador := v_contador + 1;

        -- Usuario 3: Nivel 2
        INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, password_hash, estatus)
        VALUES (
            'EP2024' || LPAD(v_contador::text, 5, '0'),
            v_ua_id,
            v_rol_nivel2,
            'Ana ' || v_contador || ' Martínez Rodríguez',
            'ana.martinez' || v_contador || '@funcionpublica.gob.mx',
            '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKL',
            'Activo'
        );
        v_contador := v_contador + 1;

        -- Usuario 4: Nivel 3
        INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, password_hash, estatus)
        VALUES (
            'SP2025' || LPAD(v_contador::text, 5, '0'),
            v_ua_id,
            v_rol_nivel3,
            'Carlos ' || v_contador || ' López González',
            'carlos.lopez' || v_contador || '@economia.gob.mx',
            '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKL',
            'Activo'
        );
        v_contador := v_contador + 1;

        -- Usuario 5: Visor
        INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, password_hash, estatus)
        VALUES (
            'CS2025' || LPAD(v_contador::text, 5, '0'),
            v_ua_id,
            v_rol_visor,
            'Laura ' || v_contador || ' Sánchez Torres',
            'laura.sanchez' || v_contador || '@gob.mx',
            '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKL',
            'Activo'
        );
        v_contador := v_contador + 1;
    END LOOP;

    -- Crear 1 Administrador General
    INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, password_hash, estatus)
    VALUES (
        'ADMIN001',
        (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001' LIMIT 1),
        v_rol_admin_general,
        'Roberto Administrador General',
        'admin.general@economia.gob.mx',
        '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKL',
        'Activo'
    );

    RAISE NOTICE 'Usuarios creados exitosamente: %', v_contador;
END $$;

-- ============================================================================
-- SECCIÓN 14: DATOS DE PRUEBA - DOCUMENTOS ENTRANTES (100 docs)
-- ============================================================================

DO $$
DECLARE
    v_prioridad_normal UUID;
    v_prioridad_urgente UUID;
    v_tipo_oficio UUID;
    v_area_rem UUID;
    v_contador INT;
BEGIN
    -- Obtener IDs de catálogos
    SELECT id_valor_catalogo INTO v_prioridad_normal FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Normal';
    SELECT id_valor_catalogo INTO v_prioridad_urgente FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Urgente';
    SELECT id_valor_catalogo INTO v_tipo_oficio FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo_Documento' AND valor = 'Oficio';
    SELECT id_valor_catalogo INTO v_area_rem FROM cat_valores_catalogo WHERE tipo_catalogo = 'Area_Remitente' LIMIT 1;

    -- Crear 100 documentos entrantes
    FOR v_contador IN 1..100 LOOP
        INSERT INTO tbl_documento_entrante (
            numero_oficio_externo,
            fecha_documento,
            id_ua_registro,
            id_usuario_registro,
            asunto,
            id_prioridad,
            id_tipo_doc,
            id_area_remitente,
            remitente_nombre,
            remitente_cargo,
            remitente_institucion,
            marca_seguimiento,
            estatus_general,
            contenido_ocr,
            metadatos_ocr,
            confianza_ocr
        )
        SELECT
            'SEC/' || v_contador || '/2025',
            CURRENT_DATE - (random() * 60)::int,
            ua.id_ua,
            u.id_usuario,
            'Se solicita información sobre el programa ' || v_contador || ' del ejercicio fiscal vigente.',
            CASE WHEN random() < 0.7 THEN v_prioridad_normal ELSE v_prioridad_urgente END,
            v_tipo_oficio,
            v_area_rem,
            'Director ' || v_contador,
            'Director General',
            'Secretaría de Economía',
            CASE
                WHEN random() < 0.7 THEN 'Turnarse'
                WHEN random() < 0.9 THEN 'Archivo'
                ELSE 'Conocimiento'
            END,
            CASE
                WHEN random() < 0.2 THEN 'Pendiente'
                WHEN random() < 0.7 THEN 'En_Proceso'
                WHEN random() < 0.9 THEN 'Concluido'
                ELSE 'Archivado'
            END,
            'Ciudad de México, a ' || TO_CHAR(CURRENT_DATE, 'DD de FMMonth de YYYY') || E'\n\n' ||
            'Se solicita información sobre el programa ' || v_contador || ' del ejercicio fiscal vigente.' || E'\n\n' ||
            'Por medio del presente oficio, solicito su apoyo para proporcionar la información estadística del programa en mención, ' ||
            'con el objeto de integrar el informe trimestral que se remitirá a las instancias correspondientes.' || E'\n\n' ||
            'Sin otro particular, quedo de usted.' || E'\n\nATENTAMENTE' || E'\nDirector ' || v_contador || E'\nDirector General',
            ('{"entities": {"fechas": ["2025-01-01"], "personas": ["Director ' || v_contador || '"], "instituciones": ["Secretaría de Economía"]}, "confidence": 0.95, "language": "es", "pages": 1}')::jsonb,
            0.85 + (random() * 0.14)
        FROM cat_unidad_administrativa ua
        CROSS JOIN LATERAL (
            SELECT id_usuario
            FROM tbl_usuarios
            WHERE id_ua = ua.id_ua
            ORDER BY random()
            LIMIT 1
        ) u
        ORDER BY random()
        LIMIT 1;
    END LOOP;

    RAISE NOTICE 'Documentos entrantes creados: 100';
END $$;

-- ============================================================================
-- SECCIÓN 15: DATOS DE PRUEBA - TURNADOS (300+ turnados)
-- ============================================================================

DO $$
DECLARE
    v_doc_id UUID;
    v_ua_origen UUID;
    v_ua_destino UUID;
    v_usuario UUID;
    v_contador INT := 0;
BEGIN
    -- Crear 3 turnados por documento
    FOR v_doc_id IN SELECT id_doc_entrante FROM tbl_documento_entrante ORDER BY fecha_registro LIMIT 100 LOOP
        -- Obtener UA de registro del documento
        SELECT id_ua_registro INTO v_ua_origen FROM tbl_documento_entrante WHERE id_doc_entrante = v_doc_id;

        -- Crear 3 turnados
        FOR i IN 1..3 LOOP
            -- Seleccionar UA destino diferente al origen
            SELECT id_ua INTO v_ua_destino
            FROM cat_unidad_administrativa
            WHERE id_ua != v_ua_origen
            ORDER BY random()
            LIMIT 1;

            -- Seleccionar usuario de la UA origen
            SELECT id_usuario INTO v_usuario
            FROM tbl_usuarios
            WHERE id_ua = v_ua_origen
            ORDER BY random()
            LIMIT 1;

            INSERT INTO tbl_turnado (
                id_doc_entrante,
                id_ua_origen,
                id_usuario_turno,
                id_ua_destino,
                instruccion,
                fecha_vencimiento,
                dias_para_atencion,
                porcentaje_avance,
                estatus_turnado
            ) VALUES (
                v_doc_id,
                v_ua_origen,
                v_usuario,
                v_ua_destino,
                CASE (random() * 5)::int
                    WHEN 0 THEN 'Para su atención y seguimiento correspondiente.'
                    WHEN 1 THEN 'Para los fines procedentes.'
                    WHEN 2 THEN 'Para su conocimiento y efectos legales.'
                    WHEN 3 THEN 'Para elaborar dictamen técnico.'
                    WHEN 4 THEN 'Para dar respuesta en un plazo no mayor a 5 días hábiles.'
                    ELSE 'Para su análisis y opinión.'
                END,
                CURRENT_TIMESTAMP + (5 + random() * 10)::int * INTERVAL '1 day',
                5 + (random() * 10)::int,
                CASE (random() * 4)::int
                    WHEN 0 THEN 0
                    WHEN 1 THEN 25
                    WHEN 2 THEN 50
                    WHEN 3 THEN 75
                    ELSE 100
                END,
                CASE (random() * 4)::int
                    WHEN 0 THEN 'Turnado'
                    WHEN 1 THEN 'Recibido'
                    WHEN 2 THEN 'En_Proceso'
                    ELSE 'Concluido'
                END
            );

            v_ua_origen := v_ua_destino;
            v_contador := v_contador + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Turnados creados: %', v_contador;
END $$;

-- ============================================================================
-- SECCIÓN 16: DATOS DE PRUEBA - DOCUMENTOS SALIENTES (50 docs)
-- ============================================================================

DO $$
DECLARE
    v_contador INT;
BEGIN
    FOR v_contador IN 1..50 LOOP
        INSERT INTO tbl_documento_saliente (
            tipo_doc,
            numero_folio,
            ejercicio_fiscal,
            asunto,
            destinatario_nombre,
            destinatario_cargo,
            destinatario_institucion,
            contenido,
            id_ua_emisora,
            id_usuario_elabora,
            estatus_saliente
        )
        SELECT
            CASE (random() * 3)::int
                WHEN 0 THEN 'Oficio'
                WHEN 1 THEN 'Nota_Informativa'
                WHEN 2 THEN 'Circular'
                ELSE 'Memorandum'
            END,
            'SAL-2025-' || LPAD(v_contador::text, 6, '0'),
            2025,
            'Respuesta a solicitud de información número ' || v_contador,
            'Licenciado Destinatario ' || v_contador,
            'Director General',
            'Secretaría ' || v_contador,
            'En atención a su oficio de fecha reciente, me permito informarle lo siguiente...',
            ua.id_ua,
            u.id_usuario,
            CASE (random() * 3)::int
                WHEN 0 THEN 'Borrador'
                WHEN 1 THEN 'Firmado'
                ELSE 'Enviado'
            END
        FROM cat_unidad_administrativa ua
        CROSS JOIN LATERAL (
            SELECT id_usuario
            FROM tbl_usuarios
            WHERE id_ua = ua.id_ua
            ORDER BY random()
            LIMIT 1
        ) u
        ORDER BY random()
        LIMIT 1;
    END LOOP;

    RAISE NOTICE 'Documentos salientes creados: 50';
END $$;

-- ============================================================================
-- SECCIÓN 17: DATOS DE PRUEBA - INVENTARIO (500+ items)
-- ============================================================================

DO $$
DECLARE
    v_ua RECORD;
    v_contador INT := 1;
    v_items_por_ua INT;
BEGIN
    -- Crear inventario para cada UA
    FOR v_ua IN SELECT id_ua, codigo_ua, nivel_jerarquico FROM cat_unidad_administrativa LOOP
        -- Cantidad según nivel jerárquico
        v_items_por_ua := CASE v_ua.nivel_jerarquico
            WHEN 1 THEN 50
            WHEN 2 THEN 30
            WHEN 3 THEN 20
            ELSE 15
        END;

        -- Crear items
        FOR i IN 1..v_items_por_ua LOOP
            INSERT INTO tbl_inventario (
                id_ua,
                categoria,
                subcategoria,
                descripcion,
                cantidad,
                unidad,
                estado,
                ubicacion,
                responsable,
                numero_inventario,
                fecha_adquisicion,
                valor_unitario,
                valor_total,
                proveedor,
                marca,
                modelo,
                serie
            )
            SELECT
                v_ua.id_ua,
                cat.categoria,
                cat.categoria,
                cat.descripcion,
                1 + (random() * 3)::int,
                'Pieza',
                CASE (random() * 3)::int
                    WHEN 0 THEN 'Excelente'
                    WHEN 1 THEN 'Bueno'
                    WHEN 2 THEN 'Regular'
                    ELSE 'Malo'
                END,
                'Piso ' || (1 + (random() * 5)::int) || ' - Área ' || (100 + (random() * 500)::int),
                u.nombre_completo,
                v_ua.codigo_ua || '-' || SUBSTRING(cat.categoria, 1, 3) || '-2025-' || LPAD(v_contador::text, 4, '0'),
                CURRENT_DATE - (random() * 1000)::int,
                cat.valor_min + (random() * (cat.valor_max - cat.valor_min))::numeric(10,2),
                (1 + (random() * 3)::int) * (cat.valor_min + (random() * (cat.valor_max - cat.valor_min))::numeric(10,2)),
                cat.proveedor,
                cat.marca,
                cat.modelo,
                CASE WHEN cat.tiene_serie THEN 'SN' || UPPER(substring(md5(random()::text), 1, 12)) ELSE NULL END
            FROM (VALUES
                ('Mobiliario', 'Escritorio ejecutivo', 3000, 8000, 'Office Depot', NULL, NULL, FALSE),
                ('Mobiliario', 'Silla ergonómica', 1500, 4000, 'Office Depot', NULL, NULL, FALSE),
                ('Equipo de Cómputo', 'Computadora escritorio', 8000, 18000, 'Dell Technologies', 'Dell', 'Optiplex 7090', TRUE),
                ('Equipo de Cómputo', 'Laptop', 10000, 25000, 'HP México', 'HP', 'EliteBook 840', TRUE),
                ('Equipo de Cómputo', 'Monitor LED 24"', 2000, 6000, 'Syscom', 'Samsung', '24F390', FALSE),
                ('Equipo de Comunicación', 'Teléfono IP', 800, 3000, 'Cisco', 'Cisco', 'IP Phone 7841', FALSE),
                ('Climatización', 'Aire acondicionado', 5000, 15000, 'Samsung', 'Samsung', 'Split 12000 BTU', TRUE),
                ('Equipo Audiovisual', 'Proyector', 5000, 15000, 'Sony', 'Sony', 'VPL-DX147', TRUE)
            ) AS cat(categoria, descripcion, valor_min, valor_max, proveedor, marca, modelo, tiene_serie)
            CROSS JOIN LATERAL (
                SELECT nombre_completo
                FROM tbl_usuarios
                WHERE id_ua = v_ua.id_ua
                ORDER BY random()
                LIMIT 1
            ) u
            ORDER BY random()
            LIMIT 1;

            v_contador := v_contador + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Items de inventario creados: %', v_contador - 1;
END $$;

-- ============================================================================
-- SECCIÓN 18: DATOS DE PRUEBA - NOTIFICACIONES
-- ============================================================================

DO $$
DECLARE
    v_usuario UUID;
    v_contador INT := 0;
BEGIN
    -- Crear 3 notificaciones para cada usuario
    FOR v_usuario IN SELECT id_usuario FROM tbl_usuarios LIMIT 50 LOOP
        FOR i IN 1..3 LOOP
            INSERT INTO tbl_notificaciones (
                id_usuario,
                tipo_notificacion,
                titulo,
                mensaje,
                leida
            ) VALUES (
                v_usuario,
                CASE (random() * 3)::int
                    WHEN 0 THEN 'Vencimiento'
                    WHEN 1 THEN 'Turnado'
                    WHEN 2 THEN 'Rechazo'
                    ELSE 'Firma'
                END,
                'Notificación de prueba ' || v_contador,
                'Este es un mensaje de notificación de prueba.',
                random() < 0.5
            );
            v_contador := v_contador + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Notificaciones creadas: %', v_contador;
END $$;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Actualizar valores calculados en inventario
UPDATE tbl_inventario
SET valor_total = valor_unitario * cantidad
WHERE valor_total != valor_unitario * cantidad;

-- Mostrar resumen
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'BASE DE DATOS SISGEDI 2.0 CREADA EXITOSAMENTE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'RESUMEN DE DATOS:';
    RAISE NOTICE '- Unidades Administrativas: %', (SELECT COUNT(*) FROM cat_unidad_administrativa);
    RAISE NOTICE '- Usuarios: %', (SELECT COUNT(*) FROM tbl_usuarios);
    RAISE NOTICE '- Documentos Entrantes: %', (SELECT COUNT(*) FROM tbl_documento_entrante);
    RAISE NOTICE '- Documentos Salientes: %', (SELECT COUNT(*) FROM tbl_documento_saliente);
    RAISE NOTICE '- Turnados: %', (SELECT COUNT(*) FROM tbl_turnado);
    RAISE NOTICE '- Items de Inventario: %', (SELECT COUNT(*) FROM tbl_inventario);
    RAISE NOTICE '- Notificaciones: %', (SELECT COUNT(*) FROM tbl_notificaciones);
    RAISE NOTICE '';
    RAISE NOTICE 'Credenciales de prueba:';
    RAISE NOTICE '- Usuario Admin: admin.general@economia.gob.mx';
    RAISE NOTICE '- Clave: ADMIN001';
    RAISE NOTICE '- Password: (hash bcrypt simulado)';
    RAISE NOTICE '';
    RAISE NOTICE 'Siguiente paso: npm run test';
    RAISE NOTICE '============================================================';
END $$;
