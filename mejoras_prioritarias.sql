-- ============================================================================
-- MEJORAS PRIORITARIAS - SISGEDI 2.0
-- Ejecutar DESPUÉS de database_schema.sql
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: VALIDACIONES ADICIONALES
-- ============================================================================

-- Validar formato de correo electrónico
ALTER TABLE tbl_usuarios
ADD CONSTRAINT chk_correo_formato
CHECK (correo_institucional ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Validar que password_hash no esté vacío
ALTER TABLE tbl_usuarios
ADD CONSTRAINT chk_password_not_empty
CHECK (LENGTH(password_hash) > 0);

-- Validar fechas lógicas
ALTER TABLE tbl_documento_entrante
ADD CONSTRAINT chk_fecha_documento_valida
CHECK (fecha_documento <= fecha_registro::date);

-- Validar que fecha_vencimiento sea futura
ALTER TABLE tbl_turnado
ADD CONSTRAINT chk_vencimiento_futuro
CHECK (fecha_vencimiento > fecha_turnado);

-- ============================================================================
-- SECCIÓN 2: ÍNDICES COMPUESTOS PARA PERFORMANCE
-- ============================================================================

-- Búsqueda de documentos por UA y fecha (consulta más frecuente)
CREATE INDEX idx_doc_entrante_ua_fecha
ON tbl_documento_entrante(id_ua_registro, fecha_registro DESC);

-- Turnados pendientes por UA destino (dashboard)
CREATE INDEX idx_turnado_destino_estatus
ON tbl_turnado(id_ua_destino, estatus_turnado)
WHERE estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso');

-- Documentos con vencimiento próximo (notificaciones)
CREATE INDEX idx_turnado_vencimiento_pendiente
ON tbl_turnado(fecha_vencimiento)
WHERE estatus_turnado != 'Concluido' AND porcentaje_avance < 100;

-- Auditoría por usuario y fecha (reportes)
CREATE INDEX idx_auditoria_usuario_fecha
ON tbl_log_auditoria(id_usuario, fecha_hora DESC);

-- Notificaciones no leídas por usuario
CREATE INDEX idx_notif_usuario_no_leida
ON tbl_notificaciones(id_usuario, fecha_creacion DESC)
WHERE leida = FALSE;

-- ============================================================================
-- SECCIÓN 3: SOFT DELETE (Eliminación Lógica)
-- ============================================================================

-- Agregar columnas para soft delete en documentos
ALTER TABLE tbl_documento_entrante
ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES tbl_usuarios(id_usuario);

-- Índice para filtrar documentos activos
CREATE INDEX idx_doc_entrante_activos
ON tbl_documento_entrante(id_ua_registro, fecha_registro DESC)
WHERE eliminado = FALSE;

-- Vista de documentos activos (usar en lugar de la tabla directamente)
CREATE OR REPLACE VIEW v_documentos_activos AS
SELECT * FROM tbl_documento_entrante WHERE eliminado = FALSE;

-- Actualizar políticas RLS para excluir eliminados
DROP POLICY IF EXISTS "rls_doc_entrante_select_ua" ON tbl_documento_entrante;
CREATE POLICY "rls_doc_entrante_select_ua"
    ON tbl_documento_entrante
    FOR SELECT
    USING (
        eliminado = FALSE AND
        id_ua_registro IN (
            SELECT id_ua
            FROM tbl_usuarios
            WHERE id_usuario = auth.uid()
        )
    );

DROP POLICY IF EXISTS "rls_doc_entrante_select_admin_general" ON tbl_documento_entrante;
CREATE POLICY "rls_doc_entrante_select_admin_general"
    ON tbl_documento_entrante
    FOR SELECT
    USING (
        eliminado = FALSE AND
        EXISTS (
            SELECT 1
            FROM tbl_usuarios u
            JOIN cat_roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = auth.uid()
            AND r.nombre_rol = 'Administrador General'
        )
    );

-- ============================================================================
-- SECCIÓN 4: GENERACIÓN MEJORADA DE FOLIOS
-- ============================================================================

-- Crear secuencias por año para evitar race conditions
DO $$
DECLARE
    v_anio INT := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS seq_folio_entrante_%s START 1', v_anio);
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS seq_folio_saliente_%s START 1', v_anio);
END $$;

-- Función mejorada de generación de folios (con manejo de concurrencia)
CREATE OR REPLACE FUNCTION generar_folio_interno_mejorado()
RETURNS TRIGGER AS $$
DECLARE
    v_contador INT;
    v_anio INT;
    v_seq_name TEXT;
BEGIN
    v_anio := EXTRACT(YEAR FROM NEW.fecha_registro);
    v_seq_name := 'seq_folio_entrante_' || v_anio;

    -- Crear secuencia si no existe para el año
    BEGIN
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', v_seq_name);
    EXCEPTION
        WHEN duplicate_table THEN
            NULL; -- Secuencia ya existe
    END;

    -- Obtener siguiente número de la secuencia
    EXECUTE format('SELECT nextval(%L)', v_seq_name) INTO v_contador;

    -- Generar folio
    NEW.folio_interno := 'ENT-' || v_anio || '-' || LPAD(v_contador::TEXT, 6, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reemplazar trigger existente
DROP TRIGGER IF EXISTS trg_generar_folio_interno ON tbl_documento_entrante;
CREATE TRIGGER trg_generar_folio_interno
    BEFORE INSERT ON tbl_documento_entrante
    FOR EACH ROW
    WHEN (NEW.folio_interno IS NULL)
    EXECUTE FUNCTION generar_folio_interno_mejorado();

-- Similar para documentos salientes
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

    -- Crear secuencia si no existe
    BEGIN
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', v_seq_name);
    EXCEPTION
        WHEN duplicate_table THEN
            NULL;
    END;

    -- Obtener siguiente número
    EXECUTE format('SELECT nextval(%L)', v_seq_name) INTO v_contador;

    -- Prefijo según tipo de documento
    v_prefijo := CASE NEW.tipo_doc
        WHEN 'Oficio' THEN 'OF'
        WHEN 'Nota_Informativa' THEN 'NI'
        WHEN 'Circular' THEN 'CIR'
        WHEN 'Memorandum' THEN 'MEM'
        ELSE 'DOC'
    END;

    -- Generar número de folio
    NEW.numero_folio := v_prefijo || '-' || v_anio || '-' || LPAD(v_contador::TEXT, 6, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generar_folio_saliente
    BEFORE INSERT ON tbl_documento_saliente
    FOR EACH ROW
    WHEN (NEW.numero_folio IS NULL OR NEW.numero_folio = '')
    EXECUTE FUNCTION generar_folio_saliente();

-- ============================================================================
-- SECCIÓN 5: FUNCIÓN MEJORADA DE BÚSQUEDA
-- ============================================================================

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
    fecha_registro TIMESTAMP WITH TIME ZONE,
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

-- ============================================================================
-- SECCIÓN 6: DASHBOARD - INDICADORES VERDE/AMARILLO/ROJO
-- ============================================================================

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
-- SECCIÓN 7: NOTIFICACIONES AUTOMÁTICAS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_crear_notificacion_vencimiento()
RETURNS void AS $$
BEGIN
    -- Notificar documentos que vencen en 1 día
    INSERT INTO tbl_notificaciones (
        id_usuario,
        tipo_notificacion,
        titulo,
        mensaje,
        id_turnado
    )
    SELECT DISTINCT
        u.id_usuario,
        'Vencimiento_Proximo',
        'Documento próximo a vencer',
        'El documento ' || de.folio_interno || ' vence en menos de 24 horas',
        t.id_turnado
    FROM tbl_turnado t
    JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
    JOIN tbl_usuarios u ON u.id_ua = t.id_ua_destino
    WHERE t.fecha_vencimiento BETWEEN NOW() AND NOW() + INTERVAL '1 day'
      AND t.estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso')
      AND t.porcentaje_avance < 100
      AND de.eliminado = FALSE
      AND u.estatus = 'Activo'
      AND NOT EXISTS (
          SELECT 1 FROM tbl_notificaciones n
          WHERE n.id_turnado = t.id_turnado
            AND n.tipo_notificacion = 'Vencimiento_Proximo'
            AND n.fecha_creacion > NOW() - INTERVAL '1 day'
      );

    -- Notificar documentos ya vencidos
    INSERT INTO tbl_notificaciones (
        id_usuario,
        tipo_notificacion,
        titulo,
        mensaje,
        id_turnado
    )
    SELECT DISTINCT
        u.id_usuario,
        'Documento_Vencido',
        '⚠️ Documento VENCIDO',
        'El documento ' || de.folio_interno || ' está vencido desde ' ||
        TO_CHAR(t.fecha_vencimiento, 'DD/MM/YYYY'),
        t.id_turnado
    FROM tbl_turnado t
    JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
    JOIN tbl_usuarios u ON u.id_ua = t.id_ua_destino
    WHERE t.fecha_vencimiento < NOW()
      AND t.estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso')
      AND t.porcentaje_avance < 100
      AND de.eliminado = FALSE
      AND u.estatus = 'Activo'
      AND NOT EXISTS (
          SELECT 1 FROM tbl_notificaciones n
          WHERE n.id_turnado = t.id_turnado
            AND n.tipo_notificacion = 'Documento_Vencido'
            AND n.fecha_creacion > NOW() - INTERVAL '1 day'
      );
END;
$$ LANGUAGE plpgsql;

-- Nota: Para ejecutar automáticamente cada día, necesitas configurar pg_cron
-- o un job externo que llame a esta función

-- ============================================================================
-- SECCIÓN 8: VISTA MATERIALIZADA PARA REPORTES
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_reporte_documentos AS
SELECT
    de.id_doc_entrante,
    de.folio_interno,
    de.numero_oficio_externo,
    de.asunto,
    de.fecha_registro,
    de.estatus_general,
    ua.nombre_ua as unidad_administrativa,
    ua.codigo_ua,
    u.nombre_completo as registrado_por,
    p.valor as prioridad,
    tp.valor as tipo_documento,
    COUNT(DISTINCT t.id_turnado) as total_turnos,
    MAX(t.fecha_vencimiento) as fecha_vencimiento,
    MAX(t.porcentaje_avance) as avance_actual,
    CASE
        WHEN MAX(t.fecha_vencimiento) IS NULL THEN 'Sin turnar'
        WHEN MAX(t.fecha_vencimiento) > NOW() + INTERVAL '3 days' THEN 'Verde'
        WHEN MAX(t.fecha_vencimiento) BETWEEN NOW() AND NOW() + INTERVAL '3 days' THEN 'Amarillo'
        WHEN MAX(t.fecha_vencimiento) < NOW() THEN 'Rojo'
        ELSE 'Sin turnar'
    END as semaforo
FROM tbl_documento_entrante de
JOIN cat_unidad_administrativa ua ON de.id_ua_registro = ua.id_ua
JOIN tbl_usuarios u ON de.id_usuario_registro = u.id_usuario
LEFT JOIN cat_valores_catalogo p ON de.id_prioridad = p.id_valor_catalogo
LEFT JOIN cat_valores_catalogo tp ON de.id_tipo_doc = tp.id_valor_catalogo
LEFT JOIN tbl_turnado t ON de.id_doc_entrante = t.id_doc_entrante
WHERE de.eliminado = FALSE
GROUP BY de.id_doc_entrante, ua.nombre_ua, ua.codigo_ua, u.nombre_completo, p.valor, tp.valor;

-- Índices para la vista materializada
CREATE INDEX IF NOT EXISTS idx_mv_reporte_ua ON mv_reporte_documentos(codigo_ua);
CREATE INDEX IF NOT EXISTS idx_mv_reporte_fecha ON mv_reporte_documentos(fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_mv_reporte_semaforo ON mv_reporte_documentos(semaforo);
CREATE INDEX IF NOT EXISTS idx_mv_reporte_estatus ON mv_reporte_documentos(estatus_general);

-- ============================================================================
-- SECCIÓN 9: FUNCIÓN AUXILIAR PARA REFRESCAR REPORTES
-- ============================================================================

CREATE OR REPLACE FUNCTION refrescar_reporte_documentos()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reporte_documentos;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECCIÓN 10: VISTA DE SALUD DEL SISTEMA
-- ============================================================================

CREATE OR REPLACE VIEW v_salud_sistema AS
SELECT
    (SELECT COUNT(*) FROM tbl_usuarios WHERE estatus = 'Activo') as usuarios_activos,
    (SELECT COUNT(*) FROM tbl_sesiones WHERE estatus_sesion = 'Activa') as sesiones_activas,
    (SELECT COUNT(*) FROM tbl_documento_entrante WHERE fecha_registro > NOW() - INTERVAL '24 hours' AND eliminado = FALSE) as docs_ultimas_24h,
    (SELECT AVG(porcentaje_avance) FROM tbl_turnado WHERE estatus_turnado IN ('En_Proceso', 'Recibido')) as avance_promedio,
    (SELECT COUNT(*) FROM tbl_turnado t JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
     WHERE t.fecha_vencimiento < NOW() AND t.estatus_turnado != 'Concluido' AND de.eliminado = FALSE) as documentos_vencidos,
    (SELECT pg_size_pretty(pg_database_size(current_database()))) as tamano_base_datos,
    (SELECT COUNT(*) FROM tbl_log_auditoria WHERE fecha_hora > NOW() - INTERVAL '1 hour') as eventos_ultima_hora,
    NOW() as fecha_consulta;

-- ============================================================================
-- SECCIÓN 11: FUNCIONES AUXILIARES
-- ============================================================================

-- Función para obtener historial completo de un documento
CREATE OR REPLACE FUNCTION obtener_historial_documento(p_id_doc_entrante UUID)
RETURNS TABLE (
    fecha TIMESTAMP WITH TIME ZONE,
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

-- Función para estadísticas de una UA
CREATE OR REPLACE FUNCTION obtener_estadisticas_ua(p_id_ua UUID, p_dias INT DEFAULT 30)
RETURNS TABLE (
    total_recibidos BIGINT,
    total_enviados BIGINT,
    promedio_tiempo_atencion INTERVAL,
    documentos_concluidos BIGINT,
    documentos_pendientes BIGINT,
    porcentaje_vencidos NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Documentos recibidos
        (SELECT COUNT(*)
         FROM tbl_documento_entrante
         WHERE id_ua_registro = p_id_ua
           AND fecha_registro > NOW() - (p_dias || ' days')::INTERVAL
           AND eliminado = FALSE) as total_recibidos,

        -- Turnados enviados
        (SELECT COUNT(*)
         FROM tbl_turnado
         WHERE id_ua_origen = p_id_ua
           AND fecha_turnado > NOW() - (p_dias || ' days')::INTERVAL) as total_enviados,

        -- Promedio de tiempo de atención
        (SELECT AVG(fecha_actualizacion - fecha_turnado)
         FROM tbl_turnado
         WHERE id_ua_destino = p_id_ua
           AND estatus_turnado = 'Concluido'
           AND fecha_turnado > NOW() - (p_dias || ' days')::INTERVAL) as promedio_tiempo_atencion,

        -- Documentos concluidos
        (SELECT COUNT(*)
         FROM tbl_turnado t
         JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
         WHERE t.id_ua_destino = p_id_ua
           AND t.estatus_turnado = 'Concluido'
           AND t.fecha_turnado > NOW() - (p_dias || ' days')::INTERVAL
           AND de.eliminado = FALSE) as documentos_concluidos,

        -- Documentos pendientes
        (SELECT COUNT(*)
         FROM tbl_turnado t
         JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
         WHERE t.id_ua_destino = p_id_ua
           AND t.estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso')
           AND de.eliminado = FALSE) as documentos_pendientes,

        -- Porcentaje de vencidos
        (SELECT
            CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE (COUNT(*) FILTER (WHERE fecha_vencimiento < NOW()) * 100.0 / COUNT(*))
            END
         FROM tbl_turnado t
         JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
         WHERE t.id_ua_destino = p_id_ua
           AND t.estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso')
           AND de.eliminado = FALSE) as porcentaje_vencidos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIN DE MEJORAS PRIORITARIAS
-- ============================================================================

-- Comentarios en funciones
COMMENT ON FUNCTION search_documentos_avanzada IS 'Búsqueda Full-Text mejorada con filtros de fecha y estatus';
COMMENT ON FUNCTION obtener_indicadores_dashboard IS 'Calcula indicadores Verde/Amarillo/Rojo para el dashboard';
COMMENT ON FUNCTION fn_crear_notificacion_vencimiento IS 'Crea notificaciones automáticas para documentos próximos a vencer';
COMMENT ON FUNCTION obtener_historial_documento IS 'Devuelve el historial completo de turnados y avances de un documento';
COMMENT ON FUNCTION obtener_estadisticas_ua IS 'Genera estadísticas de rendimiento de una Unidad Administrativa';
COMMENT ON MATERIALIZED VIEW mv_reporte_documentos IS 'Vista materializada para reportes rápidos (refrescar con refrescar_reporte_documentos())';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Mejoras prioritarias aplicadas correctamente';
    RAISE NOTICE '📊 Próximo paso: Refrescar vista materializada con: SELECT refrescar_reporte_documentos();';
    RAISE NOTICE '🔔 Configurar ejecución diaria de: SELECT fn_crear_notificacion_vencimiento();';
END $$;
