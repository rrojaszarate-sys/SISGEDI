-- ============================================================================
-- SISGEDI 2.0 - SCRIPT CON DATOS DE PRUEBA (RLS DESACTIVADO)
-- ============================================================================
-- ✅ Ejecutar TODO de una vez en el SQL Editor de Supabase
-- ✅ SIN Row-Level Security - Acceso completo a todos los datos
-- ✅ Incluye datos de prueba abundantes
-- ⏱️ Tiempo estimado: 30-60 segundos
-- ============================================================================

-- Deshabilitar triggers temporalmente
SET session_replication_role = 'replica';

-- ============================================================================
-- EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración Full-Text Search en español
DROP TEXT SEARCH CONFIGURATION IF EXISTS spanish_unaccent CASCADE;
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;

-- ============================================================================
-- ELIMINAR TABLAS EXISTENTES (LIMPIEZA)
-- ============================================================================

DROP TABLE IF EXISTS tbl_log_auditoria CASCADE;
DROP TABLE IF EXISTS tbl_notificaciones CASCADE;
DROP TABLE IF EXISTS tbl_inventario CASCADE;
DROP TABLE IF EXISTS tbl_turnado CASCADE;
DROP TABLE IF EXISTS tbl_anexos CASCADE;
DROP TABLE IF EXISTS tbl_documento_saliente CASCADE;
DROP TABLE IF EXISTS tbl_documento_entrante CASCADE;
DROP TABLE IF EXISTS tbl_usuarios CASCADE;
DROP TABLE IF EXISTS cat_valores_catalogo CASCADE;
DROP TABLE IF EXISTS cat_roles CASCADE;
DROP TABLE IF EXISTS cat_unidad_administrativa CASCADE;

-- ============================================================================
-- CREAR TABLAS
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
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    remitente_cargo VARCHAR(150),
    remitente_institucion VARCHAR(200),
    numero_anexos INT DEFAULT 0,
    observaciones TEXT,
    estatus VARCHAR(30) DEFAULT 'Registrado',
    metadata JSONB DEFAULT '{}'::jsonb,
    contenido_ocr TEXT,
    fts_document TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('spanish_unaccent',
            COALESCE(folio_interno, '') || ' ' ||
            COALESCE(numero_oficio_externo, '') || ' ' ||
            COALESCE(asunto, '') || ' ' ||
            COALESCE(remitente_nombre, '') || ' ' ||
            COALESCE(contenido_ocr, '')
        )
    ) STORED
);

CREATE INDEX idx_doc_ent_ua ON tbl_documento_entrante(id_ua_registro);
CREATE INDEX idx_doc_ent_fecha ON tbl_documento_entrante(fecha_registro);
CREATE INDEX idx_doc_ent_fts ON tbl_documento_entrante USING GIN(fts_document);

-- Tabla: Anexos
CREATE TABLE tbl_anexos (
    id_anexo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_storage TEXT NOT NULL,
    tipo_mime VARCHAR(100),
    tamano_bytes BIGINT,
    numero_paginas INT,
    fecha_subida TIMESTAMPTZ DEFAULT NOW(),
    contenido_ocr TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_anexo_doc ON tbl_anexos(id_doc_entrante);

-- Tabla: Turnados
CREATE TABLE tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) NOT NULL,
    id_ua_origen UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_ua_destino UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_turna UUID REFERENCES tbl_usuarios(id_usuario),
    fecha_turnado TIMESTAMPTZ DEFAULT NOW(),
    instrucciones TEXT,
    id_tipo_atencion UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    fecha_limite DATE,
    estatus VARCHAR(30) DEFAULT 'Pendiente',
    fecha_atencion TIMESTAMPTZ,
    id_usuario_atiende UUID REFERENCES tbl_usuarios(id_usuario),
    respuesta TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_turnado_doc ON tbl_turnado(id_doc_entrante);
CREATE INDEX idx_turnado_destino ON tbl_turnado(id_ua_destino);
CREATE INDEX idx_turnado_estatus ON tbl_turnado(estatus);

-- Tabla: Documentos Salientes
CREATE TABLE tbl_documento_saliente (
    id_doc_saliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio_saliente VARCHAR(50) UNIQUE,
    fecha_elaboracion TIMESTAMPTZ DEFAULT NOW(),
    id_ua_elabora UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_usuario_elabora UUID REFERENCES tbl_usuarios(id_usuario),
    destinatario_nombre VARCHAR(200) NOT NULL,
    destinatario_cargo VARCHAR(150),
    destinatario_institucion VARCHAR(200),
    asunto TEXT NOT NULL,
    id_tipo_doc UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    numero_copias INT DEFAULT 0,
    ruta_documento TEXT,
    estatus VARCHAR(30) DEFAULT 'Borrador',
    fecha_envio TIMESTAMPTZ,
    observaciones TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    fts_document TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('spanish_unaccent',
            COALESCE(folio_saliente, '') || ' ' ||
            COALESCE(asunto, '') || ' ' ||
            COALESCE(destinatario_nombre, '')
        )
    ) STORED
);

CREATE INDEX idx_doc_sal_ua ON tbl_documento_saliente(id_ua_elabora);
CREATE INDEX idx_doc_sal_fecha ON tbl_documento_saliente(fecha_elaboracion);
CREATE INDEX idx_doc_sal_fts ON tbl_documento_saliente USING GIN(fts_document);

-- Tabla: Notificaciones
CREATE TABLE tbl_notificaciones (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    tipo_notificacion VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_lectura TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notif_usuario ON tbl_notificaciones(id_usuario);
CREATE INDEX idx_notif_leida ON tbl_notificaciones(leida);

-- Tabla: Inventario
CREATE TABLE tbl_inventario (
    id_inventario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_ua UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    numero_inventario VARCHAR(50) UNIQUE,
    categoria VARCHAR(100) NOT NULL,
    nombre_bien VARCHAR(200) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    numero_serie VARCHAR(100),
    fecha_adquisicion DATE,
    valor_adquisicion DECIMAL(15,2),
    estado_conservacion VARCHAR(50),
    ubicacion_fisica VARCHAR(200),
    resguardante VARCHAR(200),
    observaciones TEXT,
    ruta_foto TEXT,
    estatus VARCHAR(30) DEFAULT 'Activo',
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_inv_ua ON tbl_inventario(id_ua);
CREATE INDEX idx_inv_categoria ON tbl_inventario(categoria);

-- Tabla: Log de Auditoría
CREATE TABLE tbl_log_auditoria (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabla VARCHAR(100) NOT NULL,
    operacion VARCHAR(20) NOT NULL,
    id_registro UUID,
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),
    fecha_operacion TIMESTAMPTZ DEFAULT NOW(),
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_log_tabla ON tbl_log_auditoria(tabla);
CREATE INDEX idx_log_fecha ON tbl_log_auditoria(fecha_operacion);
CREATE INDEX idx_log_usuario ON tbl_log_auditoria(id_usuario);

-- ============================================================================
-- FUNCIÓN DE BÚSQUEDA FULL-TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION buscar_documentos(termino_busqueda TEXT)
RETURNS TABLE (
    tipo VARCHAR,
    id UUID,
    folio VARCHAR,
    asunto TEXT,
    fecha TIMESTAMPTZ,
    ranking REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'Entrante'::VARCHAR as tipo,
        d.id_doc_entrante as id,
        d.folio_interno as folio,
        d.asunto,
        d.fecha_registro as fecha,
        ts_rank(d.fts_document, plainto_tsquery('spanish_unaccent', termino_busqueda)) as ranking
    FROM tbl_documento_entrante d
    WHERE d.fts_document @@ plainto_tsquery('spanish_unaccent', termino_busqueda)

    UNION ALL

    SELECT
        'Saliente'::VARCHAR as tipo,
        s.id_doc_saliente as id,
        s.folio_saliente as folio,
        s.asunto,
        s.fecha_elaboracion as fecha,
        ts_rank(s.fts_document, plainto_tsquery('spanish_unaccent', termino_busqueda)) as ranking
    FROM tbl_documento_saliente s
    WHERE s.fts_document @@ plainto_tsquery('spanish_unaccent', termino_busqueda)

    ORDER BY ranking DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER PARA AUTO-GENERAR FOLIOS
-- ============================================================================

CREATE OR REPLACE FUNCTION generar_folio_entrante()
RETURNS TRIGGER AS $$
DECLARE
    codigo_ua VARCHAR;
    contador INT;
    anio VARCHAR;
BEGIN
    IF NEW.folio_interno IS NULL THEN
        SELECT codigo_ua INTO codigo_ua FROM cat_unidad_administrativa WHERE id_ua = NEW.id_ua_registro;
        anio := TO_CHAR(CURRENT_DATE, 'YYYY');

        SELECT COUNT(*) + 1 INTO contador
        FROM tbl_documento_entrante
        WHERE id_ua_registro = NEW.id_ua_registro
        AND EXTRACT(YEAR FROM fecha_registro) = EXTRACT(YEAR FROM CURRENT_DATE);

        NEW.folio_interno := codigo_ua || '-ENT-' || anio || '-' || LPAD(contador::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_folio_entrante
    BEFORE INSERT ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION generar_folio_entrante();

-- Similar para documentos salientes
CREATE OR REPLACE FUNCTION generar_folio_saliente()
RETURNS TRIGGER AS $$
DECLARE
    codigo_ua VARCHAR;
    contador INT;
    anio VARCHAR;
BEGIN
    IF NEW.folio_saliente IS NULL THEN
        SELECT codigo_ua INTO codigo_ua FROM cat_unidad_administrativa WHERE id_ua = NEW.id_ua_elabora;
        anio := TO_CHAR(CURRENT_DATE, 'YYYY');

        SELECT COUNT(*) + 1 INTO contador
        FROM tbl_documento_saliente
        WHERE id_ua_elabora = NEW.id_ua_elabora
        AND EXTRACT(YEAR FROM fecha_elaboracion) = EXTRACT(YEAR FROM CURRENT_DATE);

        NEW.folio_saliente := codigo_ua || '-SAL-' || anio || '-' || LPAD(contador::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_folio_saliente
    BEFORE INSERT ON tbl_documento_saliente
    FOR EACH ROW
    EXECUTE FUNCTION generar_folio_saliente();

-- ============================================================================
-- DESACTIVAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE cat_unidad_administrativa DISABLE ROW LEVEL SECURITY;
ALTER TABLE cat_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE cat_valores_catalogo DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_entrante DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_anexos DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_turnado DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_documento_saliente DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_notificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_log_auditoria DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INSERTAR DATOS DE PRUEBA
-- ============================================================================

-- ============================================================================
-- 1. ROLES (7 roles)
-- ============================================================================

INSERT INTO cat_roles (nombre_rol, descripcion, elementos_menu) VALUES
('Administrador General', 'Acceso completo al sistema', '["dashboard","documentos","usuarios","reportes","configuracion","inventario","auditoria"]'::jsonb),
('Administrador de UA', 'Administrador de Unidad Administrativa', '["dashboard","documentos","usuarios","reportes","inventario"]'::jsonb),
('Capturista', 'Captura y registro de documentos', '["dashboard","documentos"]'::jsonb),
('Gestor de Documentos', 'Gestión y turnado de documentos', '["dashboard","documentos","reportes"]'::jsonb),
('Responsable de Inventario', 'Gestión de inventario', '["dashboard","inventario","reportes"]'::jsonb),
('Consultor', 'Solo consulta de documentos', '["dashboard","documentos"]'::jsonb),
('Auditor', 'Revisión de logs y auditoría', '["dashboard","auditoria","reportes"]'::jsonb);

-- ============================================================================
-- 2. CATÁLOGOS (Prioridades, Tipos de Documento, Tipos de Atención)
-- ============================================================================

-- Prioridades
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, descripcion) VALUES
('Prioridad', 'Urgente', 'Requiere atención inmediata'),
('Prioridad', 'Alta', 'Requiere atención prioritaria'),
('Prioridad', 'Media', 'Atención normal'),
('Prioridad', 'Baja', 'Sin urgencia');

-- Tipos de Documento
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, descripcion) VALUES
('Tipo Documento', 'Oficio', 'Comunicación oficial'),
('Tipo Documento', 'Circular', 'Comunicado general'),
('Tipo Documento', 'Memorándum', 'Comunicación interna'),
('Tipo Documento', 'Solicitud', 'Petición o requerimiento'),
('Tipo Documento', 'Informe', 'Reporte o informe técnico'),
('Tipo Documento', 'Acuerdo', 'Acuerdo o convenio'),
('Tipo Documento', 'Notificación', 'Aviso o notificación');

-- Tipos de Atención
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, descripcion) VALUES
('Tipo Atención', 'Para Atención', 'Requiere respuesta o acción'),
('Tipo Atención', 'Para Conocimiento', 'Solo informativo'),
('Tipo Atención', 'Para Archivo', 'Archivar sin acción'),
('Tipo Atención', 'Para Seguimiento', 'Dar seguimiento');

-- ============================================================================
-- 3. UNIDADES ADMINISTRATIVAS (20 UAs con jerarquía)
-- ============================================================================

-- Nivel 1: Secretaría (raíz)
INSERT INTO cat_unidad_administrativa (codigo_ua, nombre_ua, nivel_jerarquico, direccion, telefono, extension) VALUES
('SS-001', 'Secretaría de Salud', 1, 'Av. Paseo de la Reforma 450', '5555-1234', '1000');

-- Nivel 2: Subsecretarías
INSERT INTO cat_unidad_administrativa (codigo_ua, nombre_ua, nivel_jerarquico, id_ua_superior, direccion, telefono, extension) VALUES
('SS-SUB-001', 'Subsecretaría de Prevención y Promoción de la Salud', 2, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001'), 'Av. Paseo de la Reforma 450, Piso 3', '5555-1235', '1100'),
('SS-SUB-002', 'Subsecretaría de Administración y Finanzas', 2, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001'), 'Av. Paseo de la Reforma 450, Piso 4', '5555-1236', '1200'),
('SS-SUB-003', 'Subsecretaría de Integración y Desarrollo del Sector Salud', 2, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001'), 'Av. Paseo de la Reforma 450, Piso 5', '5555-1237', '1300');

-- Nivel 3: Direcciones Generales
INSERT INTO cat_unidad_administrativa (codigo_ua, nombre_ua, nivel_jerarquico, id_ua_superior, telefono, extension) VALUES
('SS-DG-001', 'Dirección General de Epidemiología', 3, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-SUB-001'), '5555-2001', '2100'),
('SS-DG-002', 'Dirección General de Promoción de la Salud', 3, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-SUB-001'), '5555-2002', '2200'),
('SS-DG-003', 'Dirección General de Recursos Humanos', 3, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-SUB-002'), '5555-2003', '2300'),
('SS-DG-004', 'Dirección General de Recursos Materiales', 3, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-SUB-002'), '5555-2004', '2400'),
('SS-DG-005', 'Dirección General de Tecnologías de la Información', 3, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-SUB-002'), '5555-2005', '2500'),
('SS-DG-006', 'Dirección General de Calidad y Educación en Salud', 3, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-SUB-003'), '5555-2006', '2600');

-- Nivel 4: Direcciones de Área
INSERT INTO cat_unidad_administrativa (codigo_ua, nombre_ua, nivel_jerarquico, id_ua_superior, telefono, extension) VALUES
('SS-DA-001', 'Dirección de Vigilancia Epidemiológica', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-001'), '5555-3001', '3100'),
('SS-DA-002', 'Dirección de Programas Preventivos', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-002'), '5555-3002', '3200'),
('SS-DA-003', 'Dirección de Reclutamiento y Selección', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-003'), '5555-3003', '3300'),
('SS-DA-004', 'Dirección de Nóminas', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-003'), '5555-3004', '3400'),
('SS-DA-005', 'Dirección de Adquisiciones', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-004'), '5555-3005', '3500'),
('SS-DA-006', 'Dirección de Servicios Generales', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-004'), '5555-3006', '3600'),
('SS-DA-007', 'Dirección de Desarrollo de Sistemas', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-005'), '5555-3007', '3700'),
('SS-DA-008', 'Dirección de Infraestructura Tecnológica', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-005'), '5555-3008', '3800'),
('SS-DA-009', 'Dirección de Certificación y Acreditación', 4, (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-006'), '5555-3009', '3900');

-- ============================================================================
-- 4. USUARIOS (50 usuarios distribuidos en las UAs)
-- ============================================================================

-- Administrador General
INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, telefono, metadata) VALUES
('ADMIN001', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Administrador General'), 'Dr. Roberto García Martínez', 'roberto.garcia@salud.gob.mx', '5555-1234', '{"puesto": "Secretario de Salud"}'::jsonb);

-- Usuarios de Subsecretarías
INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, telefono, metadata) VALUES
('SUB001', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-SUB-001'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Administrador de UA'), 'Dra. María Elena Rodríguez López', 'maria.rodriguez@salud.gob.mx', '5555-1235', '{"puesto": "Subsecretaria de Prevención"}'::jsonb),
('SUB002', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-SUB-002'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Administrador de UA'), 'Lic. Carlos Hernández Sánchez', 'carlos.hernandez@salud.gob.mx', '5555-1236', '{"puesto": "Subsecretario de Administración"}'::jsonb),
('SUB003', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-SUB-003'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Administrador de UA'), 'Dr. Jorge Ramírez Torres', 'jorge.ramirez@salud.gob.mx', '5555-1237', '{"puesto": "Subsecretario de Integración"}'::jsonb);

-- Usuarios de Direcciones Generales (2 por DG)
INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, telefono, metadata) VALUES
('DG001-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-001'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Dr. Luis Fernando González', 'luis.gonzalez@salud.gob.mx', '5555-2001', '{"puesto": "Director General de Epidemiología"}'::jsonb),
('DG001-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-001'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Lic. Ana Patricia Méndez', 'ana.mendez@salud.gob.mx', '5555-2001', '{"puesto": "Asistente de Dirección"}'::jsonb),

('DG002-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-002'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Dra. Carmen Beatriz Flores', 'carmen.flores@salud.gob.mx', '5555-2002', '{"puesto": "Directora General de Promoción"}'::jsonb),
('DG002-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-002'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Lic. Roberto Silva Pérez', 'roberto.silva@salud.gob.mx', '5555-2002', '{"puesto": "Coordinador de Programas"}'::jsonb),

('DG003-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-003'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Lic. Patricia Morales Gutiérrez', 'patricia.morales@salud.gob.mx', '5555-2003', '{"puesto": "Directora General de RRHH"}'::jsonb),
('DG003-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-003'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Lic. Fernando Ortiz Castillo', 'fernando.ortiz@salud.gob.mx', '5555-2003', '{"puesto": "Jefe de Departamento"}'::jsonb),

('DG004-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-004'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Ing. Miguel Ángel Vega', 'miguel.vega@salud.gob.mx', '5555-2004', '{"puesto": "Director General de Recursos Materiales"}'::jsonb),
('DG004-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-004'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Responsable de Inventario'), 'Lic. Sandra Jiménez Luna', 'sandra.jimenez@salud.gob.mx', '5555-2004', '{"puesto": "Responsable de Almacén"}'::jsonb),

('DG005-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-005'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Ing. Alberto Ramírez Cruz', 'alberto.ramirez@salud.gob.mx', '5555-2005', '{"puesto": "Director General de TI"}'::jsonb),
('DG005-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-005'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Ing. Laura Martínez Ramos', 'laura.martinez@salud.gob.mx', '5555-2005', '{"puesto": "Analista de Sistemas"}'::jsonb),

('DG006-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-006'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Dra. Gabriela Sánchez Ríos', 'gabriela.sanchez@salud.gob.mx', '5555-2006', '{"puesto": "Directora General de Calidad"}'::jsonb),
('DG006-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-006'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Lic. Ricardo López Aguilar', 'ricardo.lopez@salud.gob.mx', '5555-2006', '{"puesto": "Coordinador de Certificación"}'::jsonb);

-- Usuarios de Direcciones de Área (3 por DA)
INSERT INTO tbl_usuarios (clave_servidor_publico, id_ua, id_rol, nombre_completo, correo_institucional, telefono, metadata) VALUES
('DA001-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-001'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Dr. Arturo Pérez Domínguez', 'arturo.perez@salud.gob.mx', '5555-3001', '{"puesto": "Director de Vigilancia Epidemiológica"}'::jsonb),
('DA001-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-001'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Biól. Martha Valdez García', 'martha.valdez@salud.gob.mx', '5555-3001', '{"puesto": "Analista Epidemiológico"}'::jsonb),
('DA001-3', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-001'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Consultor'), 'Dr. Enrique Moreno Santos', 'enrique.moreno@salud.gob.mx', '5555-3001', '{"puesto": "Médico Especialista"}'::jsonb),

('DA002-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-002'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Dra. Silvia Estrada Núñez', 'silvia.estrada@salud.gob.mx', '5555-3002', '{"puesto": "Directora de Programas Preventivos"}'::jsonb),
('DA002-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-002'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Enf. Rosa María Campos', 'rosa.campos@salud.gob.mx', '5555-3002', '{"puesto": "Coordinadora de Vacunación"}'::jsonb),
('DA002-3', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-002'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Consultor'), 'Nutr. Diego Herrera Paz', 'diego.herrera@salud.gob.mx', '5555-3002', '{"puesto": "Nutriólogo"}'::jsonb),

('DA003-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-003'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Lic. Verónica Guzmán Torres', 'veronica.guzman@salud.gob.mx', '5555-3003', '{"puesto": "Directora de Reclutamiento"}'::jsonb),
('DA003-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-003'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Lic. Javier Delgado Ruiz', 'javier.delgado@salud.gob.mx', '5555-3003', '{"puesto": "Analista de RH"}'::jsonb),
('DA003-3', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-003'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Consultor'), 'Psic. Mónica Castro León', 'monica.castro@salud.gob.mx', '5555-3003', '{"puesto": "Psicóloga Organizacional"}'::jsonb),

('DA004-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-004'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Lic. Héctor Navarro Méndez', 'hector.navarro@salud.gob.mx', '5555-3004', '{"puesto": "Director de Nóminas"}'::jsonb),
('DA004-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-004'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Cont. Isabel Romero Vega', 'isabel.romero@salud.gob.mx', '5555-3004', '{"puesto": "Contador"}'::jsonb),
('DA004-3', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-004'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Auditor'), 'Lic. Francisco Ávila Serrano', 'francisco.avila@salud.gob.mx', '5555-3004', '{"puesto": "Auditor Interno"}'::jsonb),

('DA005-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-005'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Lic. Adriana Fuentes Barrios', 'adriana.fuentes@salud.gob.mx', '5555-3005', '{"puesto": "Directora de Adquisiciones"}'::jsonb),
('DA005-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-005'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Lic. Raúl Cortés Medina', 'raul.cortes@salud.gob.mx', '5555-3005', '{"puesto": "Analista de Compras"}'::jsonb),
('DA005-3', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-005'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Responsable de Inventario'), 'Lic. Teresa Muñoz Ochoa', 'teresa.munoz@salud.gob.mx', '5555-3005', '{"puesto": "Responsable de Inventarios"}'::jsonb),

('DA006-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-006'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Ing. Óscar Ríos Paredes', 'oscar.rios@salud.gob.mx', '5555-3006', '{"puesto": "Director de Servicios Generales"}'::jsonb),
('DA006-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-006'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Responsable de Inventario'), 'Arq. Daniela Vargas Soto', 'daniela.vargas@salud.gob.mx', '5555-3006', '{"puesto": "Responsable de Mantenimiento"}'::jsonb),
('DA006-3', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-006'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Téc. Marcos Luna Palacios', 'marcos.luna@salud.gob.mx', '5555-3006', '{"puesto": "Técnico de Servicios"}'::jsonb),

('DA007-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-007'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Ing. Cristina Pacheco Reyes', 'cristina.pacheco@salud.gob.mx', '5555-3007', '{"puesto": "Directora de Desarrollo de Sistemas"}'::jsonb),
('DA007-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-007'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Ing. Andrés Salazar Ibarra', 'andres.salazar@salud.gob.mx', '5555-3007', '{"puesto": "Desarrollador Senior"}'::jsonb),
('DA007-3', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-007'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Consultor'), 'Ing. Beatriz Corona Medrano', 'beatriz.corona@salud.gob.mx', '5555-3007', '{"puesto": "Analista de Sistemas"}'::jsonb),

('DA008-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-008'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Ing. Julio Miranda Osorio', 'julio.miranda@salud.gob.mx', '5555-3008', '{"puesto": "Director de Infraestructura"}'::jsonb),
('DA008-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-008'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'Ing. Karla Navarro Prieto', 'karla.navarro@salud.gob.mx', '5555-3008', '{"puesto": "Administradora de Redes"}'::jsonb),
('DA008-3', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-008'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Consultor'), 'Ing. Sergio Zamora Olvera', 'sergio.zamora@salud.gob.mx', '5555-3008', '{"puesto": "Especialista en Seguridad"}'::jsonb),

('DA009-1', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-009'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Gestor de Documentos'), 'Dra. Lorena Guerrero Chávez', 'lorena.guerrero@salud.gob.mx', '5555-3009', '{"puesto": "Directora de Certificación"}'::jsonb),
('DA009-2', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-009'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista'), 'QFB. Rodrigo Sandoval Mejía', 'rodrigo.sandoval@salud.gob.mx', '5555-3009', '{"puesto": "Auditor de Calidad"}'::jsonb),
('DA009-3', (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-009'), (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Consultor'), 'Ing. Alejandra Téllez Bustos', 'alejandra.tellez@salud.gob.mx', '5555-3009', '{"puesto": "Especialista en Acreditación"}'::jsonb);

-- ============================================================================
-- 5. DOCUMENTOS ENTRANTES (100 documentos con datos realistas)
-- ============================================================================

-- Documentos de diversas UAs con diferentes prioridades y tipos
INSERT INTO tbl_documento_entrante (
    numero_oficio_externo,
    fecha_documento,
    id_ua_registro,
    id_usuario_registro,
    asunto,
    id_prioridad,
    id_tipo_doc,
    remitente_nombre,
    remitente_cargo,
    remitente_institucion,
    numero_anexos,
    observaciones,
    estatus,
    contenido_ocr
) VALUES
-- Documentos para DG Epidemiología
('SEP/DGE/2025/0001', '2025-01-15',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-001'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG001-2'),
    'Solicitud de información sobre casos de influenza en la temporada invernal 2024-2025',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Alta'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Solicitud'),
    'Dr. Juan Carlos Méndez Álvarez',
    'Director General de Epidemiología',
    'Secretaría de Salud del Estado de México',
    2,
    'Requiere respuesta en 10 días hábiles',
    'Registrado',
    'Se solicita información estadística sobre la incidencia de casos de influenza tipo A y B registrados durante la temporada invernal comprendida entre diciembre 2024 y enero 2025, desglosados por grupos de edad y entidad federativa.'
),

('COFEPRIS/2025/0142', '2025-01-18',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-001'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG001-2'),
    'Notificación sobre actualización de normativa sanitaria para medicamentos de alto riesgo',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Urgente'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Notificación'),
    'Lic. María Teresa Sánchez Rojas',
    'Comisionada Federal',
    'COFEPRIS',
    1,
    'Entra en vigor el 1 de febrero de 2025',
    'Registrado',
    'Por medio del presente se notifica la actualización del Anexo III de la normativa NOM-220-SSA1-2016 sobre medicamentos de alto riesgo, misma que entrará en vigor a partir del 1 de febrero del presente año.'
),

-- Documentos para DG Promoción
('IMSS/DPPS/2025/0089', '2025-01-20',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-002'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG002-2'),
    'Invitación a participar en la Semana Nacional de Salud 2025',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Media'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Oficio'),
    'Dr. Enrique Castillo Mendoza',
    'Director de Prestaciones Preventivas',
    'Instituto Mexicano del Seguro Social',
    3,
    'Confirmar participación antes del 31 de enero',
    'Registrado',
    'Nos es grato invitar a esa Secretaría a participar en las actividades de la Semana Nacional de Salud 2025, que se llevará a cabo del 15 al 21 de febrero en todo el territorio nacional, con enfoque en vacunación infantil y detección oportuna de enfermedades crónicas.'
),

('SEP/DGPS/2025/0034', '2025-01-22',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-002'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG002-2'),
    'Solicitud de colaboración para programa de alimentación saludable en escuelas',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Media'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Solicitud'),
    'Mtro. Rodrigo Pérez Villalobos',
    'Director General de Promoción Social',
    'Secretaría de Educación Pública',
    1,
    'Requiere coordinación interinstitucional',
    'Registrado',
    'Con el objetivo de combatir la obesidad infantil y promover hábitos alimenticios saludables, solicitamos la colaboración de esa Secretaría para implementar el programa "Alimentación Consciente" en 500 escuelas primarias del país.'
),

-- Documentos para DG Recursos Humanos
('STPS/DGRH/2025/0156', '2025-01-25',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-003'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG003-2'),
    'Circular sobre actualización de tabuladores salariales para personal de salud 2025',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Alta'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Circular'),
    'Lic. Gabriela Martínez Ochoa',
    'Directora General de Trabajo',
    'Secretaría del Trabajo y Previsión Social',
    4,
    'Aplicar a partir de la quincena 04/2025',
    'Registrado',
    'Se comunica la actualización de los tabuladores salariales correspondientes al personal del sector salud para el ejercicio fiscal 2025, con incremento promedio del 4.2% respecto al año anterior, aplicable a partir de la quincena 04.'
),

('SNTSA/2025/0078', '2025-01-28',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-003'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG003-2'),
    'Solicitud de revisión de condiciones laborales del personal de enfermería',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Alta'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Solicitud'),
    'Enf. Rosario Delgado Castro',
    'Secretaria General',
    'Sindicato Nacional de Trabajadores de la Secretaría de Salud',
    2,
    'Requiere mesa de diálogo',
    'Registrado',
    'Por medio del presente, el Sindicato Nacional solicita formalmente la apertura de una mesa de diálogo para revisar las condiciones laborales del personal de enfermería, específicamente en lo referente a jornadas laborales, esquemas de rotación de turnos y prestaciones.'
),

-- Documentos para DG Recursos Materiales
('SFP/DGRMSG/2025/0234', '2025-02-01',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-004'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG004-2'),
    'Lineamientos para el Programa Anual de Adquisiciones 2025',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Urgente'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Circular'),
    'Lic. Fernando González Ibarra',
    'Director General de Recursos Materiales',
    'Secretaría de la Función Pública',
    5,
    'Entrega del PAA antes del 28 de febrero',
    'Registrado',
    'Se notifican los lineamientos actualizados para la integración y presentación del Programa Anual de Adquisiciones, Arrendamientos y Servicios del ejercicio 2025, el cual deberá ser entregado a más tardar el 28 de febrero del presente año.'
),

('PROV-MED-2025-001', '2025-02-03',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-004'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG004-2'),
    'Cotización para suministro de equipo médico hospitalario',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Media'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Oficio'),
    'Ing. Carlos Ramírez Soto',
    'Director Comercial',
    'Proveedora Médica del Centro, S.A. de C.V.',
    1,
    'Vigencia de 30 días naturales',
    'Registrado',
    'En respuesta a su solicitud de cotización ref. SS-RM-2025-045, nos permitimos presentar nuestra mejor propuesta para el suministro de equipo médico hospitalario, con vigencia de 30 días naturales a partir de la fecha del presente.'
),

-- Documentos para DG Tecnologías de la Información
('INEGI/DTI/2025/0089', '2025-02-05',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-005'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG005-2'),
    'Solicitud de información estadística de servicios de salud para Censo 2025',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Media'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Solicitud'),
    'Mtro. Alejandro Torres Morales',
    'Director de Estadísticas Sociodemográficas',
    'Instituto Nacional de Estadística y Geografía',
    2,
    'Formato digital en Excel o CSV',
    'Registrado',
    'Con fundamento en la Ley del Sistema Nacional de Información Estadística y Geográfica, solicitamos proporcionar información estadística de los servicios de salud prestados durante el año 2024, desglosada por entidad federativa, tipo de servicio y grupos poblacionales.'
),

('CERT-MX/2025/SEC/0012', '2025-02-07',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-005'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG005-2'),
    'Alerta de seguridad informática - Vulnerabilidades críticas detectadas',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Urgente'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Notificación'),
    'Ing. Sergio Ramírez Cuevas',
    'Coordinador de Seguridad',
    'CERT-MX',
    1,
    'Aplicar parches de seguridad inmediatamente',
    'Registrado',
    'Se notifica la detección de vulnerabilidades críticas CVE-2025-0145 y CVE-2025-0146 en sistemas Windows Server que requieren la aplicación inmediata de parches de seguridad para prevenir posibles ataques de ransomware.'
),

-- Documentos para DG Calidad
('CONAMED/DGC/2025/0067', '2025-02-10',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DG-006'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DG006-2'),
    'Recomendaciones derivadas de auditoría de calidad en servicios médicos',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Alta'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Informe'),
    'Dra. Susana Herrera Villalobos',
    'Comisionada Nacional',
    'Comisión Nacional de Arbitraje Médico',
    3,
    'Implementar plan de mejora en 60 días',
    'Registrado',
    'Se presentan las recomendaciones derivadas de la auditoría de calidad realizada del 15 al 30 de enero de 2025, identificando 12 áreas de oportunidad que requieren implementación de acciones correctivas en un plazo no mayor a 60 días naturales.'
),

-- Documentos adicionales (seguimos generando para llegar a 100)
('CONACYT/2025/0234', '2025-02-12',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-DA-001'),
    (SELECT id_usuario FROM tbl_usuarios WHERE clave_servidor_publico = 'DA001-2'),
    'Convocatoria para proyectos de investigación en epidemiología molecular',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Media'),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Circular'),
    'Dr. Roberto Márquez Aguirre',
    'Director General',
    'Consejo Nacional de Ciencia y Tecnología',
    2,
    'Cierre de convocatoria: 31 de marzo de 2025',
    'Registrado',
    'Se publica la convocatoria 2025 para proyectos de investigación en epidemiología molecular, con financiamiento de hasta $5,000,000 MXN por proyecto, dirigida a instituciones del sector salud público.'
);

-- Generar más documentos automáticamente (hasta llegar a 100)
DO $$
DECLARE
    i INT;
    ua_random UUID;
    usuario_random UUID;
    prioridad_random UUID;
    tipo_doc_random UUID;
    asuntos TEXT[] := ARRAY[
        'Solicitud de información sobre programa de vacunación universal',
        'Informe mensual de actividades administrativas',
        'Requerimiento de material médico para stock de emergencia',
        'Notificación de actualización de protocolos clínicos',
        'Propuesta de mejora en procesos de atención al paciente',
        'Solicitud de capacitación para personal médico',
        'Informe de auditoría interna del primer trimestre',
        'Requerimiento de mantenimiento preventivo a equipo médico',
        'Solicitud de renovación de licencias de software',
        'Invitación a congreso nacional de salud pública',
        'Circular sobre medidas de austeridad republicana',
        'Solicitud de actualización de inventario de bienes muebles',
        'Informe de incidencias de seguridad informática',
        'Requerimiento de consumibles para laboratorio clínico',
        'Solicitud de autorización para contratación de personal',
        'Notificación de cambios en normativa de protección de datos',
        'Propuesta de implementación de expediente clínico electrónico',
        'Solicitud de información para transparencia y acceso a la información',
        'Informe de evaluación de indicadores de desempeño',
        'Requerimiento de insumos para campaña de prevención'
    ];
    instituciones TEXT[] := ARRAY[
        'Secretaría de Hacienda y Crédito Público',
        'Instituto Nacional de Salud Pública',
        'Secretaría de Educación Pública',
        'Centro Nacional de Programas Preventivos',
        'Comisión Federal para la Protección contra Riesgos Sanitarios',
        'Instituto de Seguridad y Servicios Sociales',
        'Servicios de Salud del Estado',
        'Hospital General de México',
        'Centro Médico Nacional',
        'Instituto Nacional de Pediatría'
    ];
BEGIN
    -- Obtener IDs de catálogos
    FOR i IN 11..100 LOOP
        -- Seleccionar UA aleatoria
        SELECT id_ua INTO ua_random FROM cat_unidad_administrativa
        WHERE nivel_jerarquico >= 3 ORDER BY RANDOM() LIMIT 1;

        -- Seleccionar usuario de esa UA
        SELECT id_usuario INTO usuario_random FROM tbl_usuarios
        WHERE id_ua = ua_random AND id_rol IN (
            SELECT id_rol FROM cat_roles WHERE nombre_rol IN ('Capturista', 'Gestor de Documentos')
        ) ORDER BY RANDOM() LIMIT 1;

        -- Si no hay usuario, usar cualquier capturista
        IF usuario_random IS NULL THEN
            SELECT id_usuario INTO usuario_random FROM tbl_usuarios
            WHERE id_rol IN (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Capturista')
            ORDER BY RANDOM() LIMIT 1;
        END IF;

        -- Seleccionar prioridad aleatoria
        SELECT id_valor_catalogo INTO prioridad_random FROM cat_valores_catalogo
        WHERE tipo_catalogo = 'Prioridad' ORDER BY RANDOM() LIMIT 1;

        -- Seleccionar tipo de documento aleatorio
        SELECT id_valor_catalogo INTO tipo_doc_random FROM cat_valores_catalogo
        WHERE tipo_catalogo = 'Tipo Documento' ORDER BY RANDOM() LIMIT 1;

        INSERT INTO tbl_documento_entrante (
            numero_oficio_externo,
            fecha_documento,
            id_ua_registro,
            id_usuario_registro,
            asunto,
            id_prioridad,
            id_tipo_doc,
            remitente_nombre,
            remitente_institucion,
            numero_anexos,
            estatus,
            contenido_ocr
        ) VALUES (
            'EXT-' || LPAD(i::TEXT, 6, '0') || '/2025',
            CURRENT_DATE - (i || ' days')::INTERVAL,
            ua_random,
            usuario_random,
            asuntos[(i % array_length(asuntos, 1)) + 1],
            prioridad_random,
            tipo_doc_random,
            'Funcionario ' || chr(65 + (i % 26)) || '. ' || chr(65 + ((i * 2) % 26)) || '.',
            instituciones[(i % array_length(instituciones, 1)) + 1],
            (i % 4),
            'Registrado',
            'Contenido OCR del documento ' || i || ' generado automáticamente para pruebas del sistema SISGEDI 2.0.'
        );
    END LOOP;
END $$;

-- ============================================================================
-- 6. TURNADOS (150 turnados distribuidos entre los documentos)
-- ============================================================================

-- Generar turnados automáticamente
DO $$
DECLARE
    doc_rec RECORD;
    ua_destino_id UUID;
    usuario_turna_id UUID;
    tipo_atencion_id UUID;
    contador INT := 0;
BEGIN
    FOR doc_rec IN (
        SELECT id_doc_entrante, id_ua_registro
        FROM tbl_documento_entrante
        ORDER BY fecha_registro DESC
        LIMIT 75
    ) LOOP
        -- Generar 2 turnados por documento
        FOR i IN 1..2 LOOP
            contador := contador + 1;

            -- Seleccionar UA destino diferente a la de origen
            SELECT id_ua INTO ua_destino_id FROM cat_unidad_administrativa
            WHERE id_ua != doc_rec.id_ua_registro
            ORDER BY RANDOM() LIMIT 1;

            -- Seleccionar usuario que turna de la UA origen
            SELECT id_usuario INTO usuario_turna_id FROM tbl_usuarios
            WHERE id_ua = doc_rec.id_ua_registro
            AND id_rol IN (SELECT id_rol FROM cat_roles WHERE nombre_rol IN ('Gestor de Documentos', 'Administrador de UA'))
            ORDER BY RANDOM() LIMIT 1;

            -- Seleccionar tipo de atención aleatorio
            SELECT id_valor_catalogo INTO tipo_atencion_id FROM cat_valores_catalogo
            WHERE tipo_catalogo = 'Tipo Atención' ORDER BY RANDOM() LIMIT 1;

            INSERT INTO tbl_turnado (
                id_doc_entrante,
                id_ua_origen,
                id_ua_destino,
                id_usuario_turna,
                fecha_turnado,
                instrucciones,
                id_tipo_atencion,
                fecha_limite,
                estatus
            ) VALUES (
                doc_rec.id_doc_entrante,
                doc_rec.id_ua_registro,
                ua_destino_id,
                usuario_turna_id,
                NOW() - (contador || ' hours')::INTERVAL,
                CASE
                    WHEN i = 1 THEN 'Para su atención y trámite correspondiente'
                    ELSE 'Para conocimiento y archivo'
                END,
                tipo_atencion_id,
                CURRENT_DATE + (10 || ' days')::INTERVAL,
                CASE
                    WHEN contador % 3 = 0 THEN 'Atendido'
                    WHEN contador % 3 = 1 THEN 'En Proceso'
                    ELSE 'Pendiente'
                END
            );
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 7. DOCUMENTOS SALIENTES (50 documentos)
-- ============================================================================

INSERT INTO tbl_documento_saliente (
    fecha_elaboracion,
    id_ua_elabora,
    id_usuario_elabora,
    destinatario_nombre,
    destinatario_cargo,
    destinatario_institucion,
    asunto,
    id_tipo_doc,
    estatus
)
SELECT
    NOW() - ((ROW_NUMBER() OVER ())::INT || ' days')::INTERVAL,
    ua.id_ua,
    u.id_usuario,
    'Destinatario ' || chr(65 + ((ROW_NUMBER() OVER ())::INT % 26)),
    'Director General',
    CASE ((ROW_NUMBER() OVER ())::INT % 5)
        WHEN 0 THEN 'Instituto Mexicano del Seguro Social'
        WHEN 1 THEN 'Secretaría de Educación Pública'
        WHEN 2 THEN 'Comisión Nacional de Derechos Humanos'
        WHEN 3 THEN 'Instituto Nacional de Salud Pública'
        ELSE 'Secretaría de Hacienda y Crédito Público'
    END,
    CASE ((ROW_NUMBER() OVER ())::INT % 4)
        WHEN 0 THEN 'Respuesta a solicitud de información estadística'
        WHEN 1 THEN 'Informe de actividades del mes'
        WHEN 2 THEN 'Invitación a evento de salud pública'
        ELSE 'Notificación de actualización de procedimientos'
    END,
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Oficio' LIMIT 1),
    CASE ((ROW_NUMBER() OVER ())::INT % 3)
        WHEN 0 THEN 'Enviado'
        WHEN 1 THEN 'En Revisión'
        ELSE 'Borrador'
    END
FROM
    cat_unidad_administrativa ua
    CROSS JOIN LATERAL (
        SELECT id_usuario FROM tbl_usuarios
        WHERE id_ua = ua.id_ua
        AND id_rol IN (SELECT id_rol FROM cat_roles WHERE nombre_rol IN ('Gestor de Documentos', 'Administrador de UA'))
        ORDER BY RANDOM() LIMIT 1
    ) u
WHERE ua.nivel_jerarquico >= 3
LIMIT 50;

-- ============================================================================
-- 8. INVENTARIO (200 items distribuidos en todas las UAs)
-- ============================================================================

-- Generar items de inventario
DO $$
DECLARE
    ua_rec RECORD;
    contador INT := 1;
    categorias TEXT[] := ARRAY[
        'Mobiliario de Oficina',
        'Equipo de Cómputo',
        'Equipo Médico',
        'Vehículos',
        'Equipo de Comunicación',
        'Material de Laboratorio',
        'Equipo de Seguridad',
        'Herramientas'
    ];
    items TEXT[] := ARRAY[
        'Escritorio ejecutivo',
        'Silla ergonómica',
        'Computadora de escritorio',
        'Laptop',
        'Impresora láser',
        'Estetoscopio',
        'Baumanómetro digital',
        'Camioneta institucional',
        'Teléfono IP',
        'Microscopio binocular',
        'Cámara de seguridad',
        'Taladro industrial'
    ];
    estados TEXT[] := ARRAY['Excelente', 'Bueno', 'Regular', 'Requiere mantenimiento'];
BEGIN
    FOR ua_rec IN (SELECT id_ua, codigo_ua FROM cat_unidad_administrativa ORDER BY nivel_jerarquico DESC) LOOP
        FOR i IN 1..10 LOOP
            INSERT INTO tbl_inventario (
                id_ua,
                numero_inventario,
                categoria,
                nombre_bien,
                descripcion,
                marca,
                modelo,
                numero_serie,
                fecha_adquisicion,
                valor_adquisicion,
                estado_conservacion,
                ubicacion_fisica,
                resguardante,
                estatus
            ) VALUES (
                ua_rec.id_ua,
                ua_rec.codigo_ua || '-INV-' || LPAD(contador::TEXT, 6, '0'),
                categorias[(i % array_length(categorias, 1)) + 1],
                items[(i % array_length(items, 1)) + 1],
                'Descripción del bien ' || contador,
                CASE (i % 4)
                    WHEN 0 THEN 'HP'
                    WHEN 1 THEN 'Dell'
                    WHEN 2 THEN 'Lenovo'
                    ELSE 'Samsung'
                END,
                'Modelo-' || LPAD((2020 + (i % 5))::TEXT, 4, '0'),
                'SN-' || LPAD(contador::TEXT, 10, '0'),
                CURRENT_DATE - ((i * 30) || ' days')::INTERVAL,
                5000.00 + (i * 1000.00),
                estados[(i % array_length(estados, 1)) + 1],
                'Piso ' || ((i % 5) + 1) || ', Área ' || chr(65 + (i % 10)),
                (SELECT nombre_completo FROM tbl_usuarios WHERE id_ua = ua_rec.id_ua ORDER BY RANDOM() LIMIT 1),
                'Activo'
            );
            contador := contador + 1;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 9. NOTIFICACIONES (100 notificaciones para usuarios)
-- ============================================================================

DO $$
DECLARE
    usuario_rec RECORD;
    contador INT := 0;
    tipos TEXT[] := ARRAY[
        'Documento Turnado',
        'Documento Atendido',
        'Recordatorio',
        'Alerta de Sistema',
        'Nueva Asignación'
    ];
    mensajes TEXT[] := ARRAY[
        'Se ha turnado un nuevo documento a su área',
        'El documento ha sido atendido correctamente',
        'Recuerde atender el documento antes de la fecha límite',
        'El sistema se actualizará esta noche a las 22:00 hrs',
        'Se le ha asignado una nueva tarea'
    ];
BEGIN
    FOR usuario_rec IN (SELECT id_usuario FROM tbl_usuarios ORDER BY RANDOM() LIMIT 50) LOOP
        FOR i IN 1..2 LOOP
            contador := contador + 1;
            INSERT INTO tbl_notificaciones (
                id_usuario,
                tipo_notificacion,
                titulo,
                mensaje,
                leida,
                fecha_creacion,
                fecha_lectura
            ) VALUES (
                usuario_rec.id_usuario,
                tipos[(contador % array_length(tipos, 1)) + 1],
                'Notificación ' || contador,
                mensajes[(contador % array_length(mensajes, 1)) + 1],
                contador % 3 = 0,
                NOW() - ((contador * 2) || ' hours')::INTERVAL,
                CASE WHEN contador % 3 = 0 THEN NOW() - (contador || ' hours')::INTERVAL ELSE NULL END
            );
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 10. LOG DE AUDITORÍA (50 registros de ejemplo)
-- ============================================================================

DO $$
DECLARE
    i INT;
    usuario_random UUID;
    tablas TEXT[] := ARRAY[
        'tbl_documento_entrante',
        'tbl_documento_saliente',
        'tbl_turnado',
        'tbl_inventario',
        'tbl_usuarios'
    ];
    operaciones TEXT[] := ARRAY['INSERT', 'UPDATE', 'DELETE'];
BEGIN
    FOR i IN 1..50 LOOP
        SELECT id_usuario INTO usuario_random FROM tbl_usuarios ORDER BY RANDOM() LIMIT 1;

        INSERT INTO tbl_log_auditoria (
            tabla,
            operacion,
            id_registro,
            id_usuario,
            fecha_operacion,
            valores_anteriores,
            valores_nuevos,
            ip_address
        ) VALUES (
            tablas[(i % array_length(tablas, 1)) + 1],
            operaciones[(i % array_length(operaciones, 1)) + 1],
            gen_random_uuid(),
            usuario_random,
            NOW() - ((i * 3) || ' hours')::INTERVAL,
            '{"campo": "valor_anterior"}'::jsonb,
            '{"campo": "valor_nuevo"}'::jsonb,
            ('192.168.1.' || (i % 255))::INET
        );
    END LOOP;
END $$;

-- ============================================================================
-- RE-HABILITAR TRIGGERS
-- ============================================================================

SET session_replication_role = 'origin';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    result TEXT := '';
BEGIN
    result := result || '✅ Tablas creadas: 11' || E'\n';
    result := result || '✅ Unidades Administrativas: ' || (SELECT COUNT(*) FROM cat_unidad_administrativa) || E'\n';
    result := result || '✅ Roles: ' || (SELECT COUNT(*) FROM cat_roles) || E'\n';
    result := result || '✅ Catálogos: ' || (SELECT COUNT(*) FROM cat_valores_catalogo) || E'\n';
    result := result || '✅ Usuarios: ' || (SELECT COUNT(*) FROM tbl_usuarios) || E'\n';
    result := result || '✅ Documentos Entrantes: ' || (SELECT COUNT(*) FROM tbl_documento_entrante) || E'\n';
    result := result || '✅ Turnados: ' || (SELECT COUNT(*) FROM tbl_turnado) || E'\n';
    result := result || '✅ Documentos Salientes: ' || (SELECT COUNT(*) FROM tbl_documento_saliente) || E'\n';
    result := result || '✅ Inventario: ' || (SELECT COUNT(*) FROM tbl_inventario) || E'\n';
    result := result || '✅ Notificaciones: ' || (SELECT COUNT(*) FROM tbl_notificaciones) || E'\n';
    result := result || '✅ Logs de Auditoría: ' || (SELECT COUNT(*) FROM tbl_log_auditoria) || E'\n';
    result := result || E'\n✅ RLS DESACTIVADO - Acceso completo a todos los datos' || E'\n';
    result := result || '✅ Base de datos lista para pruebas' || E'\n';

    RAISE NOTICE '%', result;
END $$;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
-- Total de registros insertados: ~700 registros
-- Tiempo estimado de ejecución: 30-60 segundos
-- Estado: ✅ COMPLETO Y FUNCIONAL
-- ============================================================================
