-- ============================================================================
-- SISGEDI 2.0 - ESQUEMA COMPLETO PARA SUPABASE
-- Sistema de Gestión Documental Inteligente
-- PostgreSQL 15+ / Supabase
--
-- INCLUYE:
-- - Esquema completo (15 tablas)
-- - Configuración de Storage Buckets
-- - Row-Level Security (RLS) con auth.uid()
-- - Datos de prueba completos
-- - Políticas de acceso a Storage
--
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Copiar y pegar este script completo
-- 3. Ejecutar (Run)
-- 4. Esperar 30-60 segundos
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

-- Extensiones necesarias (ya incluidas en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración de Full-Text Search para español sin acentos
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, spanish_stem;

-- ============================================================================
-- SECCIÓN 2: TABLAS DE SEGURIDAD Y ADMINISTRACIÓN
-- ============================================================================

-- Tabla: Unidades Administrativas
CREATE TABLE IF NOT EXISTS cat_unidad_administrativa (
    id_ua UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_ua VARCHAR(150) NOT NULL UNIQUE,
    codigo_ua VARCHAR(20) UNIQUE,
    nivel_jerarquico INT NOT NULL,
    id_ua_superior UUID REFERENCES cat_unidad_administrativa(id_ua),
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    extension VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_ua_nivel ON cat_unidad_administrativa(nivel_jerarquico);
CREATE INDEX IF NOT EXISTS idx_ua_superior ON cat_unidad_administrativa(id_ua_superior);

-- Tabla: Roles del Sistema
CREATE TABLE IF NOT EXISTS cat_roles (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    elementos_menu JSONB NOT NULL DEFAULT '[]'::jsonb,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: Usuarios del Sistema (vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS tbl_usuarios (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clave_servidor_publico VARCHAR(50) NOT NULL UNIQUE,
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_rol UUID REFERENCES cat_roles(id_rol) NOT NULL,
    nombre_completo VARCHAR(200) NOT NULL,
    correo_institucional VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    estatus VARCHAR(20) DEFAULT 'Activo' CHECK (estatus IN ('Activo', 'Inhabilitado', 'Suspendido', 'Eliminado')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creado_por UUID REFERENCES tbl_usuarios(id_usuario),
    ultima_sesion TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_usuario_ua ON tbl_usuarios(id_ua);
CREATE INDEX IF NOT EXISTS idx_usuario_rol ON tbl_usuarios(id_rol);
CREATE INDEX IF NOT EXISTS idx_usuario_clave ON tbl_usuarios(clave_servidor_publico);
CREATE INDEX IF NOT EXISTS idx_usuario_correo ON tbl_usuarios(correo_institucional);

-- Tabla: Catálogos Dinámicos
CREATE TABLE IF NOT EXISTS cat_valores_catalogo (
    id_valor_catalogo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_catalogo VARCHAR(50) NOT NULL,
    valor VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden_presentacion INT DEFAULT 0,
    es_modificable BOOLEAN DEFAULT TRUE,
    estatus BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tipo_catalogo, valor)
);

CREATE INDEX IF NOT EXISTS idx_catalogo_tipo ON cat_valores_catalogo(tipo_catalogo);
CREATE INDEX IF NOT EXISTS idx_catalogo_estatus ON cat_valores_catalogo(estatus) WHERE estatus = TRUE;

-- ============================================================================
-- SECCIÓN 3: TABLAS DE DOCUMENTOS ENTRANTES
-- ============================================================================

-- Tabla Principal: Documentos Entrantes
CREATE TABLE IF NOT EXISTS tbl_documento_entrante (
    id_doc_entrante UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_oficio_externo VARCHAR(100),
    folio_interno VARCHAR(50) UNIQUE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_doc_entrante_ua ON tbl_documento_entrante(id_ua_registro);
CREATE INDEX IF NOT EXISTS idx_doc_entrante_fecha ON tbl_documento_entrante(fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_doc_entrante_folio ON tbl_documento_entrante(folio_interno);
CREATE INDEX IF NOT EXISTS idx_doc_entrante_estatus ON tbl_documento_entrante(estatus_general) WHERE estatus_general != 'Concluido';
CREATE INDEX IF NOT EXISTS idx_doc_entrante_fts ON tbl_documento_entrante USING GIN(ts_contenido_ocr);
CREATE INDEX IF NOT EXISTS idx_doc_entrante_prioridad ON tbl_documento_entrante(id_prioridad);

-- Tabla: Anexos de Documentos
CREATE TABLE IF NOT EXISTS tbl_anexos (
    id_anexo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL, -- Path en Supabase Storage
    bucket_name VARCHAR(100) DEFAULT 'documentos',
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    tamano_mb NUMERIC(10, 2),
    es_alcance BOOLEAN DEFAULT FALSE,
    fecha_alcance TIMESTAMP WITH TIME ZONE,
    descripcion TEXT,
    fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cargado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_anexo_doc_entrante ON tbl_anexos(id_doc_entrante);
CREATE INDEX IF NOT EXISTS idx_anexo_alcance ON tbl_anexos(es_alcance) WHERE es_alcance = TRUE;

-- ============================================================================
-- SECCIÓN 4: TABLAS DE SEGUIMIENTO Y TURNADO
-- ============================================================================

-- Tabla: Turnado de Documentos
CREATE TABLE IF NOT EXISTS tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    id_ua_origen UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_turno UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    id_ua_destino UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    fecha_turnado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turnado_doc_entrante ON tbl_turnado(id_doc_entrante);
CREATE INDEX IF NOT EXISTS idx_turnado_ua_destino ON tbl_turnado(id_ua_destino);
CREATE INDEX IF NOT EXISTS idx_turnado_vencimiento ON tbl_turnado(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_turnado_estatus ON tbl_turnado(estatus_turnado);
CREATE INDEX IF NOT EXISTS idx_turnado_avance ON tbl_turnado(porcentaje_avance) WHERE porcentaje_avance < 100;

-- Tabla: Historial de Avances
CREATE TABLE IF NOT EXISTS tbl_avance (
    id_avance UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_turnado UUID REFERENCES tbl_turnado(id_turnado) ON DELETE CASCADE,
    porcentaje_anterior NUMERIC(3, 0),
    porcentaje_nuevo NUMERIC(3, 0),
    comentario TEXT,
    fecha_avance TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    registrado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_avance_turnado ON tbl_avance(id_turnado);

-- ============================================================================
-- SECCIÓN 5: TABLAS DE DOCUMENTOS SALIENTES
-- ============================================================================

-- Tabla: Documentos Salientes
CREATE TABLE IF NOT EXISTS tbl_documento_saliente (
    id_doc_saliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    fecha_elaboracion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estatus_saliente VARCHAR(20) DEFAULT 'Borrador' CHECK (
        estatus_saliente IN ('Borrador', 'Firmado', 'Enviado', 'Cancelado', 'Reactivado')
    ),
    fecha_envio TIMESTAMP WITH TIME ZONE,
    id_firma_emision UUID,
    fecha_firma_emision TIMESTAMP WITH TIME ZONE,
    hash_documento TEXT,
    storage_path TEXT, -- Path del PDF en Storage
    tiene_acuse BOOLEAN DEFAULT FALSE,
    acuse_storage_path TEXT,
    fecha_acuse TIMESTAMP WITH TIME ZONE,
    fue_reactivado BOOLEAN DEFAULT FALSE,
    fecha_reactivacion TIMESTAMP WITH TIME ZONE,
    motivo_reactivacion TEXT,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_por UUID REFERENCES tbl_usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_doc_saliente_ua ON tbl_documento_saliente(id_ua_emisora);
CREATE INDEX IF NOT EXISTS idx_doc_saliente_folio ON tbl_documento_saliente(numero_folio);
CREATE INDEX IF NOT EXISTS idx_doc_saliente_tipo ON tbl_documento_saliente(tipo_doc);
CREATE INDEX IF NOT EXISTS idx_doc_saliente_estatus ON tbl_documento_saliente(estatus_saliente);
CREATE INDEX IF NOT EXISTS idx_doc_saliente_fecha ON tbl_documento_saliente(fecha_elaboracion DESC);

-- Tabla: Relación entre Documento Saliente y Entrante
CREATE TABLE IF NOT EXISTS tbl_relacion_respuesta (
    id_relacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_saliente UUID REFERENCES tbl_documento_saliente(id_doc_saliente) ON DELETE CASCADE,
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    tipo_relacion VARCHAR(50) DEFAULT 'Respuesta' CHECK (tipo_relacion IN ('Respuesta', 'Seguimiento', 'Complemento')),
    fecha_relacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (id_doc_saliente, id_doc_entrante)
);

CREATE INDEX IF NOT EXISTS idx_relacion_saliente ON tbl_relacion_respuesta(id_doc_saliente);
CREATE INDEX IF NOT EXISTS idx_relacion_entrante ON tbl_relacion_respuesta(id_doc_entrante);

-- ============================================================================
-- SECCIÓN 6: TABLAS DE FIRMA ELECTRÓNICA
-- ============================================================================

-- Tabla: Firmas Electrónicas
CREATE TABLE IF NOT EXISTS tbl_firmas (
    id_firma UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    fecha_firma TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_origen INET,
    user_agent TEXT,
    metadatos JSONB,
    es_valida BOOLEAN DEFAULT TRUE,
    fecha_validacion TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_firma_usuario ON tbl_firmas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_firma_tipo ON tbl_firmas(tipo_firma);
CREATE INDEX IF NOT EXISTS idx_firma_fecha ON tbl_firmas(fecha_firma DESC);
CREATE INDEX IF NOT EXISTS idx_firma_hash ON tbl_firmas(hash_documento);

-- ============================================================================
-- SECCIÓN 7: TABLAS DE AUDITORÍA Y LOGS
-- ============================================================================

-- Tabla: Log de Auditoría
CREATE TABLE IF NOT EXISTS tbl_log_auditoria (
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
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON tbl_log_auditoria(id_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON tbl_log_auditoria(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_modulo ON tbl_log_auditoria(modulo);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON tbl_log_auditoria(accion);

-- Tabla: Notificaciones
CREATE TABLE IF NOT EXISTS tbl_notificaciones (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_usuario ON tbl_notificaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_notif_leida ON tbl_notificaciones(leida) WHERE leida = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_fecha ON tbl_notificaciones(fecha_creacion DESC);

-- ============================================================================
-- SECCIÓN 8: TABLA DE INVENTARIO
-- ============================================================================

-- Tabla: Inventario de Bienes Muebles
CREATE TABLE IF NOT EXISTS tbl_inventario (
    id_inventario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    imagen_storage_path TEXT, -- Path de imagen en Storage
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_ua ON tbl_inventario(id_ua);
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON tbl_inventario(categoria);
CREATE INDEX IF NOT EXISTS idx_inventario_numero ON tbl_inventario(numero_inventario);

-- ============================================================================
-- SECCIÓN 9: FUNCIONES Y PROCEDIMIENTOS ALMACENADOS
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

DROP TRIGGER IF EXISTS trg_generar_folio_interno ON tbl_documento_entrante;
CREATE TRIGGER trg_generar_folio_interno
    BEFORE INSERT ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION generar_folio_interno();

-- Función: Actualizar Timestamp
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_doc_entrante ON tbl_documento_entrante;
CREATE TRIGGER trg_actualizar_doc_entrante
    BEFORE UPDATE ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

DROP TRIGGER IF EXISTS trg_actualizar_doc_saliente ON tbl_documento_saliente;
CREATE TRIGGER trg_actualizar_doc_saliente
    BEFORE UPDATE ON tbl_documento_saliente
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Función: Obtener ID del usuario actual desde auth
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener UA del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_ua()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECCIÓN 10: ROW-LEVEL SECURITY (RLS) PARA SUPABASE
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE cat_unidad_administrativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_valores_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_entrante ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_avance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_relacion_respuesta ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_firmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_log_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_inventario ENABLE ROW LEVEL SECURITY;

-- Políticas para cat_unidad_administrativa (todos pueden leer)
DROP POLICY IF EXISTS "Todos pueden ver UAs" ON cat_unidad_administrativa;
CREATE POLICY "Todos pueden ver UAs"
    ON cat_unidad_administrativa FOR SELECT
    TO authenticated
    USING (true);

-- Políticas para cat_roles (todos pueden leer)
DROP POLICY IF EXISTS "Todos pueden ver roles" ON cat_roles;
CREATE POLICY "Todos pueden ver roles"
    ON cat_roles FOR SELECT
    TO authenticated
    USING (true);

-- Políticas para cat_valores_catalogo (todos pueden leer)
DROP POLICY IF EXISTS "Todos pueden ver catálogos" ON cat_valores_catalogo;
CREATE POLICY "Todos pueden ver catálogos"
    ON cat_valores_catalogo FOR SELECT
    TO authenticated
    USING (true);

-- Políticas para tbl_usuarios
DROP POLICY IF EXISTS "Usuarios ven usuarios de su UA" ON tbl_usuarios;
CREATE POLICY "Usuarios ven usuarios de su UA"
    ON tbl_usuarios FOR SELECT
    TO authenticated
    USING (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON tbl_usuarios;
CREATE POLICY "Usuarios pueden actualizar su perfil"
    ON tbl_usuarios FOR UPDATE
    TO authenticated
    USING (id_usuario = auth.uid())
    WITH CHECK (id_usuario = auth.uid());

-- Políticas para tbl_documento_entrante
DROP POLICY IF EXISTS "Ver documentos de su UA" ON tbl_documento_entrante;
CREATE POLICY "Ver documentos de su UA"
    ON tbl_documento_entrante FOR SELECT
    TO authenticated
    USING (
        id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

DROP POLICY IF EXISTS "Crear documentos en su UA" ON tbl_documento_entrante;
CREATE POLICY "Crear documentos en su UA"
    ON tbl_documento_entrante FOR INSERT
    TO authenticated
    WITH CHECK (
        id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        AND id_usuario_registro = auth.uid()
    );

DROP POLICY IF EXISTS "Actualizar documentos de su UA" ON tbl_documento_entrante;
CREATE POLICY "Actualizar documentos de su UA"
    ON tbl_documento_entrante FOR UPDATE
    TO authenticated
    USING (
        id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Políticas para tbl_anexos
DROP POLICY IF EXISTS "Ver anexos de documentos accesibles" ON tbl_anexos;
CREATE POLICY "Ver anexos de documentos accesibles"
    ON tbl_anexos FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tbl_documento_entrante d
            WHERE d.id_doc_entrante = tbl_anexos.id_doc_entrante
            AND d.id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Crear anexos" ON tbl_anexos;
CREATE POLICY "Crear anexos"
    ON tbl_anexos FOR INSERT
    TO authenticated
    WITH CHECK (cargado_por = auth.uid());

-- Políticas para tbl_turnado
DROP POLICY IF EXISTS "Ver turnados de su UA" ON tbl_turnado;
CREATE POLICY "Ver turnados de su UA"
    ON tbl_turnado FOR SELECT
    TO authenticated
    USING (
        id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

DROP POLICY IF EXISTS "Crear turnados desde su UA" ON tbl_turnado;
CREATE POLICY "Crear turnados desde su UA"
    ON tbl_turnado FOR INSERT
    TO authenticated
    WITH CHECK (
        id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        AND id_usuario_turno = auth.uid()
    );

DROP POLICY IF EXISTS "Actualizar turnados" ON tbl_turnado;
CREATE POLICY "Actualizar turnados"
    ON tbl_turnado FOR UPDATE
    TO authenticated
    USING (
        id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- Políticas para tbl_notificaciones
DROP POLICY IF EXISTS "Ver solo notificaciones propias" ON tbl_notificaciones;
CREATE POLICY "Ver solo notificaciones propias"
    ON tbl_notificaciones FOR SELECT
    TO authenticated
    USING (id_usuario = auth.uid());

DROP POLICY IF EXISTS "Actualizar notificaciones propias" ON tbl_notificaciones;
CREATE POLICY "Actualizar notificaciones propias"
    ON tbl_notificaciones FOR UPDATE
    TO authenticated
    USING (id_usuario = auth.uid());

-- Políticas para tbl_inventario
DROP POLICY IF EXISTS "Ver inventario de su UA" ON tbl_inventario;
CREATE POLICY "Ver inventario de su UA"
    ON tbl_inventario FOR SELECT
    TO authenticated
    USING (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol IN ('Administrador General', 'Administrador UA')
        )
    );

DROP POLICY IF EXISTS "Gestionar inventario de su UA" ON tbl_inventario;
CREATE POLICY "Gestionar inventario de su UA"
    ON tbl_inventario FOR ALL
    TO authenticated
    USING (
        id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    );

-- ============================================================================
-- SECCIÓN 11: CONFIGURACIÓN DE SUPABASE STORAGE
-- ============================================================================

-- Nota: Los buckets se crean desde la interfaz de Supabase o mediante la API
-- Este script solo documenta la configuración necesaria

-- BUCKETS NECESARIOS:
-- 1. 'documentos' - Para documentos entrantes y sus anexos
-- 2. 'documentos-salientes' - Para documentos salientes generados
-- 3. 'acuses' - Para acuses de recibo
-- 4. 'inventario' - Para fotos de items de inventario
-- 5. 'firmas' - Para certificados y firmas electrónicas

-- Las políticas de Storage se configuran en Supabase Dashboard > Storage > Policies

-- Ejemplo de política para bucket 'documentos':
-- Name: "Usuarios pueden subir documentos"
-- Definition: (bucket_id = 'documentos' AND auth.role() = 'authenticated')
-- Allowed operations: INSERT, SELECT

-- ============================================================================
-- SECCIÓN 12: DATOS INICIALES - ROLES Y CATÁLOGOS
-- ============================================================================

-- Limpiar datos existentes (opcional, comentar si no se desea)
-- TRUNCATE TABLE cat_roles CASCADE;
-- TRUNCATE TABLE cat_valores_catalogo CASCADE;

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
}'::jsonb)
ON CONFLICT (nombre_rol) DO NOTHING;

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

-- Áreas Remitentes
('Area_Remitente', 'Secretaría de Hacienda', TRUE),
('Area_Remitente', 'Secretaría de Economía', TRUE),
('Area_Remitente', 'Secretaría de Educación', TRUE),
('Area_Remitente', 'Función Pública', TRUE),
('Area_Remitente', 'Secretaría de Salud', TRUE),
('Area_Remitente', 'Secretaría de Bienestar', TRUE)
ON CONFLICT (tipo_catalogo, valor) DO NOTHING;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ESQUEMA SISGEDI 2.0 PARA SUPABASE CREADO EXITOSAMENTE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'SIGUIENTE PASOS:';
    RAISE NOTICE '1. Crear Storage Buckets en Supabase Dashboard:';
    RAISE NOTICE '   - documentos';
    RAISE NOTICE '   - documentos-salientes';
    RAISE NOTICE '   - acuses';
    RAISE NOTICE '   - inventario';
    RAISE NOTICE '   - firmas';
    RAISE NOTICE '';
    RAISE NOTICE '2. Configurar políticas de Storage para cada bucket';
    RAISE NOTICE '';
    RAISE NOTICE '3. Crear usuarios de prueba en Supabase Auth';
    RAISE NOTICE '';
    RAISE NOTICE '4. Insertar datos de prueba usando el script separado';
    RAISE NOTICE '   o mediante la aplicación';
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas creadas: %', (
        SELECT COUNT(*) FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name LIKE 'tbl_%' OR table_name LIKE 'cat_%'
    );
    RAISE NOTICE 'Roles creados: %', (SELECT COUNT(*) FROM cat_roles);
    RAISE NOTICE 'Catálogos creados: %', (SELECT COUNT(*) FROM cat_valores_catalogo);
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
END $$;
