-- ============================================================================
-- SISGEDI 2.0 - ESQUEMA HÍBRIDO OPTIMIZADO
-- ============================================================================
-- Sistema de Gestión Documental - Arquitectura Moderna
--
-- Características:
-- ✓ 16 tablas balanceadas (ni muy simple, ni muy complejo)
-- ✓ UUIDs para mejor escalabilidad
-- ✓ JSONB para flexibilidad
-- ✓ Supabase Auth integration
-- ✓ Full-Text Search optimizado
-- ✓ Catálogos dinámicos del legacy
-- ✓ Control de vencimientos con días inhábiles
-- ✓ Trazabilidad completa
--
-- Total: 16 tablas
-- Fecha: 2025-11-20
-- ============================================================================

-- ============================================================================
-- PASO 1: LIMPIEZA COMPLETA
-- ============================================================================

DROP TABLE IF EXISTS tbl_log_auditoria CASCADE;
DROP TABLE IF EXISTS tbl_sesiones CASCADE;
DROP TABLE IF EXISTS tbl_inventario CASCADE;
DROP TABLE IF EXISTS tbl_notificaciones CASCADE;
DROP TABLE IF EXISTS tbl_documento_saliente CASCADE;
DROP TABLE IF EXISTS tbl_turnado CASCADE;
DROP TABLE IF EXISTS tbl_anexos CASCADE;
DROP TABLE IF EXISTS tbl_documento_entrante CASCADE;
DROP TABLE IF EXISTS cat_remitente CASCADE;
DROP TABLE IF EXISTS cat_area_remitente CASCADE;
DROP TABLE IF EXISTS tbl_usuarios CASCADE;
DROP TABLE IF EXISTS cat_valores_catalogo CASCADE;
DROP TABLE IF EXISTS cat_roles CASCADE;
DROP TABLE IF EXISTS cat_unidad_administrativa CASCADE;
DROP TABLE IF EXISTS cat_diasinhabiles CASCADE;
DROP TABLE IF EXISTS cat_semaforo CASCADE;

DROP FUNCTION IF EXISTS search_documentos CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha CASCADE;
DROP FUNCTION IF EXISTS generar_folio_interno CASCADE;
DROP FUNCTION IF EXISTS actualizar_ts_contenido_ocr CASCADE;
DROP FUNCTION IF EXISTS calcular_fecha_vencimiento CASCADE;

DROP TEXT SEARCH CONFIGURATION IF EXISTS spanish_unaccent CASCADE;

-- ============================================================================
-- PASO 2: EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración Full-Text Search en español sin acentos
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;

-- ============================================================================
-- PASO 3: CATÁLOGOS BASE
-- ============================================================================

-- Tabla: Días Inhábiles (Crítico para calcular vencimientos)
CREATE TABLE cat_diasinhabiles (
    id_dia_inhabil UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    tipo VARCHAR(50) DEFAULT 'festivo', -- festivo, suspensión, puente
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diasinhabiles_fecha ON cat_diasinhabiles(fecha, estatus);

COMMENT ON TABLE cat_diasinhabiles IS 'Días festivos y no laborables para cálculo de vencimientos';

-- Tabla: Semáforo (Configuración de alertas visuales)
CREATE TABLE cat_semaforo (
    id_semaforo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    porcentaje_vencimiento SMALLINT NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL,
    descripcion VARCHAR(100),
    estatus BOOLEAN DEFAULT TRUE,
    CHECK (porcentaje_vencimiento BETWEEN 0 AND 100)
);

INSERT INTO cat_semaforo (porcentaje_vencimiento, color, descripcion) VALUES
(70, 'green', 'Tiempo suficiente'),
(90, 'yellow', 'Próximo a vencer'),
(100, 'red', 'Vencido o crítico');

COMMENT ON TABLE cat_semaforo IS 'Configuración de colores de alerta según % de tiempo transcurrido';

-- Tabla: Unidades Administrativas
CREATE TABLE cat_unidad_administrativa (
    id_ua UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_ua VARCHAR(150) NOT NULL UNIQUE,
    codigo_ua VARCHAR(20) UNIQUE,
    nivel_jerarquico INT NOT NULL CHECK (nivel_jerarquico BETWEEN 1 AND 7),
    id_ua_superior UUID REFERENCES cat_unidad_administrativa(id_ua),

    -- Campos adicionales del legacy
    abreviatura VARCHAR(10),
    direccion VARCHAR(250),
    telefono VARCHAR(20),
    extension VARCHAR(10),
    color_identifica VARCHAR(25),

    -- Configuración
    puede_turnar BOOLEAN DEFAULT TRUE,
    folio_automatico BOOLEAN DEFAULT TRUE,

    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ua_nivel ON cat_unidad_administrativa(nivel_jerarquico);
CREATE INDEX idx_ua_superior ON cat_unidad_administrativa(id_ua_superior);
CREATE INDEX idx_ua_codigo ON cat_unidad_administrativa(codigo_ua);

COMMENT ON COLUMN cat_unidad_administrativa.nivel_jerarquico IS '1=Secretaría, 2=Subsecretaría, 3=Coord Gral, 4=Dir Gral, 5=Dir Área, 6=Subdir, 7=Jefatura';

-- Tabla: Roles
CREATE TABLE cat_roles (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSONB NOT NULL DEFAULT '{"modulos": [], "acciones": []}'::jsonb,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN cat_roles.permisos IS 'JSON con módulos y acciones permitidas. Ejemplo: {"modulos":["documentos","inventario"],"acciones":["crear","leer","actualizar"]}';

-- Tabla: Catálogos Dinámicos (Valores configurables)
CREATE TABLE cat_valores_catalogo (
    id_valor_catalogo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_catalogo VARCHAR(50) NOT NULL,
    valor VARCHAR(100) NOT NULL,
    codigo VARCHAR(20),
    descripcion TEXT,
    orden SMALLINT,
    metadata JSONB DEFAULT '{}'::jsonb,
    es_modificable BOOLEAN DEFAULT TRUE,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tipo_catalogo, valor)
);

CREATE INDEX idx_catalogo_tipo ON cat_valores_catalogo(tipo_catalogo, estatus);
CREATE INDEX idx_catalogo_codigo ON cat_valores_catalogo(codigo);

COMMENT ON TABLE cat_valores_catalogo IS 'Catálogo unificado para todos los valores configurables del sistema';

-- Tabla: Áreas Remitentes (Instituciones externas)
CREATE TABLE cat_area_remitente (
    id_area_remitente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_area VARCHAR(200) NOT NULL UNIQUE,
    tipo VARCHAR(50), -- Gobierno Federal, Estatal, Municipal, Privado, etc.
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_area_remitente_tipo ON cat_area_remitente(tipo, estatus);

-- Tabla: Remitentes (Personas específicas de instituciones externas)
CREATE TABLE cat_remitente (
    id_remitente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(300) NOT NULL,
    cargo VARCHAR(150),
    email VARCHAR(150),
    telefono VARCHAR(20),
    id_area_remitente UUID REFERENCES cat_area_remitente(id_area_remitente),
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remitente_area ON cat_remitente(id_area_remitente, estatus);
CREATE INDEX idx_remitente_nombre ON cat_remitente(nombre_completo);

COMMENT ON TABLE cat_remitente IS 'Remitentes externos con trazabilidad de institución';

-- ============================================================================
-- PASO 4: USUARIOS Y AUTENTICACIÓN
-- ============================================================================

-- Tabla: Usuarios (Integrada con Supabase Auth)
CREATE TABLE tbl_usuarios (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clave_servidor_publico VARCHAR(50) UNIQUE,
    curp VARCHAR(18) UNIQUE,
    nombre_completo VARCHAR(200) NOT NULL,

    -- Relaciones
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_rol UUID REFERENCES cat_roles(id_rol) NOT NULL,

    -- Contacto
    correo_institucional VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    extension VARCHAR(10),

    -- Estado
    estatus VARCHAR(20) DEFAULT 'Activo', -- Activo, Inactivo, Bloqueado, Baja
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    ultimo_acceso TIMESTAMPTZ,

    -- Metadata flexible
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_usuario_ua ON tbl_usuarios(id_ua);
CREATE INDEX idx_usuario_rol ON tbl_usuarios(id_rol);
CREATE INDEX idx_usuario_curp ON tbl_usuarios(curp);
CREATE INDEX idx_usuario_estatus ON tbl_usuarios(estatus);

COMMENT ON TABLE tbl_usuarios IS 'Usuarios del sistema integrados con Supabase Auth';

-- Tabla: Sesiones (Control de accesos)
CREATE TABLE tbl_sesiones (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    ip_address VARCHAR(45), -- Soporta IPv6
    user_agent TEXT,
    fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    activa BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sesion_usuario ON tbl_sesiones(id_usuario, fecha_inicio DESC);
CREATE INDEX idx_sesion_activa ON tbl_sesiones(activa, fecha_inicio DESC);

-- ============================================================================
-- PASO 5: DOCUMENTOS ENTRANTES
-- ============================================================================

-- Tabla: Documentos Entrantes
CREATE TABLE tbl_documento_entrante (
    id_doc_entrante UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Folios
    folio_interno VARCHAR(50) UNIQUE,
    numero_oficio_externo VARCHAR(100),
    folio_externo VARCHAR(50),

    -- Datos del documento
    asunto TEXT NOT NULL,
    observaciones TEXT,
    numero_fojas VARCHAR(25), -- Número de hojas del documento físico

    -- Fechas
    fecha_documento DATE,
    fecha_recepcion TIMESTAMPTZ NOT NULL,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),

    -- Archivo digital (Supabase Storage)
    storage_path TEXT,
    bucket_name VARCHAR(100) DEFAULT 'documentos-entrantes',
    nombre_archivo VARCHAR(255),
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    hash_archivo VARCHAR(64), -- SHA-256 para integridad

    -- OCR y búsqueda
    contenido_ocr TEXT,
    metadatos_ocr JSONB,
    confianza_ocr NUMERIC(3, 2),
    ts_contenido_ocr TSVECTOR,

    -- Clasificación (Referencias a cat_valores_catalogo)
    id_prioridad UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_tipo_doc UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_tipo_asunto UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),

    -- Remitente
    id_remitente UUID REFERENCES cat_remitente(id_remitente),

    -- Destino
    id_ua_destinataria UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,

    -- Control
    marca_seguimiento VARCHAR(20) DEFAULT 'Normal', -- Normal, Especial
    estatus_general VARCHAR(20) DEFAULT 'Registrado', -- Registrado, Turnado, En Proceso, Concluido, Cancelado

    -- Registro
    id_usuario_registro UUID REFERENCES tbl_usuarios(id_usuario),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_entrante_folio ON tbl_documento_entrante(folio_interno);
CREATE INDEX idx_doc_entrante_ua ON tbl_documento_entrante(id_ua_destinataria);
CREATE INDEX idx_doc_entrante_fecha ON tbl_documento_entrante(fecha_recepcion DESC);
CREATE INDEX idx_doc_entrante_estatus ON tbl_documento_entrante(estatus_general);
CREATE INDEX idx_doc_entrante_fts ON tbl_documento_entrante USING GIN(ts_contenido_ocr);
CREATE INDEX idx_doc_entrante_remitente ON tbl_documento_entrante(id_remitente);

COMMENT ON TABLE tbl_documento_entrante IS 'Documentos oficiales recibidos por la institución';
COMMENT ON COLUMN tbl_documento_entrante.hash_archivo IS 'SHA-256 del archivo para verificar integridad y detectar duplicados';

-- Tabla: Anexos de Documentos Entrantes
CREATE TABLE tbl_anexos (
    id_anexo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,

    nombre_archivo VARCHAR(255) NOT NULL,
    descripcion TEXT,

    -- Storage
    storage_path TEXT NOT NULL,
    bucket_name VARCHAR(100) DEFAULT 'documentos-entrantes',
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    hash_archivo VARCHAR(64),

    -- Control
    fecha_carga TIMESTAMPTZ DEFAULT NOW(),
    cargado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX idx_anexo_doc ON tbl_anexos(id_doc_entrante);

COMMENT ON TABLE tbl_anexos IS 'Archivos adicionales adjuntos a documentos entrantes';

-- ============================================================================
-- PASO 6: TURNADO Y SEGUIMIENTO
-- ============================================================================

-- Tabla: Turnados
CREATE TABLE tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,

    -- Origen
    id_ua_origen UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_turno UUID REFERENCES tbl_usuarios(id_usuario),

    -- Destino
    id_ua_destino UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,

    -- Instrucciones
    instruccion TEXT NOT NULL,

    -- Vencimiento
    fecha_turnado TIMESTAMPTZ DEFAULT NOW(),
    dias_atencion SMALLINT NOT NULL DEFAULT 3,
    fecha_vencimiento TIMESTAMPTZ NOT NULL,

    -- Seguimiento
    porcentaje_avance NUMERIC(3, 0) DEFAULT 0 CHECK (porcentaje_avance BETWEEN 0 AND 100),
    estatus_turnado VARCHAR(20) DEFAULT 'Turnado', -- Turnado, En Proceso, Rechazado, Concluido

    -- Control
    revisado BOOLEAN DEFAULT FALSE,
    observacion_rechazo TEXT,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turnado_doc ON tbl_turnado(id_doc_entrante);
CREATE INDEX idx_turnado_ua_dest ON tbl_turnado(id_ua_destino, estatus_turnado);
CREATE INDEX idx_turnado_vencimiento ON tbl_turnado(fecha_vencimiento);
CREATE INDEX idx_turnado_revisado ON tbl_turnado(revisado, fecha_turnado DESC);

COMMENT ON TABLE tbl_turnado IS 'Distribución interna de documentos entre unidades administrativas';

-- ============================================================================
-- PASO 7: DOCUMENTOS SALIENTES
-- ============================================================================

-- Tabla: Documentos Salientes (Respuestas)
CREATE TABLE tbl_documento_saliente (
    id_doc_saliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Tipo y folio
    tipo_doc VARCHAR(50) NOT NULL, -- Oficio, Circular, Memorándum
    numero_folio VARCHAR(100) UNIQUE NOT NULL,
    ejercicio_fiscal INT NOT NULL,

    -- Contenido
    asunto TEXT NOT NULL,
    contenido TEXT,

    -- Destinatario
    destinatario_nombre VARCHAR(200),
    destinatario_cargo VARCHAR(150),
    id_remitente_destino UUID REFERENCES cat_remitente(id_remitente),

    -- Origen
    id_ua_emisora UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_elabora UUID REFERENCES tbl_usuarios(id_usuario),

    -- Relación con documento entrante (respuesta)
    id_doc_entrante_ref UUID REFERENCES tbl_documento_entrante(id_doc_entrante),

    -- Archivo generado
    storage_path TEXT,
    bucket_name VARCHAR(100) DEFAULT 'documentos-salientes',
    hash_archivo VARCHAR(64),

    -- Control
    estatus_saliente VARCHAR(20) DEFAULT 'Borrador', -- Borrador, Revisión, Firmado, Enviado
    fecha_elaboracion TIMESTAMPTZ DEFAULT NOW(),
    fecha_envio TIMESTAMPTZ,
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_saliente_ua ON tbl_documento_saliente(id_ua_emisora);
CREATE INDEX idx_doc_saliente_folio ON tbl_documento_saliente(numero_folio);
CREATE INDEX idx_doc_saliente_ref ON tbl_documento_saliente(id_doc_entrante_ref);
CREATE INDEX idx_doc_saliente_estatus ON tbl_documento_saliente(estatus_saliente);

COMMENT ON TABLE tbl_documento_saliente IS 'Documentos oficiales generados y enviados por la institución';

-- ============================================================================
-- PASO 8: NOTIFICACIONES
-- ============================================================================

-- Tabla: Notificaciones
CREATE TABLE tbl_notificaciones (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,

    tipo_notificacion VARCHAR(50) NOT NULL, -- turnado, vencimiento, respuesta, sistema
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,

    -- Referencia opcional (puede ser documento, turnado, etc)
    referencia_tipo VARCHAR(50),
    referencia_id UUID,

    leida BOOLEAN DEFAULT FALSE,
    fecha_leida TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON tbl_notificaciones(id_usuario, leida, fecha_creacion DESC);
CREATE INDEX idx_notif_tipo ON tbl_notificaciones(tipo_notificacion);

COMMENT ON TABLE tbl_notificaciones IS 'Sistema de notificaciones en tiempo real para usuarios';

-- ============================================================================
-- PASO 9: INVENTARIO
-- ============================================================================

-- Tabla: Inventario de Bienes
CREATE TABLE tbl_inventario (
    id_inventario UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Clasificación
    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),

    -- Descripción
    descripcion TEXT NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),

    -- Cantidades
    cantidad INT NOT NULL DEFAULT 1,
    unidad VARCHAR(50) NOT NULL DEFAULT 'Pieza',

    -- Estado
    estado VARCHAR(20) NOT NULL, -- Excelente, Bueno, Regular, Malo, Baja

    -- Ubicación
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    ubicacion_fisica TEXT NOT NULL,
    responsable VARCHAR(200) NOT NULL,

    -- Control patrimonial
    numero_inventario VARCHAR(50) UNIQUE NOT NULL,
    numero_factura VARCHAR(100),

    -- Valores
    fecha_adquisicion DATE NOT NULL,
    valor_unitario NUMERIC(12,2) NOT NULL,
    valor_total NUMERIC(12,2) NOT NULL,
    proveedor VARCHAR(200),

    -- Imágenes (Supabase Storage)
    imagen_storage_path TEXT,
    bucket_name VARCHAR(100) DEFAULT 'inventario',

    -- Metadata adicional (flexible)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Control
    estatus BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventario_ua ON tbl_inventario(id_ua);
CREATE INDEX idx_inventario_categoria ON tbl_inventario(categoria);
CREATE INDEX idx_inventario_estado ON tbl_inventario(estado);
CREATE INDEX idx_inventario_numero ON tbl_inventario(numero_inventario);
CREATE INDEX idx_inventario_responsable ON tbl_inventario(responsable);

COMMENT ON TABLE tbl_inventario IS 'Control de bienes muebles y activos fijos de la institución';

-- ============================================================================
-- PASO 10: AUDITORÍA
-- ============================================================================

-- Tabla: Log de Auditoría
CREATE TABLE tbl_log_auditoria (
    id_log BIGSERIAL PRIMARY KEY,
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),

    modulo VARCHAR(50) NOT NULL, -- documentos, inventario, usuarios, etc
    accion VARCHAR(50) NOT NULL, -- crear, leer, actualizar, eliminar
    descripcion TEXT,

    -- Datos del cambio
    tabla_afectada VARCHAR(100),
    registro_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,

    -- Metadata
    ip_address VARCHAR(45),
    user_agent TEXT,

    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auditoria_fecha ON tbl_log_auditoria(fecha_hora DESC);
CREATE INDEX idx_auditoria_usuario ON tbl_log_auditoria(id_usuario, fecha_hora DESC);
CREATE INDEX idx_auditoria_modulo ON tbl_log_auditoria(modulo, fecha_hora DESC);
CREATE INDEX idx_auditoria_tabla ON tbl_log_auditoria(tabla_afectada, registro_id);

COMMENT ON TABLE tbl_log_auditoria IS 'Registro completo de todas las operaciones en el sistema para cumplimiento normativo';

-- ============================================================================
-- PASO 11: FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función: Calcular fecha de vencimiento (excluyendo días inhábiles)
CREATE OR REPLACE FUNCTION calcular_fecha_vencimiento(
    p_fecha_inicio TIMESTAMPTZ,
    p_dias_habiles INT
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_fecha_actual DATE;
    v_dias_contados INT := 0;
BEGIN
    v_fecha_actual := p_fecha_inicio::DATE;

    WHILE v_dias_contados < p_dias_habiles LOOP
        v_fecha_actual := v_fecha_actual + INTERVAL '1 day';

        -- Verificar que no sea fin de semana ni día inhábil
        IF EXTRACT(DOW FROM v_fecha_actual) NOT IN (0, 6) -- No domingo (0) ni sábado (6)
           AND NOT EXISTS (
               SELECT 1 FROM cat_diasinhabiles
               WHERE fecha = v_fecha_actual AND estatus = TRUE
           ) THEN
            v_dias_contados := v_dias_contados + 1;
        END IF;
    END LOOP;

    RETURN v_fecha_actual::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_fecha_vencimiento IS 'Calcula fecha de vencimiento excluyendo sábados, domingos y días festivos';

-- Trigger: Actualizar tsvector para Full-Text Search
CREATE OR REPLACE FUNCTION actualizar_ts_contenido_ocr()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ts_contenido_ocr := to_tsvector('spanish_unaccent',
        COALESCE(NEW.contenido_ocr, '') || ' ' ||
        COALESCE(NEW.asunto, '') || ' ' ||
        COALESCE(NEW.numero_oficio_externo, '') || ' ' ||
        COALESCE(NEW.folio_externo, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_ts_ocr
    BEFORE INSERT OR UPDATE OF contenido_ocr, asunto, numero_oficio_externo, folio_externo
    ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION actualizar_ts_contenido_ocr();

-- Trigger: Generar folio interno automático
CREATE OR REPLACE FUNCTION generar_folio_interno()
RETURNS TRIGGER AS $$
DECLARE
    v_contador INT;
    v_anio INT;
    v_codigo_ua VARCHAR(20);
BEGIN
    IF NEW.folio_interno IS NULL THEN
        v_anio := EXTRACT(YEAR FROM NEW.fecha_recepcion);

        -- Obtener código de UA
        SELECT codigo_ua INTO v_codigo_ua
        FROM cat_unidad_administrativa
        WHERE id_ua = NEW.id_ua_destinataria;

        -- Contar documentos del año en esa UA
        SELECT COUNT(*) + 1 INTO v_contador
        FROM tbl_documento_entrante
        WHERE EXTRACT(YEAR FROM fecha_recepcion) = v_anio
        AND id_ua_destinataria = NEW.id_ua_destinataria;

        -- Formato: ENT-[CODIGO_UA]-[AÑO]-[NUMERO]
        NEW.folio_interno := 'ENT-' ||
                            COALESCE(v_codigo_ua, 'GEN') || '-' ||
                            v_anio || '-' ||
                            LPAD(v_contador::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_folio
    BEFORE INSERT ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION generar_folio_interno();

-- Trigger: Calcular fecha de vencimiento automáticamente
CREATE OR REPLACE FUNCTION auto_calcular_vencimiento()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_vencimiento IS NULL OR NEW.fecha_vencimiento = NEW.fecha_turnado THEN
        NEW.fecha_vencimiento := calcular_fecha_vencimiento(
            NEW.fecha_turnado,
            NEW.dias_atencion
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_vencimiento
    BEFORE INSERT OR UPDATE OF dias_atencion, fecha_turnado
    ON tbl_turnado
    FOR EACH ROW EXECUTE FUNCTION auto_calcular_vencimiento();

-- Trigger: Actualizar fecha_actualizacion
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

CREATE TRIGGER trg_update_turnado
    BEFORE UPDATE ON tbl_turnado
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

CREATE TRIGGER trg_update_usuario
    BEFORE UPDATE ON tbl_usuarios
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

CREATE TRIGGER trg_update_inventario
    BEFORE UPDATE ON tbl_inventario
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

-- Función: Búsqueda Full-Text optimizada
CREATE OR REPLACE FUNCTION search_documentos(
    p_query TEXT,
    p_id_ua UUID DEFAULT NULL,
    p_estatus VARCHAR DEFAULT NULL,
    p_fecha_inicio DATE DEFAULT NULL,
    p_fecha_fin DATE DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id_doc_entrante UUID,
    folio_interno VARCHAR,
    asunto TEXT,
    fecha_recepcion TIMESTAMPTZ,
    estatus_general VARCHAR,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id_doc_entrante,
        d.folio_interno,
        d.asunto,
        d.fecha_recepcion,
        d.estatus_general,
        ts_rank(d.ts_contenido_ocr, websearch_to_tsquery('spanish_unaccent', p_query)) AS rank
    FROM tbl_documento_entrante d
    WHERE d.ts_contenido_ocr @@ websearch_to_tsquery('spanish_unaccent', p_query)
    AND (p_id_ua IS NULL OR d.id_ua_destinataria = p_id_ua)
    AND (p_estatus IS NULL OR d.estatus_general = p_estatus)
    AND (p_fecha_inicio IS NULL OR d.fecha_recepcion::DATE >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR d.fecha_recepcion::DATE <= p_fecha_fin)
    ORDER BY rank DESC, d.fecha_recepcion DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION search_documentos IS 'Búsqueda full-text de documentos con filtros avanzados';

-- ============================================================================
-- PASO 12: DATOS INICIALES
-- ============================================================================

-- Roles del sistema
INSERT INTO cat_roles (nombre_rol, descripcion, permisos) VALUES
('Administrador General', 'Acceso completo al sistema',
 '{"modulos":["admin","documentos","inventario","reportes","usuarios"],"acciones":["crear","leer","actualizar","eliminar"]}'::jsonb),
('Administrador UA', 'Administrador de Unidad Administrativa',
 '{"modulos":["documentos","inventario","usuarios","reportes"],"acciones":["crear","leer","actualizar","eliminar"]}'::jsonb),
('Recepción', 'Captura de documentos entrantes',
 '{"modulos":["documentos"],"acciones":["crear","leer"]}'::jsonb),
('Titular Nivel 1', 'Turnado y firma de documentos',
 '{"modulos":["documentos","turnado","firma"],"acciones":["crear","leer","actualizar"]}'::jsonb),
('Analista', 'Seguimiento y avance de turnados',
 '{"modulos":["documentos","seguimiento"],"acciones":["leer","actualizar"]}'::jsonb),
('Visor', 'Solo consulta de documentos',
 '{"modulos":["consultas"],"acciones":["leer"]}'::jsonb);

-- Valores de catálogos
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, codigo, orden, es_modificable) VALUES
-- Prioridades
('Prioridad', 'Baja', 'BAJA', 1, FALSE),
('Prioridad', 'Normal', 'NORMAL', 2, FALSE),
('Prioridad', 'Alta', 'ALTA', 3, FALSE),
('Prioridad', 'Urgente', 'URGENTE', 4, FALSE),

-- Tipos de Documento
('Tipo_Documento', 'Oficio', 'OFICIO', 1, FALSE),
('Tipo_Documento', 'Circular', 'CIRCULAR', 2, FALSE),
('Tipo_Documento', 'Memorándum', 'MEMO', 3, FALSE),
('Tipo_Documento', 'Nota Informativa', 'NOTA', 4, FALSE),
('Tipo_Documento', 'Acuerdo', 'ACUERDO', 5, FALSE),
('Tipo_Documento', 'Convenio', 'CONVENIO', 6, FALSE),

-- Tipos de Asunto
('Tipo_Asunto', 'Administrativo', 'ADM', 1, TRUE),
('Tipo_Asunto', 'Técnico', 'TEC', 2, TRUE),
('Tipo_Asunto', 'Jurídico', 'JUR', 3, TRUE),
('Tipo_Asunto', 'Financiero', 'FIN', 4, TRUE),
('Tipo_Asunto', 'Recursos Humanos', 'RH', 5, TRUE),

-- Áreas Remitentes
('Area_Remitente', 'Secretaría de Hacienda', 'SHCP', 1, TRUE),
('Area_Remitente', 'Secretaría de Economía', 'SE', 2, TRUE),
('Area_Remitente', 'Secretaría de Gobernación', 'SEGOB', 3, TRUE);

-- Áreas de Remitentes Externos
INSERT INTO cat_area_remitente (nombre_area, tipo) VALUES
('Gobierno Federal', 'Gobierno'),
('Poder Legislativo', 'Gobierno'),
('Poder Judicial', 'Gobierno'),
('Gobierno Estatal', 'Gobierno'),
('Organismos Autónomos', 'Gobierno'),
('Organizaciones Civiles', 'Sociedad Civil'),
('Sector Privado', 'Privado'),
('Ciudadanos', 'Particular');

-- Días inhábiles 2025 (festivos oficiales México)
INSERT INTO cat_diasinhabiles (fecha, descripcion, tipo) VALUES
('2025-01-01', 'Año Nuevo', 'festivo'),
('2025-02-03', 'Día de la Constitución', 'festivo'),
('2025-03-17', 'Natalicio de Benito Juárez', 'festivo'),
('2025-04-17', 'Jueves Santo', 'festivo'),
('2025-04-18', 'Viernes Santo', 'festivo'),
('2025-05-01', 'Día del Trabajo', 'festivo'),
('2025-09-16', 'Día de la Independencia', 'festivo'),
('2025-11-17', 'Revolución Mexicana', 'festivo'),
('2025-12-25', 'Navidad', 'festivo');

-- Estructura organizacional ejemplo
DO $$
DECLARE
    v_ss1 UUID;
    v_ss2 UUID;
    v_dg1 UUID;
    v_dg2 UUID;
BEGIN
    -- Nivel 1: Subsecretarías
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, abreviatura, direccion, telefono, puede_turnar)
    VALUES ('Subsecretaría de Gestión Documental', 'SS-GD', 1, 'SSGD', 'Av. Insurgentes Sur 1234, CDMX', '55-1234-5678', TRUE)
    RETURNING id_ua INTO v_ss1;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, abreviatura, direccion, telefono, puede_turnar)
    VALUES ('Coordinación General de Administración', 'CG-ADM', 1, 'CGADM', 'Paseo de la Reforma 567, CDMX', '55-2345-6789', TRUE)
    RETURNING id_ua INTO v_ss2;

    -- Nivel 2: Direcciones Generales
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, abreviatura, direccion, puede_turnar)
    VALUES ('Dirección General de Tecnologías de la Información', 'DG-TI', 2, v_ss1, 'DGTI', 'Eje Central Lázaro Cárdenas 100', TRUE)
    RETURNING id_ua INTO v_dg1;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, abreviatura, direccion, puede_turnar)
    VALUES ('Dirección General de Recursos Materiales', 'DG-RM', 2, v_ss2, 'DGRM', 'Av. Universidad 3000', TRUE)
    RETURNING id_ua INTO v_dg2;

    -- Nivel 3: Direcciones de Área
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, abreviatura, puede_turnar) VALUES
    ('Dirección de Sistemas', 'DIR-SIS', 3, v_dg1, 'DSIS', TRUE),
    ('Dirección de Infraestructura', 'DIR-INF', 3, v_dg1, 'DINF', TRUE),
    ('Dirección de Adquisiciones', 'DIR-ADQ', 3, v_dg2, 'DADQ', TRUE),
    ('Dirección de Servicios Generales', 'DIR-SG', 3, v_dg2, 'DSG', TRUE);
END $$;

-- ============================================================================
-- PASO 13: VERIFICACIÓN FINAL
-- ============================================================================

SELECT
    '✅ ESQUEMA HÍBRIDO OPTIMIZADO CREADO EXITOSAMENTE' as estado,
    (SELECT COUNT(*) FROM cat_roles) as roles,
    (SELECT COUNT(*) FROM cat_valores_catalogo) as catalogos,
    (SELECT COUNT(*) FROM cat_unidad_administrativa) as unidades_administrativas,
    (SELECT COUNT(*) FROM cat_area_remitente) as areas_remitentes,
    (SELECT COUNT(*) FROM cat_diasinhabiles) as dias_inhabiles,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tablas_totales;

-- Verificar funciones creadas
SELECT
    '✅ Funciones y triggers configurados' as estado,
    COUNT(*) as total_funciones
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('calcular_fecha_vencimiento', 'generar_folio_interno', 'actualizar_ts_contenido_ocr', 'search_documentos');
