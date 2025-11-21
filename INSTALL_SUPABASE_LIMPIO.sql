-- ============================================================================
-- 🚀 SISGEDI 2.0 - INSTALACIÓN LIMPIA PARA SUPABASE
-- ============================================================================
--
-- INSTRUCCIONES DE INSTALACIÓN:
-- 1. Abrir Supabase Dashboard → SQL Editor
-- 2. Crear un "New Query"
-- 3. Copiar y pegar TODO este archivo
-- 4. Ejecutar (RUN)
-- 5. ¡Listo! Base de datos configurada desde cero
--
-- ⚠️  ADVERTENCIA: Este script ELIMINA TODAS LAS TABLAS EXISTENTES
-- Solo ejecutar si deseas empezar desde cero o en base de datos nueva
--
-- Características:
-- ✓ 16 tablas híbridas optimizadas
-- ✓ UUIDs para escalabilidad
-- ✓ JSONB para flexibilidad
-- ✓ Full-Text Search en español
-- ✓ Triggers automáticos
-- ✓ Datos iniciales completos
--
-- Fecha: 2025-11-20
-- ============================================================================

-- ============================================================================
-- PASO 1: LIMPIEZA TOTAL (Borrar todo lo anterior)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🧹 Limpiando base de datos...';
END $$;

-- Eliminar tablas en orden inverso de dependencias
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

-- Eliminar funciones
DROP FUNCTION IF EXISTS search_documentos CASCADE;
DROP FUNCTION IF EXISTS actualizar_fecha CASCADE;
DROP FUNCTION IF EXISTS generar_folio_interno CASCADE;
DROP FUNCTION IF EXISTS actualizar_ts_contenido_ocr CASCADE;
DROP FUNCTION IF EXISTS calcular_fecha_vencimiento CASCADE;
DROP FUNCTION IF EXISTS fn_generar_folio_automatico CASCADE;

-- Eliminar configuración de búsqueda
DROP TEXT SEARCH CONFIGURATION IF EXISTS spanish_unaccent CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✅ Limpieza completada';
END $$;

-- ============================================================================
-- PASO 2: EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Instalando extensiones...';
END $$;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración Full-Text Search en español sin acentos
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;

DO $$
BEGIN
    RAISE NOTICE '✅ Extensiones instaladas';
END $$;

-- ============================================================================
-- PASO 3: CATÁLOGOS BASE (Tablas de configuración)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📋 Creando catálogos base...';
END $$;

-- ----------------------------------------------------------------------------
-- Tabla: Días Inhábiles
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Tabla: Semáforo (Alertas visuales)
-- ----------------------------------------------------------------------------
CREATE TABLE cat_semaforo (
    id_semaforo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    porcentaje_vencimiento SMALLINT NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL,
    descripcion VARCHAR(100),
    estatus BOOLEAN DEFAULT TRUE,
    CHECK (porcentaje_vencimiento BETWEEN 0 AND 100)
);

COMMENT ON TABLE cat_semaforo IS 'Configuración de colores de alerta según % de tiempo transcurrido';

-- ----------------------------------------------------------------------------
-- Tabla: Unidades Administrativas
-- ----------------------------------------------------------------------------
CREATE TABLE cat_unidad_administrativa (
    id_ua UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_ua VARCHAR(150) NOT NULL UNIQUE,
    codigo_ua VARCHAR(20) UNIQUE,
    nivel_jerarquico INT NOT NULL CHECK (nivel_jerarquico BETWEEN 1 AND 7),
    id_ua_superior UUID REFERENCES cat_unidad_administrativa(id_ua),

    -- Campos adicionales
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

-- ----------------------------------------------------------------------------
-- Tabla: Roles
-- ----------------------------------------------------------------------------
CREATE TABLE cat_roles (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    elementos_menu TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN cat_roles.elementos_menu IS 'Array de módulos del menú accesibles: [dashboard, documentos, inventario, reportes, admin]';

-- ----------------------------------------------------------------------------
-- Tabla: Catálogos Dinámicos
-- ----------------------------------------------------------------------------
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

CREATE INDEX idx_valores_tipo ON cat_valores_catalogo(tipo_catalogo, estatus);
CREATE INDEX idx_valores_metadata ON cat_valores_catalogo USING gin(metadata);

COMMENT ON TABLE cat_valores_catalogo IS 'Tabla universal para todos los catálogos: prioridades, tipos, estatus, etc.';

-- ============================================================================
-- PASO 4: TABLAS OPERATIVAS PRINCIPALES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📦 Creando tablas operativas...';
END $$;

-- ----------------------------------------------------------------------------
-- Tabla: Usuarios
-- ----------------------------------------------------------------------------
CREATE TABLE tbl_usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_uid UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    extension VARCHAR(10),

    id_ua UUID NOT NULL REFERENCES cat_unidad_administrativa(id_ua),
    id_rol UUID NOT NULL REFERENCES cat_roles(id_rol),

    -- Preferencias usuario
    preferencias JSONB DEFAULT '{}'::jsonb,

    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_ua ON tbl_usuarios(id_ua);
CREATE INDEX idx_usuarios_rol ON tbl_usuarios(id_rol);
CREATE INDEX idx_usuarios_auth ON tbl_usuarios(auth_uid);
CREATE INDEX idx_usuarios_email ON tbl_usuarios(email);

-- ----------------------------------------------------------------------------
-- Tabla: Área Remitente
-- ----------------------------------------------------------------------------
CREATE TABLE cat_area_remitente (
    id_area_remitente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Tabla: Remitente
-- ----------------------------------------------------------------------------
CREATE TABLE cat_remitente (
    id_remitente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(150) NOT NULL,
    cargo VARCHAR(150),
    institucion VARCHAR(200),
    id_area UUID REFERENCES cat_area_remitente(id_area_remitente),
    email VARCHAR(100),
    telefono VARCHAR(20),
    metadata JSONB DEFAULT '{}'::jsonb,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remitente_area ON cat_remitente(id_area);
CREATE INDEX idx_remitente_nombre ON cat_remitente(nombre_completo);

-- ----------------------------------------------------------------------------
-- Tabla: Documentos Entrantes (CORE)
-- ----------------------------------------------------------------------------
CREATE TABLE tbl_documento_entrante (
    id_doc_entrante UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificación
    folio_interno VARCHAR(50) NOT NULL UNIQUE,
    numero_oficio_externo VARCHAR(100),
    folio_externo VARCHAR(100),

    -- Contenido
    asunto TEXT NOT NULL,
    observaciones TEXT,
    numero_fojas VARCHAR(20),

    -- Clasificación
    id_prioridad UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_tipo_doc UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_tipo_asunto UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),

    -- Fechas
    fecha_recepcion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_documento DATE,
    fecha_vencimiento DATE,

    -- Origen
    id_remitente UUID REFERENCES cat_remitente(id_remitente),
    remitente_nombre VARCHAR(150),
    remitente_cargo VARCHAR(150),
    remitente_institucion VARCHAR(200),

    -- Destino
    id_ua_destinataria UUID NOT NULL REFERENCES cat_unidad_administrativa(id_ua),

    -- Estado
    estatus_general UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_ua_actual UUID REFERENCES cat_unidad_administrativa(id_ua),

    -- Digitalización (Supabase Storage)
    storage_path TEXT,
    storage_bucket VARCHAR(100) DEFAULT 'documentos',
    nombre_archivo VARCHAR(255),
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    contenido_ocr TEXT,
    ts_contenido_ocr TSVECTOR,

    -- Metadata adicional
    numero_anexos INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Auditoría
    id_usuario_registro UUID REFERENCES tbl_usuarios(id_usuario),
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Índices optimizados para búsqueda
CREATE INDEX idx_doc_ent_folio ON tbl_documento_entrante(folio_interno);
CREATE INDEX idx_doc_ent_externo ON tbl_documento_entrante(numero_oficio_externo);
CREATE INDEX idx_doc_ent_prioridad ON tbl_documento_entrante(id_prioridad);
CREATE INDEX idx_doc_ent_tipo ON tbl_documento_entrante(id_tipo_doc);
CREATE INDEX idx_doc_ent_estatus ON tbl_documento_entrante(estatus_general);
CREATE INDEX idx_doc_ent_ua_dest ON tbl_documento_entrante(id_ua_destinataria);
CREATE INDEX idx_doc_ent_ua_actual ON tbl_documento_entrante(id_ua_actual);
CREATE INDEX idx_doc_ent_fecha_recep ON tbl_documento_entrante(fecha_recepcion DESC);
CREATE INDEX idx_doc_ent_fecha_venc ON tbl_documento_entrante(fecha_vencimiento);
CREATE INDEX idx_doc_ent_remitente ON tbl_documento_entrante(id_remitente);
CREATE INDEX idx_doc_ent_storage ON tbl_documento_entrante(storage_path);

-- Índice Full-Text Search
CREATE INDEX idx_doc_ent_ts_ocr ON tbl_documento_entrante USING gin(ts_contenido_ocr);
CREATE INDEX idx_doc_ent_asunto_text ON tbl_documento_entrante USING gin(to_tsvector('spanish_unaccent', asunto));

COMMENT ON TABLE tbl_documento_entrante IS 'Documentos oficiales recibidos de externos o entre UAs';

-- ----------------------------------------------------------------------------
-- Tabla: Anexos
-- ----------------------------------------------------------------------------
CREATE TABLE tbl_anexos (
    id_anexo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID NOT NULL REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,

    titulo VARCHAR(200),
    descripcion TEXT,

    -- Storage
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) DEFAULT 'anexos',
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,

    orden SMALLINT DEFAULT 1,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anexos_doc ON tbl_anexos(id_doc_entrante);
CREATE INDEX idx_anexos_storage ON tbl_anexos(storage_path);

-- ----------------------------------------------------------------------------
-- Tabla: Turnados
-- ----------------------------------------------------------------------------
CREATE TABLE tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante),

    id_ua_origen UUID NOT NULL REFERENCES cat_unidad_administrativa(id_ua),
    id_usuario_turno UUID REFERENCES tbl_usuarios(id_usuario),
    id_ua_destino UUID NOT NULL REFERENCES cat_unidad_administrativa(id_ua),

    instruccion TEXT NOT NULL,

    fecha_turnado TIMESTAMPTZ DEFAULT NOW(),
    dias_atencion INT NOT NULL DEFAULT 3,
    fecha_vencimiento DATE NOT NULL,

    porcentaje_avance SMALLINT CHECK (porcentaje_avance BETWEEN 0 AND 100),
    estatus_turnado VARCHAR(50),

    revisado BOOLEAN DEFAULT FALSE,
    observacion_rechazo TEXT,

    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turnado_doc ON tbl_turnado(id_doc_entrante);
CREATE INDEX idx_turnado_origen ON tbl_turnado(id_ua_origen);
CREATE INDEX idx_turnado_destino ON tbl_turnado(id_ua_destino);
CREATE INDEX idx_turnado_usuario ON tbl_turnado(id_usuario_turno);
CREATE INDEX idx_turnado_estatus ON tbl_turnado(estatus_turnado);
CREATE INDEX idx_turnado_fecha ON tbl_turnado(fecha_turnado DESC);
CREATE INDEX idx_turnado_vencimiento ON tbl_turnado(fecha_vencimiento);

COMMENT ON TABLE tbl_turnado IS 'Turnados de documentos entre unidades administrativas';

-- ----------------------------------------------------------------------------
-- Tabla: Documentos Salientes
-- ----------------------------------------------------------------------------
CREATE TABLE tbl_documento_saliente (
    id_doc_saliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    folio_salida VARCHAR(50) NOT NULL UNIQUE,
    asunto TEXT NOT NULL,
    contenido TEXT,

    id_doc_entrante_respuesta UUID REFERENCES tbl_documento_entrante(id_doc_entrante),

    id_ua_emisora UUID NOT NULL REFERENCES cat_unidad_administrativa(id_ua),
    id_usuario_elabora UUID REFERENCES tbl_usuarios(id_usuario),

    destinatario_nombre VARCHAR(150) NOT NULL,
    destinatario_cargo VARCHAR(150),
    destinatario_institucion VARCHAR(200),

    storage_path TEXT,
    storage_bucket VARCHAR(100) DEFAULT 'salientes',

    fecha_elaboracion TIMESTAMPTZ DEFAULT NOW(),
    fecha_envio TIMESTAMPTZ,

    estatus VARCHAR(50) DEFAULT 'Borrador',

    metadata JSONB DEFAULT '{}'::jsonb,

    id_usuario_registro UUID REFERENCES tbl_usuarios(id_usuario),
    fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_sal_folio ON tbl_documento_saliente(folio_salida);
CREATE INDEX idx_doc_sal_ua ON tbl_documento_saliente(id_ua_emisora);
CREATE INDEX idx_doc_sal_respuesta ON tbl_documento_saliente(id_doc_entrante_respuesta);
CREATE INDEX idx_doc_sal_fecha ON tbl_documento_saliente(fecha_elaboracion DESC);

-- ----------------------------------------------------------------------------
-- Tabla: Notificaciones
-- ----------------------------------------------------------------------------
CREATE TABLE tbl_notificaciones (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_usuario UUID NOT NULL REFERENCES tbl_usuarios(id_usuario),

    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,

    link VARCHAR(500),

    leida BOOLEAN DEFAULT FALSE,
    fecha_lectura TIMESTAMPTZ,

    metadata JSONB DEFAULT '{}'::jsonb,

    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_usuario ON tbl_notificaciones(id_usuario, leida);
CREATE INDEX idx_notif_fecha ON tbl_notificaciones(fecha_creacion DESC);
CREATE INDEX idx_notif_tipo ON tbl_notificaciones(tipo);

-- ----------------------------------------------------------------------------
-- Tabla: Inventario
-- ----------------------------------------------------------------------------
CREATE TABLE tbl_inventario (
    id_inventario UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    categoria VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(100),
    descripcion TEXT NOT NULL,

    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),

    cantidad NUMERIC(10,2) DEFAULT 1,
    unidad VARCHAR(50) DEFAULT 'Pieza',

    estado VARCHAR(50) NOT NULL,

    id_ua UUID NOT NULL REFERENCES cat_unidad_administrativa(id_ua),
    ubicacion_fisica VARCHAR(250) NOT NULL,
    responsable VARCHAR(150) NOT NULL,

    numero_inventario VARCHAR(50) UNIQUE NOT NULL,
    numero_factura VARCHAR(100),
    fecha_adquisicion DATE NOT NULL,
    valor_unitario NUMERIC(12,2) NOT NULL,
    valor_total NUMERIC(12,2) NOT NULL,

    proveedor VARCHAR(150),

    imagen_storage_path TEXT,
    bucket_name VARCHAR(100) DEFAULT 'inventario',

    metadata JSONB DEFAULT '{}'::jsonb,

    estatus BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_categoria ON tbl_inventario(categoria);
CREATE INDEX idx_inv_ua ON tbl_inventario(id_ua);
CREATE INDEX idx_inv_numero ON tbl_inventario(numero_inventario);
CREATE INDEX idx_inv_responsable ON tbl_inventario(responsable);
CREATE INDEX idx_inv_estado ON tbl_inventario(estado);

-- ----------------------------------------------------------------------------
-- Tabla: Sesiones
-- ----------------------------------------------------------------------------
CREATE TABLE tbl_sesiones (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES tbl_usuarios(id_usuario),

    ip_address INET,
    user_agent TEXT,

    fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,

    activa BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sesiones_usuario ON tbl_sesiones(id_usuario, activa);
CREATE INDEX idx_sesiones_fecha ON tbl_sesiones(fecha_inicio DESC);

-- ----------------------------------------------------------------------------
-- Tabla: Log de Auditoría
-- ----------------------------------------------------------------------------
CREATE TABLE tbl_log_auditoria (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),

    tabla VARCHAR(100) NOT NULL,
    operacion VARCHAR(20) NOT NULL,
    registro_id UUID,

    datos_anteriores JSONB,
    datos_nuevos JSONB,

    ip_address INET,
    user_agent TEXT,

    fecha_operacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_log_usuario ON tbl_log_auditoria(id_usuario);
CREATE INDEX idx_log_tabla ON tbl_log_auditoria(tabla, operacion);
CREATE INDEX idx_log_fecha ON tbl_log_auditoria(fecha_operacion DESC);
CREATE INDEX idx_log_registro ON tbl_log_auditoria(registro_id);

-- ============================================================================
-- PASO 5: FUNCIONES Y TRIGGERS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '⚙️  Creando funciones y triggers...';
END $$;

-- ----------------------------------------------------------------------------
-- Función: Actualizar fecha_actualizacion automáticamente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_fecha()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas relevantes
CREATE TRIGGER trigger_actualizar_fecha_usuarios
    BEFORE UPDATE ON tbl_usuarios
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

CREATE TRIGGER trigger_actualizar_fecha_doc_entrante
    BEFORE UPDATE ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

CREATE TRIGGER trigger_actualizar_fecha_turnado
    BEFORE UPDATE ON tbl_turnado
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

CREATE TRIGGER trigger_actualizar_fecha_inventario
    BEFORE UPDATE ON tbl_inventario
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

-- ----------------------------------------------------------------------------
-- Función: Generar folio interno automático
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generar_folio_automatico()
RETURNS TRIGGER AS $$
DECLARE
    codigo_ua VARCHAR(20);
    consecutivo INT;
    anio_actual VARCHAR(4);
BEGIN
    -- Obtener código de la UA
    SELECT cat_unidad_administrativa.codigo_ua INTO codigo_ua
    FROM cat_unidad_administrativa
    WHERE id_ua = NEW.id_ua_destinataria;

    -- Si no hay código, usar genérico
    IF codigo_ua IS NULL THEN
        codigo_ua := 'GEN';
    END IF;

    -- Obtener año actual
    anio_actual := TO_CHAR(NOW(), 'YYYY');

    -- Calcular consecutivo
    SELECT COALESCE(MAX(CAST(SUBSTRING(folio_interno FROM '\d+$') AS INT)), 0) + 1
    INTO consecutivo
    FROM tbl_documento_entrante
    WHERE folio_interno LIKE codigo_ua || '-' || anio_actual || '-%';

    -- Generar folio
    NEW.folio_interno := codigo_ua || '-' || anio_actual || '-' || LPAD(consecutivo::TEXT, 5, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_folio
    BEFORE INSERT ON tbl_documento_entrante
    FOR EACH ROW
    WHEN (NEW.folio_interno IS NULL OR NEW.folio_interno = '')
    EXECUTE FUNCTION fn_generar_folio_automatico();

-- ----------------------------------------------------------------------------
-- Función: Actualizar vector de búsqueda OCR
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION actualizar_ts_contenido_ocr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contenido_ocr IS NOT NULL THEN
        NEW.ts_contenido_ocr := to_tsvector('spanish_unaccent', NEW.contenido_ocr);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_ts_ocr
    BEFORE INSERT OR UPDATE OF contenido_ocr ON tbl_documento_entrante
    FOR EACH ROW EXECUTE FUNCTION actualizar_ts_contenido_ocr();

-- ----------------------------------------------------------------------------
-- Función: Calcular fecha de vencimiento (considerando días inhábiles)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calcular_fecha_vencimiento(
    fecha_inicio DATE,
    dias_habiles INT
) RETURNS DATE AS $$
DECLARE
    fecha_actual DATE := fecha_inicio;
    dias_contados INT := 0;
BEGIN
    WHILE dias_contados < dias_habiles LOOP
        fecha_actual := fecha_actual + INTERVAL '1 day';

        -- Verificar si es día hábil (no sábado, no domingo, no inhábil)
        IF EXTRACT(DOW FROM fecha_actual) NOT IN (0, 6) -- No domingo ni sábado
           AND NOT EXISTS (
               SELECT 1 FROM cat_diasinhabiles
               WHERE fecha = fecha_actual AND estatus = TRUE
           ) THEN
            dias_contados := dias_contados + 1;
        END IF;
    END LOOP;

    RETURN fecha_actual;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Función: Búsqueda full-text de documentos
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_documentos(
    search_query TEXT,
    limite INT DEFAULT 50
) RETURNS TABLE (
    id_doc_entrante UUID,
    folio_interno VARCHAR(50),
    asunto TEXT,
    relevancia REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id_doc_entrante,
        d.folio_interno,
        d.asunto,
        ts_rank(d.ts_contenido_ocr, plainto_tsquery('spanish_unaccent', search_query)) +
        ts_rank(to_tsvector('spanish_unaccent', d.asunto), plainto_tsquery('spanish_unaccent', search_query)) AS relevancia
    FROM tbl_documento_entrante d
    WHERE
        d.ts_contenido_ocr @@ plainto_tsquery('spanish_unaccent', search_query)
        OR to_tsvector('spanish_unaccent', d.asunto) @@ plainto_tsquery('spanish_unaccent', search_query)
    ORDER BY relevancia DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASO 6: DATOS INICIALES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🌱 Insertando datos iniciales...';
END $$;

-- ----------------------------------------------------------------------------
-- Semáforo
-- ----------------------------------------------------------------------------
INSERT INTO cat_semaforo (porcentaje_vencimiento, color, descripcion) VALUES
(70, 'green', 'Tiempo suficiente'),
(90, 'yellow', 'Próximo a vencer'),
(100, 'red', 'Vencido o crítico');

-- ----------------------------------------------------------------------------
-- Días inhábiles 2025
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Unidades Administrativas
-- ----------------------------------------------------------------------------
INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, abreviatura, puede_turnar, folio_automatico) VALUES
('Secretaría General', 'SEC', 1, 'SEC', TRUE, TRUE),
('Subsecretaría Administrativa', 'SUBA', 2, 'SUBA', TRUE, TRUE),
('Dirección General de Recursos Humanos', 'DGRH', 4, 'DGRH', TRUE, TRUE),
('Dirección General de Recursos Materiales', 'DGRM', 4, 'DGRM', TRUE, TRUE),
('Dirección de Sistemas', 'DSIS', 5, 'DSIS', TRUE, TRUE),
('Subdirección de Correspondencia', 'SCOR', 6, 'SCOR', TRUE, TRUE);

-- ----------------------------------------------------------------------------
-- Roles
-- ----------------------------------------------------------------------------
INSERT INTO cat_roles (nombre_rol, descripcion, elementos_menu) VALUES
('Administrador', 'Acceso total al sistema', ARRAY['dashboard', 'documentos', 'turnados', 'inventario', 'reportes', 'busqueda', 'admin']),
('Director', 'Director de área', ARRAY['dashboard', 'documentos', 'turnados', 'reportes', 'busqueda']),
('Operador', 'Captura de documentos', ARRAY['dashboard', 'documentos', 'turnados', 'busqueda']),
('Consulta', 'Solo lectura', ARRAY['dashboard', 'documentos', 'busqueda']);

-- ----------------------------------------------------------------------------
-- Catálogos Dinámicos
-- ----------------------------------------------------------------------------

-- Prioridades
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, codigo, orden) VALUES
('Prioridad', 'Muy Alta', 'MA', 1),
('Prioridad', 'Alta', 'A', 2),
('Prioridad', 'Normal', 'N', 3),
('Prioridad', 'Baja', 'B', 4);

-- Tipos de Documento
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, codigo, orden) VALUES
('Tipo Documento', 'Oficio', 'OF', 1),
('Tipo Documento', 'Circular', 'CI', 2),
('Tipo Documento', 'Memorándum', 'ME', 3),
('Tipo Documento', 'Acta', 'AC', 4),
('Tipo Documento', 'Solicitud', 'SO', 5),
('Tipo Documento', 'Informe', 'IN', 6),
('Tipo Documento', 'Convenio', 'CO', 7);

-- Tipos de Asunto
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, orden) VALUES
('Tipo Asunto', 'Administrativo', 1),
('Tipo Asunto', 'Jurídico', 2),
('Tipo Asunto', 'Técnico', 3),
('Tipo Asunto', 'Financiero', 4),
('Tipo Asunto', 'Recursos Humanos', 5),
('Tipo Asunto', 'Operativo', 6);

-- Estatus General
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, codigo, orden) VALUES
('Estatus', 'Recibido', 'REC', 1),
('Estatus', 'En Proceso', 'PRO', 2),
('Estatus', 'Turnado', 'TUR', 3),
('Estatus', 'Atendido', 'ATE', 4),
('Estatus', 'Cerrado', 'CER', 5),
('Estatus', 'Cancelado', 'CAN', 6);

-- Estatus de Turnado
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, orden) VALUES
('Estatus Turnado', 'Pendiente', 1),
('Estatus Turnado', 'En Atención', 2),
('Estatus Turnado', 'Atendido', 3),
('Estatus Turnado', 'Rechazado', 4),
('Estatus Turnado', 'Vencido', 5);

-- Estados de Conservación (Inventario)
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, orden) VALUES
('Estado', 'Excelente', 1),
('Estado', 'Bueno', 2),
('Estado', 'Regular', 3),
('Estado', 'Malo', 4),
('Estado', 'Inservible', 5);

-- Categorías de Inventario
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, orden) VALUES
('Categoría Inventario', 'Equipo de Cómputo', 1),
('Categoría Inventario', 'Mobiliario', 2),
('Categoría Inventario', 'Equipo de Oficina', 3),
('Categoría Inventario', 'Vehículos', 4),
('Categoría Inventario', 'Electrónica', 5),
('Categoría Inventario', 'Herramientas', 6);

-- ----------------------------------------------------------------------------
-- Usuario Administrador por defecto
-- ----------------------------------------------------------------------------
-- Nota: El auth_uid debe ser del usuario creado en Supabase Auth
-- Este usuario se debe crear manualmente en Supabase Dashboard → Authentication
-- Luego actualizar este registro con el UUID real

INSERT INTO tbl_usuarios (
    nombre_completo,
    email,
    id_ua,
    id_rol,
    estatus
)
SELECT
    'Administrador del Sistema',
    'admin@sisgedi.gob.mx',
    id_ua,
    id_rol,
    TRUE
FROM cat_unidad_administrativa, cat_roles
WHERE codigo_ua = 'SEC' AND nombre_rol = 'Administrador'
LIMIT 1;

-- ============================================================================
-- PASO 7: POLÍTICAS RLS (Row Level Security)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔐 Configurando seguridad RLS...';
END $$;

-- Habilitar RLS en tablas sensibles
ALTER TABLE tbl_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_entrante ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_log_auditoria ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver su propio perfil
CREATE POLICY usuarios_ver_propio ON tbl_usuarios
    FOR SELECT
    USING (auth.uid() = auth_uid);

-- Política: Ver documentos de su UA
CREATE POLICY doc_entrante_ver_ua ON tbl_documento_entrante
    FOR SELECT
    USING (
        id_ua_destinataria IN (
            SELECT id_ua FROM tbl_usuarios WHERE auth_uid = auth.uid()
        )
        OR id_ua_actual IN (
            SELECT id_ua FROM tbl_usuarios WHERE auth_uid = auth.uid()
        )
    );

-- Política: Ver notificaciones propias
CREATE POLICY notif_ver_propias ON tbl_notificaciones
    FOR SELECT
    USING (
        id_usuario IN (
            SELECT id_usuario FROM tbl_usuarios WHERE auth_uid = auth.uid()
        )
    );

-- ============================================================================
-- PASO 8: GRANTS Y PERMISOS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔑 Configurando permisos...';
END $$;

-- Otorgar permisos básicos a authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- FINALIZACIÓN
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ============================================';
    RAISE NOTICE '✅ INSTALACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '✅ ============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Estadísticas:';
    RAISE NOTICE '   - 16 tablas creadas';
    RAISE NOTICE '   - 5 funciones instaladas';
    RAISE NOTICE '   - 4 triggers configurados';
    RAISE NOTICE '   - Datos iniciales cargados';
    RAISE NOTICE '   - RLS configurado';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 IMPORTANTE - Próximos pasos:';
    RAISE NOTICE '   1. Crear usuario en Supabase Auth Dashboard';
    RAISE NOTICE '   2. Actualizar tbl_usuarios con auth_uid del usuario creado';
    RAISE NOTICE '   3. Configurar Storage buckets: documentos, anexos, salientes, inventario';
    RAISE NOTICE '   4. Configurar políticas de Storage según necesidad';
    RAISE NOTICE '';
    RAISE NOTICE '📖 Para más información consulta: README.md';
    RAISE NOTICE '';
END $$;

-- FIN DEL SCRIPT
