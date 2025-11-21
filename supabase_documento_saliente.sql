-- ============================================================================
-- SISGEDI 2.0 - TABLA DE DOCUMENTOS SALIENTES
-- ============================================================================
-- Script para crear la tabla de documentos salientes y sus relaciones
-- ============================================================================

-- Tabla: tbl_documento_saliente
CREATE TABLE IF NOT EXISTS tbl_documento_saliente (
    id_documento BIGSERIAL PRIMARY KEY,
    folio_saliente VARCHAR(50) UNIQUE NOT NULL,
    folio_respuesta VARCHAR(50), -- Si responde a un documento entrante
    fecha_elaboracion DATE NOT NULL,
    fecha_envio DATE,
    id_prioridad INTEGER NOT NULL,
    id_tipo_documento INTEGER NOT NULL,
    destinatario_nombre VARCHAR(200) NOT NULL,
    destinatario_cargo VARCHAR(200),
    destinatario_institucion VARCHAR(200),
    asunto TEXT NOT NULL,
    contenido TEXT,
    id_ua_remitente INTEGER NOT NULL,
    id_usuario_elabora UUID NOT NULL,
    numero_anexos INTEGER DEFAULT 0,
    medio_envio VARCHAR(50), -- Físico, Correo, Mensajería, etc.
    numero_guia VARCHAR(100), -- Para envíos por mensajería
    estatus_envio INTEGER NOT NULL, -- Elaborado, Enviado, Entregado, Acuse recibido
    archivo_url TEXT,
    archivo_nombre VARCHAR(255),
    acuse_url TEXT, -- URL del acuse de recibo
    observaciones TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    id_usuario_registro UUID NOT NULL,
    CONSTRAINT fk_saliente_prioridad FOREIGN KEY (id_prioridad)
        REFERENCES cat_valores_catalogo(id_valor_catalogo),
    CONSTRAINT fk_saliente_tipo_doc FOREIGN KEY (id_tipo_documento)
        REFERENCES cat_valores_catalogo(id_valor_catalogo),
    CONSTRAINT fk_saliente_ua FOREIGN KEY (id_ua_remitente)
        REFERENCES cat_unidad_administrativa(id_ua),
    CONSTRAINT fk_saliente_usuario_elabora FOREIGN KEY (id_usuario_elabora)
        REFERENCES tbl_usuarios(id_usuario),
    CONSTRAINT fk_saliente_estatus FOREIGN KEY (estatus_envio)
        REFERENCES cat_valores_catalogo(id_valor_catalogo),
    CONSTRAINT fk_saliente_usuario_registro FOREIGN KEY (id_usuario_registro)
        REFERENCES tbl_usuarios(id_usuario)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_saliente_folio ON tbl_documento_saliente(folio_saliente);
CREATE INDEX idx_saliente_fecha_envio ON tbl_documento_saliente(fecha_envio);
CREATE INDEX idx_saliente_destinatario ON tbl_documento_saliente(destinatario_nombre);
CREATE INDEX idx_saliente_ua ON tbl_documento_saliente(id_ua_remitente);
CREATE INDEX idx_saliente_estatus ON tbl_documento_saliente(estatus_envio);
CREATE INDEX idx_saliente_usuario_elabora ON tbl_documento_saliente(id_usuario_elabora);

-- Comentarios
COMMENT ON TABLE tbl_documento_saliente IS 'Documentos generados y enviados por la institución';
COMMENT ON COLUMN tbl_documento_saliente.folio_saliente IS 'Folio único del documento saliente';
COMMENT ON COLUMN tbl_documento_saliente.folio_respuesta IS 'Folio del documento entrante al que responde (opcional)';
COMMENT ON COLUMN tbl_documento_saliente.medio_envio IS 'Físico, Correo Electrónico, Mensajería, etc.';
COMMENT ON COLUMN tbl_documento_saliente.numero_guia IS 'Número de guía de mensajería si aplica';
COMMENT ON COLUMN tbl_documento_saliente.acuse_url IS 'URL del archivo de acuse de recibo';

-- ============================================================================
-- CATÁLOGOS ADICIONALES NECESARIOS
-- ============================================================================

-- Valores para Estatus de Envío
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, descripcion, orden, activo, es_modificable)
VALUES
    ('Estatus Envío', 'Elaborado', 'Documento elaborado pero no enviado', 1, true, false),
    ('Estatus Envío', 'Enviado', 'Documento enviado al destinatario', 2, true, false),
    ('Estatus Envío', 'En Tránsito', 'Documento en proceso de entrega', 3, true, false),
    ('Estatus Envío', 'Entregado', 'Documento entregado al destinatario', 4, true, false),
    ('Estatus Envío', 'Acuse Recibido', 'Se recibió acuse de recibo firmado', 5, true, false),
    ('Estatus Envío', 'Cancelado', 'Envío cancelado', 6, true, false)
ON CONFLICT (tipo_catalogo, valor) DO NOTHING;

-- Valores para Medio de Envío
INSERT INTO cat_valores_catalogo (tipo_catalogo, valor, descripcion, orden, activo, es_modificable)
VALUES
    ('Medio Envío', 'Físico', 'Entrega física directa', 1, true, false),
    ('Medio Envío', 'Correo Electrónico', 'Envío por correo electrónico', 2, true, false),
    ('Medio Envío', 'Mensajería', 'Envío por servicio de mensajería', 3, true, false),
    ('Medio Envío', 'Correo Certificado', 'Correo postal certificado', 4, true, false),
    ('Medio Envío', 'Plataforma Digital', 'Envío por plataforma gubernamental', 5, true, false)
ON CONFLICT (tipo_catalogo, valor) DO NOTHING;

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para generar folio automático
CREATE OR REPLACE FUNCTION generar_folio_saliente()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_folio VARCHAR(50);
    contador INTEGER;
    año VARCHAR(4);
BEGIN
    -- Obtener año actual
    año := TO_CHAR(NEW.fecha_elaboracion, 'YYYY');

    -- Contar documentos del año
    SELECT COUNT(*) + 1 INTO contador
    FROM tbl_documento_saliente
    WHERE TO_CHAR(fecha_elaboracion, 'YYYY') = año;

    -- Generar folio: SAL-YYYY-NNNN
    nuevo_folio := 'SAL-' || año || '-' || LPAD(contador::TEXT, 4, '0');

    -- Asignar folio si no existe
    IF NEW.folio_saliente IS NULL OR NEW.folio_saliente = '' THEN
        NEW.folio_saliente := nuevo_folio;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar folio automático
CREATE TRIGGER trigger_generar_folio_saliente
BEFORE INSERT ON tbl_documento_saliente
FOR EACH ROW
EXECUTE FUNCTION generar_folio_saliente();

-- ============================================================================
-- PERMISOS (RLS - Desactivado por ahora)
-- ============================================================================

-- RLS desactivado para testing
ALTER TABLE tbl_documento_saliente ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver documentos de su UA o que ellos elaboraron
CREATE POLICY "Usuarios ven documentos de su UA" ON tbl_documento_saliente
    FOR SELECT
    USING (
        id_ua_remitente IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
        OR id_usuario_elabora = auth.uid()
    );

-- Política: Los usuarios pueden insertar documentos de su UA
CREATE POLICY "Usuarios crean documentos de su UA" ON tbl_documento_saliente
    FOR INSERT
    WITH CHECK (
        id_ua_remitente IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
    );

-- Política: Los usuarios pueden actualizar documentos que elaboraron
CREATE POLICY "Usuarios actualizan sus documentos" ON tbl_documento_saliente
    FOR UPDATE
    USING (id_usuario_elabora = auth.uid());

-- ============================================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================================================

-- Insertar algunos documentos salientes de ejemplo
-- NOTA: Ajustar IDs según tu base de datos

/*
INSERT INTO tbl_documento_saliente (
    folio_saliente,
    fecha_elaboracion,
    fecha_envio,
    id_prioridad,
    id_tipo_documento,
    destinatario_nombre,
    destinatario_cargo,
    destinatario_institucion,
    asunto,
    contenido,
    id_ua_remitente,
    id_usuario_elabora,
    numero_anexos,
    medio_envio,
    estatus_envio,
    id_usuario_registro
)
SELECT
    NULL, -- El trigger generará el folio
    CURRENT_DATE - (random() * 30)::INTEGER,
    CURRENT_DATE - (random() * 25)::INTEGER,
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Media' LIMIT 1),
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo Documento' AND valor = 'Oficio' LIMIT 1),
    'Secretaría de Salud',
    'Director General',
    'Gobierno del Estado',
    'Solicitud de información estadística',
    'Por medio del presente se solicita información estadística...',
    (SELECT id_ua FROM cat_unidad_administrativa LIMIT 1),
    auth.uid(),
    2,
    'Correo Electrónico',
    (SELECT id_valor_catalogo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Estatus Envío' AND valor = 'Enviado' LIMIT 1),
    auth.uid()
FROM generate_series(1, 10);
*/

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura de la tabla
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tbl_documento_saliente'
ORDER BY ordinal_position;

-- Ver catálogos creados
SELECT tipo_catalogo, valor, orden
FROM cat_valores_catalogo
WHERE tipo_catalogo IN ('Estatus Envío', 'Medio Envío')
ORDER BY tipo_catalogo, orden;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
