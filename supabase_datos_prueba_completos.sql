-- ============================================================================
-- SISGEDI 2.0 - DATOS DE PRUEBA COMPLETOS
-- ============================================================================
-- Este script genera datos realistas para pruebas
-- IMPORTANTE: Ejecutar DESPUÉS del esquema principal
-- ============================================================================

-- ============================================================================
-- REMITENTES EXTERNOS
-- ============================================================================

DO $$
DECLARE
    v_area_shcp UUID;
    v_area_se UUID;
    v_area_segob UUID;
    v_area_pjf UUID;
    v_area_gob_edo UUID;
    v_area_privado UUID;
    v_area_civil UUID;
    v_area_ciudadano UUID;
BEGIN
    -- Obtener IDs de áreas
    SELECT id_area_remitente INTO v_area_shcp FROM cat_area_remitente WHERE nombre_area = 'Gobierno Federal' LIMIT 1;
    SELECT id_area_remitente INTO v_area_se FROM cat_area_remitente WHERE nombre_area = 'Gobierno Federal' LIMIT 1;
    SELECT id_area_remitente INTO v_area_segob FROM cat_area_remitente WHERE nombre_area = 'Gobierno Federal' LIMIT 1;
    SELECT id_area_remitente INTO v_area_pjf FROM cat_area_remitente WHERE nombre_area = 'Poder Judicial' LIMIT 1;
    SELECT id_area_remitente INTO v_area_gob_edo FROM cat_area_remitente WHERE nombre_area = 'Gobierno Estatal' LIMIT 1;
    SELECT id_area_privado FROM cat_area_remitente WHERE nombre_area = 'Sector Privado' LIMIT 1;
    SELECT id_area_remitente INTO v_area_civil FROM cat_area_remitente WHERE nombre_area = 'Organizaciones Civiles' LIMIT 1;
    SELECT id_area_remitente INTO v_area_ciudadano FROM cat_area_remitente WHERE nombre_area = 'Ciudadanos' LIMIT 1;

    -- Remitentes de Gobierno Federal
    INSERT INTO cat_remitente (nombre_completo, cargo, email, telefono, id_area_remitente) VALUES
    ('Lic. María Fernanda González Pérez', 'Subsecretaria de Egresos', 'mf.gonzalez@hacienda.gob.mx', '55-3688-1234', v_area_shcp),
    ('Mtro. Carlos Hernández Silva', 'Director General de Programación y Presupuesto', 'c.hernandez@hacienda.gob.mx', '55-3688-5678', v_area_shcp),
    ('Lic. Roberto Jiménez Valdez', 'Coordinador de Comercio Exterior', 'r.jimenez@economia.gob.mx', '55-5229-6100', v_area_se),
    ('Dra. Ana Patricia Ruiz Contreras', 'Subsecretaria de Desarrollo Económico', 'ap.ruiz@economia.gob.mx', '55-5229-6200', v_area_se),
    ('Lic. Jorge Alberto Mendoza García', 'Coordinador de Enlace Institucional', 'ja.mendoza@segob.gob.mx', '55-5093-3400', v_area_segob);

    -- Remitentes del Poder Judicial
    INSERT INTO cat_remitente (nombre_completo, cargo, email, telefono, id_area_remitente) VALUES
    ('Magistrado Juan Carlos Fernández López', 'Magistrado del Primer Tribunal Colegiado', 'jc.fernandez@cjf.gob.mx', '55-5133-0300', v_area_pjf),
    ('Lic. Mónica Elizabeth Torres Sánchez', 'Secretaria de Acuerdos', 'me.torres@cjf.gob.mx', '55-5133-0301', v_area_pjf);

    -- Remitentes de Gobierno Estatal
    INSERT INTO cat_remitente (nombre_completo, cargo, email, telefono, id_area_remitente) VALUES
    ('Ing. Rafael Martínez Domínguez', 'Secretario de Obras Públicas', 'r.martinez@edomex.gob.mx', '55-2000-2100', v_area_gob_edo),
    ('Lic. Sandra Patricia Ramírez Cruz', 'Directora de Desarrollo Urbano', 'sp.ramirez@edomex.gob.mx', '55-2000-2150', v_area_gob_edo);

    -- Sector Privado
    INSERT INTO cat_remitente (nombre_completo, cargo, email, telefono, id_area_remitente) VALUES
    ('Lic. Fernando Gutiérrez Montes', 'Director General', 'f.gutierrez@empresa.com.mx', '55-1234-5678', v_area_privado),
    ('Ing. Luis Alberto Pérez Luna', 'Gerente de Proyectos', 'la.perez@constructora.mx', '55-9876-5432', v_area_privado);

    -- Organizaciones Civiles
    INSERT INTO cat_remitente (nombre_completo, cargo, email, telefono, id_area_remitente) VALUES
    ('Mtra. Gabriela Ortiz Mendoza', 'Presidenta AC', 'g.ortiz@transparencia.org.mx', '55-5555-1234', v_area_civil),
    ('Lic. Eduardo Sánchez Vera', 'Coordinador de Incidencia', 'e.sanchez@sociedad.org.mx', '55-5555-5678', v_area_civil);

    -- Ciudadanos
    INSERT INTO cat_remitente (nombre_completo, cargo, email, telefono, id_area_remitente) VALUES
    ('Juan José Rodríguez Martínez', 'Ciudadano', 'jj.rodriguez@gmail.com', '55-1111-2222', v_area_ciudadano),
    ('María del Carmen López Hernández', 'Ciudadana', 'mc.lopez@hotmail.com', '55-3333-4444', v_area_ciudadano);

END $$;

-- ============================================================================
-- USUARIOS DE PRUEBA
-- ============================================================================
-- NOTA: Estos usuarios requieren que existan en auth.users de Supabase
-- En producción, se crean mediante el flujo de registro de Supabase Auth

COMMENT ON TABLE tbl_usuarios IS 'Para crear usuarios de prueba, primero crear en Supabase Auth Dashboard o vía API';

-- Ejemplo de estructura de usuarios (comentado, requiere IDs reales de auth.users):
/*
INSERT INTO tbl_usuarios (
    id_usuario,
    clave_servidor_publico,
    curp,
    nombre_completo,
    id_ua,
    id_rol,
    correo_institucional,
    telefono,
    estatus
) VALUES
(
    'UUID-DEL-AUTH-USER',
    'CSP001',
    'GOPE900101HDFRR01',
    'Pedro González Pérez',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-GD'),
    (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Administrador General'),
    'pedro.gonzalez@institucion.gob.mx',
    '55-1234-5678',
    'Activo'
);
*/

-- ============================================================================
-- DOCUMENTOS ENTRANTES DE PRUEBA
-- ============================================================================

DO $$
DECLARE
    v_id_doc_1 UUID;
    v_id_doc_2 UUID;
    v_id_doc_3 UUID;
    v_id_doc_4 UUID;
    v_id_doc_5 UUID;

    v_ua_dgti UUID;
    v_ua_dgrm UUID;
    v_ua_ssgd UUID;

    v_remitente_shcp UUID;
    v_remitente_se UUID;
    v_remitente_pjf UUID;
    v_remitente_privado UUID;
    v_remitente_ciudadano UUID;

    v_prioridad_normal UUID;
    v_prioridad_alta UUID;
    v_prioridad_urgente UUID;

    v_tipo_oficio UUID;
    v_tipo_memo UUID;
    v_tipo_circular UUID;

    v_tipo_asunto_adm UUID;
    v_tipo_asunto_tec UUID;
    v_tipo_asunto_jur UUID;
BEGIN
    -- Obtener IDs de referencia
    SELECT id_ua INTO v_ua_dgti FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-TI' LIMIT 1;
    SELECT id_ua INTO v_ua_dgrm FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-RM' LIMIT 1;
    SELECT id_ua INTO v_ua_ssgd FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-GD' LIMIT 1;

    SELECT id_remitente INTO v_remitente_shcp FROM cat_remitente WHERE cargo LIKE '%Subsecretaria de Egresos%' LIMIT 1;
    SELECT id_remitente INTO v_remitente_se FROM cat_remitente WHERE cargo LIKE '%Coordinador de Comercio%' LIMIT 1;
    SELECT id_remitente INTO v_remitente_pjf FROM cat_remitente WHERE cargo LIKE '%Magistrado%' LIMIT 1;
    SELECT id_remitente INTO v_remitente_privado FROM cat_remitente WHERE cargo = 'Director General' LIMIT 1;
    SELECT id_remitente INTO v_remitente_ciudadano FROM cat_remitente WHERE cargo = 'Ciudadano' LIMIT 1;

    SELECT id_valor_catalogo INTO v_prioridad_normal FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Normal';
    SELECT id_valor_catalogo INTO v_prioridad_alta FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Alta';
    SELECT id_valor_catalogo INTO v_prioridad_urgente FROM cat_valores_catalogo WHERE tipo_catalogo = 'Prioridad' AND valor = 'Urgente';

    SELECT id_valor_catalogo INTO v_tipo_oficio FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo_Documento' AND valor = 'Oficio';
    SELECT id_valor_catalogo INTO v_tipo_memo FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo_Documento' AND valor = 'Memorándum';
    SELECT id_valor_catalogo INTO v_tipo_circular FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo_Documento' AND valor = 'Circular';

    SELECT id_valor_catalogo INTO v_tipo_asunto_adm FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo_Asunto' AND valor = 'Administrativo';
    SELECT id_valor_catalogo INTO v_tipo_asunto_tec FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo_Asunto' AND valor = 'Técnico';
    SELECT id_valor_catalogo INTO v_tipo_asunto_jur FROM cat_valores_catalogo WHERE tipo_catalogo = 'Tipo_Asunto' AND valor = 'Jurídico';

    -- Documento 1: Oficio urgente de SHCP sobre presupuesto
    INSERT INTO tbl_documento_entrante (
        numero_oficio_externo,
        folio_externo,
        asunto,
        numero_fojas,
        fecha_documento,
        fecha_recepcion,
        id_prioridad,
        id_tipo_doc,
        id_tipo_asunto,
        id_remitente,
        id_ua_destinataria,
        contenido_ocr,
        marca_seguimiento,
        estatus_general
    ) VALUES (
        'SHCP/SPPE/1234/2025',
        'EXT-2025-001',
        'Solicitud de información sobre el ejercicio presupuestal del primer trimestre 2025 para validación de cifras ante la SHCP',
        '5',
        '2025-01-15',
        '2025-01-16 09:30:00',
        v_prioridad_urgente,
        v_tipo_oficio,
        v_tipo_asunto_adm,
        v_remitente_shcp,
        v_ua_ssgd,
        'Solicitud información presupuesto primer trimestre 2025 validación cifras SHCP ejercicio fiscal recursos autorizados',
        'Especial',
        'Registrado'
    ) RETURNING id_doc_entrante INTO v_id_doc_1;

    -- Documento 2: Oficio de Secretaría de Economía sobre convenio
    INSERT INTO tbl_documento_entrante (
        numero_oficio_externo,
        folio_externo,
        asunto,
        numero_fojas,
        fecha_documento,
        fecha_recepcion,
        id_prioridad,
        id_tipo_doc,
        id_tipo_asunto,
        id_remitente,
        id_ua_destinataria,
        contenido_ocr,
        estatus_general
    ) VALUES (
        'SE/DCE/567/2025',
        'EXT-2025-002',
        'Propuesta de convenio de colaboración para programa de digitalización de trámites comerciales',
        '12',
        '2025-01-18',
        '2025-01-19 10:15:00',
        v_prioridad_alta,
        v_tipo_oficio,
        v_tipo_asunto_tec,
        v_remitente_se,
        v_ua_dgti,
        'Convenio colaboración digitalización trámites comerciales plataforma electrónica modernización servicios',
        'Normal'
    ) RETURNING id_doc_entrante INTO v_id_doc_2;

    -- Documento 3: Requerimiento judicial
    INSERT INTO tbl_documento_entrante (
        numero_oficio_externo,
        folio_externo,
        asunto,
        numero_fojas,
        fecha_documento,
        fecha_recepcion,
        id_prioridad,
        id_tipo_doc,
        id_tipo_asunto,
        id_remitente,
        id_ua_destinataria,
        contenido_ocr,
        marca_seguimiento,
        estatus_general
    ) VALUES (
        'PJF/STCC/089/2025',
        'EXT-2025-003',
        'Requerimiento de información en cumplimiento de sentencia de amparo 123/2024 sobre transparencia presupuestal',
        '8',
        '2025-01-20',
        '2025-01-20 14:30:00',
        v_prioridad_urgente,
        v_tipo_oficio,
        v_tipo_asunto_jur,
        v_remitente_pjf,
        v_ua_ssgd,
        'Requerimiento información sentencia amparo transparencia presupuestal cumplimiento judicial obligación legal',
        'Especial',
        'Registrado'
    ) RETURNING id_doc_entrante INTO v_id_doc_3;

    -- Documento 4: Solicitud de proveedor
    INSERT INTO tbl_documento_entrante (
        numero_oficio_externo,
        folio_externo,
        asunto,
        numero_fojas,
        fecha_documento,
        fecha_recepcion,
        id_prioridad,
        id_tipo_doc,
        id_tipo_asunto,
        id_remitente,
        id_ua_destinataria,
        contenido_ocr,
        estatus_general
    ) VALUES (
        'EMP-DG-045/2025',
        'EXT-2025-004',
        'Propuesta para suministro de equipos de cómputo y licencias de software para el ejercicio 2025',
        '25',
        '2025-01-22',
        '2025-01-22 11:00:00',
        v_prioridad_normal,
        v_tipo_oficio,
        v_tipo_asunto_adm,
        v_remitente_privado,
        v_ua_dgrm,
        'Propuesta suministro equipos cómputo licencias software cotización adquisición tecnología',
        'Normal'
    ) RETURNING id_doc_entrante INTO v_id_doc_4;

    -- Documento 5: Solicitud de acceso a información (ciudadano)
    INSERT INTO tbl_documento_entrante (
        numero_oficio_externo,
        asunto,
        numero_fojas,
        fecha_documento,
        fecha_recepcion,
        id_prioridad,
        id_tipo_doc,
        id_tipo_asunto,
        id_remitente,
        id_ua_destinataria,
        contenido_ocr,
        estatus_general
    ) VALUES (
        'SOLICITUD-CIUDADANA-001',
        'Solicitud de acceso a información pública sobre presupuesto asignado a tecnologías de la información en 2024',
        '2',
        '2025-01-23',
        '2025-01-23 16:45:00',
        v_prioridad_normal,
        v_tipo_oficio,
        v_tipo_asunto_adm,
        v_remitente_ciudadano,
        v_ua_dgti,
        'Solicitud información pública presupuesto tecnologías información transparencia acceso datos',
        'Registrado'
    ) RETURNING id_doc_entrante INTO v_id_doc_5;

    -- Documento 6-10: Más documentos para variedad
    INSERT INTO tbl_documento_entrante (
        numero_oficio_externo,
        asunto,
        fecha_documento,
        fecha_recepcion,
        id_prioridad,
        id_tipo_doc,
        id_tipo_asunto,
        id_remitente,
        id_ua_destinataria,
        contenido_ocr,
        estatus_general
    ) VALUES
    ('SHCP/DAF/789/2025', 'Circular sobre actualización de normativa en materia de adquisiciones públicas',
     '2025-01-24', '2025-01-25 09:00:00', v_prioridad_normal, v_tipo_circular, v_tipo_asunto_adm,
     v_remitente_shcp, v_ua_dgrm, 'Circular actualización normativa adquisiciones públicas compras contrataciones',
     'Registrado'),

    ('SE/DGPYME/321/2025', 'Invitación a programa de capacitación en transformación digital para PyMEs',
     '2025-01-25', '2025-01-26 10:30:00', v_prioridad_normal, v_tipo_oficio, v_tipo_asunto_tec,
     v_remitente_se, v_ua_dgti, 'Invitación capacitación transformación digital PyMEs tecnología innovación',
     'Registrado'),

    ('MEMO-INTERNO-001', 'Memorándum sobre cambios en procedimientos de recepción de documentos',
     '2025-01-27', '2025-01-27 08:00:00', v_prioridad_alta, v_tipo_memo, v_tipo_asunto_adm,
     v_remitente_shcp, v_ua_ssgd, 'Memorándum procedimientos recepción documentos cambios actualización procesos',
     'Registrado');

    RAISE NOTICE 'Se crearon % documentos de prueba', (SELECT COUNT(*) FROM tbl_documento_entrante);

END $$;

-- ============================================================================
-- TURNADOS DE PRUEBA
-- ============================================================================

DO $$
DECLARE
    v_doc UUID;
    v_ua_origen UUID;
    v_ua_destino UUID;
BEGIN
    -- Obtener primer documento y UAs
    SELECT id_doc_entrante INTO v_doc FROM tbl_documento_entrante LIMIT 1;
    SELECT id_ua INTO v_ua_origen FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-GD' LIMIT 1;
    SELECT id_ua INTO v_ua_destino FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-TI' LIMIT 1;

    IF v_doc IS NOT NULL AND v_ua_origen IS NOT NULL AND v_ua_destino IS NOT NULL THEN
        INSERT INTO tbl_turnado (
            id_doc_entrante,
            id_ua_origen,
            id_ua_destino,
            instruccion,
            dias_atencion,
            porcentaje_avance,
            estatus_turnado
        ) VALUES (
            v_doc,
            v_ua_origen,
            v_ua_destino,
            'Para su atención y respuesta en el plazo establecido. Asunto prioritario que requiere coordinación con el área de presupuesto.',
            5,
            30,
            'En Proceso'
        );

        -- Actualizar estatus del documento
        UPDATE tbl_documento_entrante
        SET estatus_general = 'Turnado'
        WHERE id_doc_entrante = v_doc;

        RAISE NOTICE 'Se creó 1 turnado de prueba';
    END IF;
END $$;

-- ============================================================================
-- NOTIFICACIONES DE PRUEBA
-- ============================================================================

COMMENT ON TABLE tbl_notificaciones IS 'Las notificaciones se generan automáticamente por triggers o por la aplicación';

-- ============================================================================
-- DOCUMENTOS SALIENTES DE PRUEBA
-- ============================================================================

DO $$
DECLARE
    v_ua_emisora UUID;
    v_remitente_dest UUID;
    v_doc_entrante_ref UUID;
BEGIN
    SELECT id_ua INTO v_ua_emisora FROM cat_unidad_administrativa WHERE codigo_ua = 'DG-TI' LIMIT 1;
    SELECT id_remitente INTO v_remitente_dest FROM cat_remitente LIMIT 1;
    SELECT id_doc_entrante INTO v_doc_entrante_ref FROM tbl_documento_entrante LIMIT 1;

    IF v_ua_emisora IS NOT NULL THEN
        INSERT INTO tbl_documento_saliente (
            tipo_doc,
            numero_folio,
            ejercicio_fiscal,
            asunto,
            contenido,
            destinatario_nombre,
            destinatario_cargo,
            id_remitente_destino,
            id_ua_emisora,
            id_doc_entrante_ref,
            estatus_saliente
        ) VALUES (
            'Oficio',
            'DGTI/DIR/001/2025',
            2025,
            'Respuesta a solicitud de información sobre presupuesto de TI',
            'En atención a su oficio...',
            'Lic. María Fernanda González Pérez',
            'Subsecretaria de Egresos',
            v_remitente_dest,
            v_ua_emisora,
            v_doc_entrante_ref,
            'Borrador'
        );

        RAISE NOTICE 'Se creó 1 documento saliente de prueba';
    END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT '✅ DATOS DE PRUEBA CREADOS' as estado;

SELECT
    'Documentos Entrantes' as tipo,
    COUNT(*) as total
FROM tbl_documento_entrante
UNION ALL
SELECT 'Remitentes', COUNT(*) FROM cat_remitente
UNION ALL
SELECT 'Turnados', COUNT(*) FROM tbl_turnado
UNION ALL
SELECT 'Documentos Salientes', COUNT(*) FROM tbl_documento_saliente
UNION ALL
SELECT 'Unidades Administrativas', COUNT(*) FROM cat_unidad_administrativa;
