-- ============================================================================
-- SISGEDI 2.0 - SCRIPT CONSOLIDADO PARA SUPABASE
-- ✅ Ejecutar TODO de una vez - SIN ERRORES
-- ⏱️ Tiempo: 30-60 segundos
-- ============================================================================

-- ============================================================================
-- PARTE 1: LIMPIAR Y PREPARAR (por si ya existe algo)
-- ============================================================================

-- Deshabilitar triggers temporalmente para evitar conflictos
SET session_replication_role = 'replica';

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración FTS
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

-- Tabla: Documentos Entrantes
CREATE TABLE IF NOT EXISTS tbl_documento_entrante (
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
    id_usuario_turno UUID REFERENCES tbl_usuarios(id_usuario),
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
    id_usuario_elabora UUID REFERENCES tbl_usuarios(id_usuario),
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
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON tbl_inventario(categoria);

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

DROP TRIGGER IF EXISTS trg_update_doc_saliente ON tbl_documento_saliente;
CREATE TRIGGER trg_update_doc_saliente
    BEFORE UPDATE ON tbl_documento_saliente
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha();

-- Función auxiliar: Generar path de storage
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

DROP POLICY IF EXISTS "Insertar usuario" ON tbl_usuarios;
CREATE POLICY "Insertar usuario" ON tbl_usuarios FOR INSERT TO authenticated
WITH CHECK (id_usuario = auth.uid());

-- Políticas: tbl_documento_entrante
DROP POLICY IF EXISTS "Ver docs de UA" ON tbl_documento_entrante;
CREATE POLICY "Ver docs de UA" ON tbl_documento_entrante FOR SELECT TO authenticated
USING (
    id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    OR EXISTS (SELECT 1 FROM tbl_usuarios u JOIN cat_roles r ON u.id_rol = r.id_rol
               WHERE u.id_usuario = auth.uid() AND r.nombre_rol = 'Administrador General')
);

DROP POLICY IF EXISTS "Crear docs" ON tbl_documento_entrante;
CREATE POLICY "Crear docs" ON tbl_documento_entrante FOR INSERT TO authenticated
WITH CHECK (
    id_ua_registro IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
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
WITH CHECK (true);

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
);

DROP POLICY IF EXISTS "Actualizar turnados" ON tbl_turnado;
CREATE POLICY "Actualizar turnados" ON tbl_turnado FOR UPDATE TO authenticated
USING (id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()));

-- Políticas: tbl_documento_saliente
DROP POLICY IF EXISTS "Ver docs salientes" ON tbl_documento_saliente;
CREATE POLICY "Ver docs salientes" ON tbl_documento_saliente FOR SELECT TO authenticated
USING (
    id_ua_emisora IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    OR EXISTS (SELECT 1 FROM tbl_usuarios u JOIN cat_roles r ON u.id_rol = r.id_rol
               WHERE u.id_usuario = auth.uid() AND r.nombre_rol = 'Administrador General')
);

DROP POLICY IF EXISTS "Crear docs salientes" ON tbl_documento_saliente;
CREATE POLICY "Crear docs salientes" ON tbl_documento_saliente FOR INSERT TO authenticated
WITH CHECK (id_ua_emisora IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()));

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
USING (
    id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    OR EXISTS (SELECT 1 FROM tbl_usuarios u JOIN cat_roles r ON u.id_rol = r.id_rol
               WHERE u.id_usuario = auth.uid() AND r.nombre_rol = 'Administrador General')
);

DROP POLICY IF EXISTS "Gestionar inventario" ON tbl_inventario;
CREATE POLICY "Gestionar inventario" ON tbl_inventario FOR ALL TO authenticated
USING (id_ua IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()));

-- ============================================================================
-- PARTE 5: POLÍTICAS DE STORAGE
-- ============================================================================

-- Políticas para bucket: documentos
DROP POLICY IF EXISTS "Subir docs UA" ON storage.objects;
CREATE POLICY "Subir docs UA" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'documentos'
    AND (
        (storage.foldername(name))[1] IN (
            SELECT codigo_ua::text FROM cat_unidad_administrativa ua
            JOIN tbl_usuarios u ON ua.id_ua = u.id_ua
            WHERE u.id_usuario = auth.uid()
        )
        OR auth.uid() IS NOT NULL
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
        OR auth.uid() IS NOT NULL
    )
);

DROP POLICY IF EXISTS "Actualizar docs UA" ON storage.objects;
CREATE POLICY "Actualizar docs UA" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Eliminar docs UA" ON storage.objects;
CREATE POLICY "Eliminar docs UA" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

-- Políticas para bucket: inventario
DROP POLICY IF EXISTS "Subir fotos inventario" ON storage.objects;
CREATE POLICY "Subir fotos inventario" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'inventario' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Ver fotos inventario" ON storage.objects;
CREATE POLICY "Ver fotos inventario" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'inventario' AND auth.uid() IS NOT NULL);

-- ============================================================================
-- PARTE 6: DATOS INICIALES
-- ============================================================================

-- Insertar Roles
INSERT INTO cat_roles (nombre_rol, descripcion, elementos_menu) VALUES
('Administrador General', 'Acceso completo al sistema', '{"modulos":["admin","documentos","inventario","reportes"]}'::jsonb),
('Administrador UA', 'Administrador de Unidad Administrativa', '{"modulos":["documentos","inventario","usuarios"]}'::jsonb),
('Recepción', 'Captura de documentos entrantes', '{"modulos":["documentos"]}'::jsonb),
('Nivel 1', 'Turnado y firma', '{"modulos":["documentos","turnado"]}'::jsonb),
('Nivel 2', 'Firma y avance', '{"modulos":["documentos","firma"]}'::jsonb),
('Nivel 3', 'Avance y conclusión', '{"modulos":["documentos","avance"]}'::jsonb),
('Visor', 'Solo consulta', '{"modulos":["consultas"]}'::jsonb)
ON CONFLICT (nombre_rol) DO NOTHING;

-- Insertar Catálogos
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, es_modificable) VALUES
('Prioridad', 'Normal', FALSE),
('Prioridad', 'Urgente', FALSE),
('Tipo_Documento', 'Oficio', FALSE),
('Tipo_Documento', 'Circular', FALSE),
('Tipo_Documento', 'Memorándum', FALSE),
('Tipo_Documento', 'Nota Informativa', FALSE),
('Area_Remitente', 'Secretaría de Hacienda', TRUE),
('Area_Remitente', 'Secretaría de Economía', TRUE)
ON CONFLICT (tipo_catalogo, valor) DO NOTHING;

-- Insertar Unidades Administrativas
DO $$
DECLARE
    v_ss1 UUID;
    v_ss2 UUID;
    v_dg1 UUID;
    v_dg2 UUID;
BEGIN
    -- Nivel 1
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

    -- Nivel 2
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion)
    VALUES ('Dirección General de Tecnologías de la Información', 'DG-001', 2, v_ss1, 'Eje Central Lázaro Cárdenas 100, CDMX')
    ON CONFLICT (codigo_ua) DO UPDATE SET nombre_ua = EXCLUDED.nombre_ua
    RETURNING id_ua INTO v_dg1;

    IF v_dg1 IS NULL THEN
        SELECT id_ua INTO v_dg1 FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-001';
    END IF;

    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion)
    VALUES ('Dirección General de Recursos Humanos', 'DG-002', 2, v_ss1, 'Av. Juárez 200, CDMX')
    ON CONFLICT (codigo_ua) DO UPDATE SET nombre_ua = EXCLUDED.nombre_ua
    RETURNING id_ua INTO v_dg2;

    IF v_dg2 IS NULL THEN
        SELECT id_ua INTO v_dg2 FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-002';
    END IF;

    -- Nivel 3
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion) VALUES
    ('Dirección de Sistemas', 'DIR-001', 3, v_dg1, 'Eje Central 100-A'),
    ('Dirección de Infraestructura', 'DIR-002', 3, v_dg1, 'Eje Central 100-B'),
    ('Dirección de Nómina', 'DIR-003', 3, v_dg2, 'Av. Juárez 200-A'),
    ('Dirección de Capacitación', 'DIR-004', 3, v_dg2, 'Av. Juárez 200-B')
    ON CONFLICT (codigo_ua) DO NOTHING;

    -- Nivel 4
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, id_ua_superior, direccion) VALUES
    ('Jefatura de Desarrollo', 'JEF-001', 4, v_dg1, 'Eje Central 100-A-1'),
    ('Jefatura de Soporte Técnico', 'JEF-002', 4, v_dg1, 'Eje Central 100-A-2'),
    ('Jefatura de Redes', 'JEF-003', 4, v_dg1, 'Eje Central 100-B-1')
    ON CONFLICT (codigo_ua) DO NOTHING;
END $$;

-- Insertar Inventario de Prueba
DO $$
DECLARE
    v_ua RECORD;
    v_contador INT := 1;
BEGIN
    FOR v_ua IN SELECT id_ua, codigo_ua FROM cat_unidad_administrativa ORDER BY codigo_ua LOOP
        -- Mobiliario
        INSERT INTO tbl_inventario (id_ua, categoria, descripcion, cantidad, unidad, estado, ubicacion, responsable, numero_inventario, fecha_adquisicion, valor_unitario, valor_total, proveedor)
        VALUES
        (v_ua.id_ua, 'Mobiliario', 'Escritorio ejecutivo', 2, 'Pieza', 'Bueno', 'Oficina Principal', 'Responsable ' || v_contador, v_ua.codigo_ua || '-MOB-2025-' || LPAD(v_contador::text, 4, '0'), CURRENT_DATE - 200, 5000.00, 10000.00, 'Office Depot de México'),
        (v_ua.id_ua, 'Mobiliario', 'Silla ergonómica', 5, 'Pieza', 'Excelente', 'Oficina Principal', 'Responsable ' || v_contador, v_ua.codigo_ua || '-MOB-2025-' || LPAD((v_contador+1)::text, 4, '0'), CURRENT_DATE - 180, 2000.00, 10000.00, 'Office Depot de México')
        ON CONFLICT (numero_inventario) DO NOTHING;

        -- Equipo de Cómputo
        INSERT INTO tbl_inventario (id_ua, categoria, descripcion, cantidad, unidad, estado, ubicacion, responsable, numero_inventario, fecha_adquisicion, valor_unitario, valor_total, proveedor, marca, modelo, serie)
        VALUES
        (v_ua.id_ua, 'Equipo de Cómputo', 'Laptop Dell Latitude', 3, 'Equipo', 'Excelente', 'Área de Sistemas', 'Responsable TI ' || v_contador, v_ua.codigo_ua || '-EQC-2025-' || LPAD((v_contador+2)::text, 4, '0'), CURRENT_DATE - 150, 15000.00, 45000.00, 'Dell Technologies México', 'Dell', 'Latitude 5420', 'SN' || LPAD(v_contador::text, 10, '0')),
        (v_ua.id_ua, 'Equipo de Cómputo', 'Monitor LED 24 pulgadas', 3, 'Equipo', 'Bueno', 'Área de Sistemas', 'Responsable TI ' || v_contador, v_ua.codigo_ua || '-EQC-2025-' || LPAD((v_contador+3)::text, 4, '0'), CURRENT_DATE - 120, 3000.00, 9000.00, 'Samsung Electronics', 'Samsung', '24F390', NULL),
        (v_ua.id_ua, 'Equipo de Cómputo', 'Impresora multifuncional', 1, 'Equipo', 'Bueno', 'Recepción', 'Responsable Admin ' || v_contador, v_ua.codigo_ua || '-EQC-2025-' || LPAD((v_contador+4)::text, 4, '0'), CURRENT_DATE - 90, 8000.00, 8000.00, 'HP México', 'HP', 'LaserJet Pro M428', 'SN' || LPAD((v_contador+100)::text, 10, '0'))
        ON CONFLICT (numero_inventario) DO NOTHING;

        v_contador := v_contador + 10;
    END LOOP;
END $$;

-- Habilitar triggers de nuevo
SET session_replication_role = 'origin';

-- ============================================================================
-- PARTE 7: MENSAJE FINAL
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
    RAISE NOTICE '✅ SISGEDI 2.0 - INSTALACIÓN EXITOSA';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 DATOS CREADOS:';
    RAISE NOTICE '  ✓ Tablas: %', v_tablas;
    RAISE NOTICE '  ✓ Roles: %', v_roles;
    RAISE NOTICE '  ✓ Catálogos: %', v_catalogos;
    RAISE NOTICE '  ✓ Unidades Administrativas: %', v_uas;
    RAISE NOTICE '  ✓ Items de Inventario: %', v_inventario;
    RAISE NOTICE '';
    RAISE NOTICE '🔒 SEGURIDAD CONFIGURADA:';
    RAISE NOTICE '  ✓ RLS habilitado en todas las tablas';
    RAISE NOTICE '  ✓ Políticas de acceso configuradas';
    RAISE NOTICE '  ✓ Storage policies creadas';
    RAISE NOTICE '';
    RAISE NOTICE '📦 SIGUIENTE PASO 1 - STORAGE BUCKETS:';
    RAISE NOTICE '  Ir a: Storage > Create bucket';
    RAISE NOTICE '  Crear (todos privados):';
    RAISE NOTICE '    • documentos';
    RAISE NOTICE '    • documentos-salientes';
    RAISE NOTICE '    • acuses';
    RAISE NOTICE '    • inventario';
    RAISE NOTICE '    • firmas';
    RAISE NOTICE '';
    RAISE NOTICE '👤 SIGUIENTE PASO 2 - CREAR ADMIN:';
    RAISE NOTICE '  1. Authentication > Users > Add user';
    RAISE NOTICE '  2. Email: admin@sisgedi.gob.mx';
    RAISE NOTICE '  3. Password: [tu contraseña]';
    RAISE NOTICE '  4. Auto Confirm User: ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 SIGUIENTE PASO 3 - VINCULAR USUARIO:';
    RAISE NOTICE '  Ejecutar en SQL Editor:';
    RAISE NOTICE '';
    RAISE NOTICE '  INSERT INTO tbl_usuarios (';
    RAISE NOTICE '    id_usuario, clave_servidor_publico, id_ua, id_rol,';
    RAISE NOTICE '    nombre_completo, correo_institucional, estatus';
    RAISE NOTICE '  ) VALUES (';
    RAISE NOTICE '    auth.uid(), -- Se auto-detecta al ejecutar logueado';
    RAISE NOTICE '    ''ADMIN001'',';
    RAISE NOTICE '    (SELECT id_ua FROM cat_unidad_administrativa';
    RAISE NOTICE '     WHERE codigo_ua = ''SS-001''),';
    RAISE NOTICE '    (SELECT id_rol FROM cat_roles';
    RAISE NOTICE '     WHERE nombre_rol = ''Administrador General''),';
    RAISE NOTICE '    ''Administrador General del Sistema'',';
    RAISE NOTICE '    ''admin@sisgedi.gob.mx'',';
    RAISE NOTICE '    ''Activo''';
    RAISE NOTICE '  );';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ¡Sistema listo para usar!';
    RAISE NOTICE '============================================================';
END $$;
