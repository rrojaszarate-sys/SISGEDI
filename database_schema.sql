-- ============================================================================
-- SISGEDI 2.0 - ESQUEMA COMPLETO DE BASE DE DATOS
-- Sistema de Gestión Documental Inteligente
-- PostgreSQL 15+
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Para funciones de hash

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
    nivel_jerarquico INT NOT NULL, -- 1=Subsecretaría, 2=Dir. General, 3=Dir, 4=Jefatura
    id_ua_superior UUID REFERENCES cat_unidad_administrativa(id_ua),
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Metadatos
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    extension VARCHAR(10)
);

-- Índices para cat_unidad_administrativa
CREATE INDEX idx_ua_nivel ON cat_unidad_administrativa(nivel_jerarquico);
CREATE INDEX idx_ua_superior ON cat_unidad_administrativa(id_ua_superior);

-- Tabla: Roles del Sistema
CREATE TABLE cat_roles (
    id_rol UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    elementos_menu JSONB NOT NULL DEFAULT '[]'::jsonb, -- RF2: Control de acceso a módulos
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Usuarios del Sistema
CREATE TABLE tbl_usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave_servidor_publico VARCHAR(50) NOT NULL UNIQUE, -- RF1
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_rol UUID REFERENCES cat_roles(id_rol) NOT NULL,

    -- Datos personales
    nombre_completo VARCHAR(200) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL UNIQUE, -- RF4
    telefono VARCHAR(20),

    -- Seguridad
    password_hash TEXT NOT NULL,
    ultimo_cambio_password TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    intentos_fallidos INT DEFAULT 0,
    fecha_bloqueo TIMESTAMP WITH TIME ZONE,

    -- Estado
    estatus VARCHAR(20) DEFAULT 'Activo' CHECK (estatus IN ('Activo', 'Inhabilitado', 'Suspendido', 'Eliminado')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Metadatos
    creado_por UUID REFERENCES tbl_usuarios(id_usuario),
    ultima_sesion TIMESTAMP WITH TIME ZONE
);

-- Índices para tbl_usuarios
CREATE INDEX idx_usuario_ua ON tbl_usuarios(id_ua);
CREATE INDEX idx_usuario_rol ON tbl_usuarios(id_rol);
CREATE INDEX idx_usuario_clave ON tbl_usuarios(clave_servidor_publico);
CREATE INDEX idx_usuario_correo ON tbl_usuarios(correo_institucional);

-- Tabla: Catálogos Dinámicos
CREATE TABLE cat_valores_catalogo (
    id_valor_catalogo UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_catalogo VARCHAR(50) NOT NULL, -- 'Prioridad', 'Tipo_Documento', 'Area_Remitente', etc.
    valor VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden_presentacion INT DEFAULT 0,
    es_modificable BOOLEAN DEFAULT TRUE, -- Documentos base no modificables
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (tipo_catalogo, valor)
);

-- Índices para cat_valores_catalogo
CREATE INDEX idx_catalogo_tipo ON cat_valores_catalogo(tipo_catalogo);
CREATE INDEX idx_catalogo_estatus ON cat_valores_catalogo(estatus) WHERE estatus = TRUE;

-- ============================================================================
-- SECCIÓN 3: TABLAS DE DOCUMENTOS ENTRANTES
-- ============================================================================

-- Tabla Principal: Documentos Entrantes
CREATE TABLE tbl_documento_entrante (
    id_doc_entrante UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Información básica
    numero_oficio_externo VARCHAR(100),
    folio_interno VARCHAR(50) UNIQUE, -- Generado automáticamente
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_documento DATE,

    -- Referencias
    id_ua_registro UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_registro UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,

    -- Datos del documento (RF6)
    asunto TEXT NOT NULL, -- Obligatorio, extraído por OCR
    id_prioridad UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_tipo_doc UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_area_remitente UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    remitente_nombre VARCHAR(200),
    remitente_cargo VARCHAR(150),
    remitente_institucion VARCHAR(200),

    -- Control de seguimiento (RF9)
    marca_seguimiento VARCHAR(20) NOT NULL CHECK (marca_seguimiento IN ('Turnarse', 'Archivo', 'Conocimiento')),

    -- Estado
    estatus_general VARCHAR(20) DEFAULT 'Pendiente' CHECK (estatus_general IN ('Pendiente', 'En_Proceso', 'Concluido', 'Archivado')),
    fecha_conclusion TIMESTAMP WITH TIME ZONE,

    -- Inteligencia Documental (I)
    contenido_ocr TEXT, -- Texto extraído sin formato
    metadatos_ocr JSONB, -- Entidades extraídas (fechas, números, etc.)
    confianza_ocr NUMERIC(3, 2), -- 0.00 a 1.00
    ts_contenido_ocr TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('spanish_unaccent',
            COALESCE(contenido_ocr, '') || ' ' ||
            COALESCE(asunto, '') || ' ' ||
            COALESCE(remitente_nombre, '')
        )
    ) STORED, -- Índice Full-Text Search (RF7, RF11)

    -- Auditoría
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

-- Índices para tbl_documento_entrante
CREATE INDEX idx_doc_entrante_ua ON tbl_documento_entrante(id_ua_registro);
CREATE INDEX idx_doc_entrante_fecha ON tbl_documento_entrante(fecha_registro DESC);
CREATE INDEX idx_doc_entrante_folio ON tbl_documento_entrante(folio_interno);
CREATE INDEX idx_doc_entrante_estatus ON tbl_documento_entrante(estatus_general) WHERE estatus_general != 'Concluido'; -- Partial index
CREATE INDEX idx_doc_entrante_fts ON tbl_documento_entrante USING GIN(ts_contenido_ocr); -- Full-Text Search
CREATE INDEX idx_doc_entrante_prioridad ON tbl_documento_entrante(id_prioridad);

-- Tabla: Anexos de Documentos
CREATE TABLE tbl_anexos (
    id_anexo UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,

    -- Información del archivo
    nombre_archivo VARCHAR(255) NOT NULL,
    url_storage TEXT NOT NULL, -- Supabase Storage URL
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    tamano_mb NUMERIC(10, 2),

    -- Metadatos
    es_alcance BOOLEAN DEFAULT FALSE, -- Para Alcance a Documento (CU 8.2)
    fecha_alcance TIMESTAMP WITH TIME ZONE,
    descripcion TEXT,

    -- Auditoría
    fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cargado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

-- Índices para tbl_anexos
CREATE INDEX idx_anexo_doc_entrante ON tbl_anexos(id_doc_entrante);
CREATE INDEX idx_anexo_alcance ON tbl_anexos(es_alcance) WHERE es_alcance = TRUE;

-- ============================================================================
-- SECCIÓN 4: TABLAS DE SEGUIMIENTO Y TURNADO
-- ============================================================================

-- Tabla: Turnado de Documentos
CREATE TABLE tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,

    -- Origen y Destino (RF13)
    id_ua_origen UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_turno UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    id_ua_destino UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    fecha_turnado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Instrucciones
    instruccion VARCHAR(150),
    observaciones TEXT,

    -- Vencimiento (RF5)
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    dias_para_atencion INT,

    -- Avance (RF17)
    porcentaje_avance NUMERIC(3, 0) DEFAULT 0 CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
    fecha_ultimo_avance TIMESTAMP WITH TIME ZONE,

    -- Estado
    estatus_turnado VARCHAR(20) DEFAULT 'Turnado' CHECK (
        estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso', 'Concluido', 'Rechazado')
    ),

    -- Firma Electrónica de Recepción (RF23)
    id_firma_recepcion UUID,
    fecha_firma_recepcion TIMESTAMP WITH TIME ZONE,
    hash_recepcion TEXT,

    -- Rechazo (RF15)
    motivo_rechazo TEXT,
    fecha_rechazo TIMESTAMP WITH TIME ZONE,
    rechazado_por UUID REFERENCES tbl_usuarios(id_usuario),

    -- IA: Turnado Predictivo
    ua_sugerida_ia UUID REFERENCES cat_unidad_administrativa(id_ua),
    confianza_ia NUMERIC(3, 2), -- 0.00 a 1.00

    -- Auditoría
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tbl_turnado
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

    -- Generación de Número (RF19)
    tipo_doc VARCHAR(50) NOT NULL CHECK (tipo_doc IN ('Oficio', 'Nota_Informativa', 'Circular', 'Memorandum')),
    numero_folio VARCHAR(100) UNIQUE NOT NULL,
    ejercicio_fiscal INT NOT NULL,

    -- Información del documento
    asunto TEXT NOT NULL,
    destinatario_nombre VARCHAR(200),
    destinatario_cargo VARCHAR(150),
    destinatario_institucion VARCHAR(200),
    contenido TEXT, -- Contenido del documento elaborado

    -- Creador
    id_ua_creador UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_elaboro UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    fecha_elaboracion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Estado
    estatus_saliente VARCHAR(20) DEFAULT 'Borrador' CHECK (
        estatus_saliente IN ('Borrador', 'Firmado', 'Enviado', 'Cancelado', 'Reactivado')
    ),
    fecha_envio TIMESTAMP WITH TIME ZONE,

    -- Firma Electrónica de Emisión (RF22)
    id_firma_emision UUID,
    fecha_firma_emision TIMESTAMP WITH TIME ZONE,
    hash_documento TEXT, -- Hash SHA-256 para No Repudio

    -- Acuse (RF24)
    tiene_acuse BOOLEAN DEFAULT FALSE,
    url_acuse_storage TEXT,
    fecha_acuse TIMESTAMP WITH TIME ZONE,

    -- Reactivación (RF27)
    fue_reactivado BOOLEAN DEFAULT FALSE,
    fecha_reactivacion TIMESTAMP WITH TIME ZONE,
    motivo_reactivacion TEXT,

    -- Auditoría
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

-- Índices para tbl_documento_saliente
CREATE INDEX idx_doc_saliente_ua ON tbl_documento_saliente(id_ua_creador);
CREATE INDEX idx_doc_saliente_folio ON tbl_documento_saliente(numero_folio);
CREATE INDEX idx_doc_saliente_tipo ON tbl_documento_saliente(tipo_doc);
CREATE INDEX idx_doc_saliente_estatus ON tbl_documento_saliente(estatus_saliente);
CREATE INDEX idx_doc_saliente_fecha ON tbl_documento_saliente(fecha_elaboracion DESC);

-- Tabla: Relación entre Documento Saliente y Entrante (RF20)
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

    -- Usuario firmante
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,

    -- Tipo de firma
    tipo_firma VARCHAR(20) NOT NULL CHECK (tipo_firma IN ('Recepcion', 'Emision')),

    -- Hash y firma
    hash_documento TEXT NOT NULL,
    firma_digital TEXT NOT NULL, -- Firma cifrada con clave privada
    algoritmo_hash VARCHAR(20) DEFAULT 'SHA-256',

    -- Certificado
    certificado_thumbprint TEXT NOT NULL, -- Huella digital del certificado
    certificado_serie VARCHAR(100),
    certificado_emisor VARCHAR(200),
    certificado_valido_desde DATE,
    certificado_valido_hasta DATE,

    -- Contexto
    fecha_firma TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_origen INET,
    user_agent TEXT,

    -- Metadatos adicionales
    metadatos JSONB,

    -- Validación
    es_valida BOOLEAN DEFAULT TRUE,
    fecha_validacion TIMESTAMP WITH TIME ZONE
);

-- Índices para tbl_firmas
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

    -- Usuario y contexto
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),
    ip_origen INET,
    user_agent TEXT,

    -- Acción
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(100) NOT NULL, -- 'Login', 'Firma_Electronica', 'Rechazo_RF15', 'Avance_100', etc.
    descripcion TEXT,

    -- Entidad afectada
    tabla_afectada VARCHAR(100),
    id_registro_afectado UUID,

    -- Datos antes/después (para cambios)
    datos_anteriores JSONB,
    datos_nuevos JSONB,

    -- Timestamp
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tbl_log_auditoria
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

    -- Destinatario
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,

    -- Contenido
    tipo_notificacion VARCHAR(50) NOT NULL, -- 'Vencimiento', 'Turnado', 'Rechazo', etc.
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,

    -- Referencia
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante),
    id_turnado UUID REFERENCES tbl_turnado(id_turnado),

    -- Estado
    leida BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMP WITH TIME ZONE,
    enviada_email BOOLEAN DEFAULT FALSE,
    fecha_envio_email TIMESTAMP WITH TIME ZONE,

    -- Timestamp
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notif_usuario ON tbl_notificaciones(id_usuario);
CREATE INDEX idx_notif_leida ON tbl_notificaciones(leida) WHERE leida = FALSE;
CREATE INDEX idx_notif_fecha ON tbl_notificaciones(fecha_creacion DESC);

-- ============================================================================
-- SECCIÓN 9: FUNCIONES Y PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

-- Función: Búsqueda Full-Text Search (RF7)
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

-- Función: Actualizar Timestamp de Actualización
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
-- SECCIÓN 10: TRIGGERS DE SEGURIDAD E INTEGRIDAD
-- ============================================================================

-- Trigger: Bloquear documentos con avance al 100% (RF17)
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

-- Trigger: Bloquear documentos firmados electrónicamente
CREATE OR REPLACE FUNCTION fn_bloquear_documento_firmado()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'tbl_documento_entrante' THEN
        IF EXISTS (
            SELECT 1 FROM tbl_turnado
            WHERE id_doc_entrante = OLD.id_doc_entrante
            AND id_firma_recepcion IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'No se puede modificar un documento con firma electrónica';
        END IF;
    ELSIF TG_TABLE_NAME = 'tbl_documento_saliente' THEN
        IF OLD.id_firma_emision IS NOT NULL THEN
            RAISE EXCEPTION 'No se puede modificar un documento firmado electrónicamente';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bloquear_doc_entrante_firmado
    BEFORE UPDATE ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloquear_documento_firmado();

CREATE TRIGGER trg_bloquear_doc_saliente_firmado
    BEFORE UPDATE ON tbl_documento_saliente
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloquear_documento_firmado();

-- Trigger: Auditoría automática de cambios críticos
CREATE OR REPLACE FUNCTION fn_registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tbl_log_auditoria (
        id_usuario,
        modulo,
        accion,
        tabla_afectada,
        id_registro_afectado,
        datos_anteriores,
        datos_nuevos
    ) VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        TG_TABLE_NAME,
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id_doc_entrante ELSE NEW.id_doc_entrante END,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoría a tablas críticas
CREATE TRIGGER trg_auditoria_doc_entrante
    AFTER INSERT OR UPDATE OR DELETE ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION fn_registrar_auditoria();

CREATE TRIGGER trg_auditoria_turnado
    AFTER INSERT OR UPDATE OR DELETE ON tbl_turnado
    FOR EACH ROW
    EXECUTE FUNCTION fn_registrar_auditoria();

CREATE TRIGGER trg_auditoria_doc_saliente
    AFTER INSERT OR UPDATE OR DELETE ON tbl_documento_saliente
    FOR EACH ROW
    EXECUTE FUNCTION fn_registrar_auditoria();

-- ============================================================================
-- SECCIÓN 11: ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en tablas críticas
ALTER TABLE tbl_documento_entrante ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tbl_documento_entrante

-- Usuarios ven solo documentos de su UA
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

-- Administrador General ve todo
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

-- Solo usuarios de la UA pueden insertar
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

-- Políticas RLS para tbl_turnado

-- Ver turnados donde la UA es origen o destino
CREATE POLICY "rls_turnado_select"
    ON tbl_turnado
    FOR SELECT
    USING (
        id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Solo puede turnar si es de la UA origen
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

-- Políticas RLS para tbl_usuarios

-- Solo Admin General ve todos los usuarios
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
            AND r.nombre_rol IN ('Administrador UA', 'Administrador General')
        )
    );

-- Políticas RLS para tbl_notificaciones

-- Solo el usuario destinatario ve sus notificaciones
CREATE POLICY "rls_notificaciones_select"
    ON tbl_notificaciones
    FOR SELECT
    USING (id_usuario = auth.uid());

-- ============================================================================
-- SECCIÓN 12: DATOS INICIALES (SEED DATA)
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

-- Tipos de Documento (base, no modificables)
('Tipo_Documento', 'Oficio', FALSE),
('Tipo_Documento', 'Circular', FALSE),
('Tipo_Documento', 'Memorándum', FALSE),
('Tipo_Documento', 'Nota Informativa', FALSE);

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================

-- Comentarios en tablas para documentación
COMMENT ON TABLE tbl_documento_entrante IS 'Almacena todos los documentos entrantes al sistema con capacidades de OCR';
COMMENT ON TABLE tbl_turnado IS 'Gestiona el flujo de turnado de documentos entre UAs con firma electrónica';
COMMENT ON TABLE tbl_firmas IS 'Registro de firmas electrónicas para garantizar no repudio';
COMMENT ON TABLE tbl_log_auditoria IS 'Log completo de auditoría del sistema';
COMMENT ON COLUMN tbl_documento_entrante.ts_contenido_ocr IS 'Índice FTS generado automáticamente del contenido OCR';
COMMENT ON COLUMN tbl_turnado.porcentaje_avance IS 'Porcentaje de avance, al llegar a 100% el documento se bloquea (RF17)';
