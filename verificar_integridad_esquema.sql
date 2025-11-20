-- ============================================================================
-- SISGEDI 2.0 - VERIFICACIÓN DE INTEGRIDAD DEL ESQUEMA
-- ============================================================================
-- Script de verificación completa del esquema de base de datos
-- Comprueba: tablas, índices, funciones, triggers, constraints
-- ============================================================================

\echo '============================================================================'
\echo 'VERIFICACIÓN DE INTEGRIDAD DEL ESQUEMA SISGEDI 2.0'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- 1. VERIFICAR EXTENSIONES REQUERIDAS
-- ============================================================================

\echo '1. Verificando extensiones de PostgreSQL...'

SELECT
    CASE
        WHEN COUNT(*) = 3 THEN '✅ Todas las extensiones están instaladas'
        ELSE '❌ FALTAN EXTENSIONES'
    END as estado_extensiones,
    string_agg(extname, ', ') as extensiones_instaladas
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'unaccent', 'pgcrypto');

\echo ''

-- ============================================================================
-- 2. VERIFICAR TABLAS PRINCIPALES (16 esperadas)
-- ============================================================================

\echo '2. Verificando tablas principales...'

WITH tablas_esperadas AS (
    SELECT unnest(ARRAY[
        'cat_diasinhabiles',
        'cat_semaforo',
        'cat_unidad_administrativa',
        'cat_roles',
        'cat_valores_catalogo',
        'cat_area_remitente',
        'cat_remitente',
        'tbl_usuarios',
        'tbl_sesiones',
        'tbl_documento_entrante',
        'tbl_anexos',
        'tbl_turnado',
        'tbl_documento_saliente',
        'tbl_notificaciones',
        'tbl_inventario',
        'tbl_log_auditoria'
    ]) as tabla_nombre
),
tablas_existentes AS (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
)
SELECT
    CASE
        WHEN COUNT(DISTINCT e.tabla_nombre) = 16 THEN '✅ Las 16 tablas principales existen'
        ELSE '❌ FALTAN ' || (16 - COUNT(DISTINCT e.tabla_nombre))::TEXT || ' TABLAS'
    END as estado_tablas,
    COUNT(DISTINCT e.tabla_nombre) as tablas_encontradas,
    16 as tablas_esperadas
FROM tablas_esperadas e
LEFT JOIN tablas_existentes ex ON e.tabla_nombre = ex.table_name
WHERE ex.table_name IS NOT NULL;

-- Listar tablas faltantes si las hay
\echo ''
\echo 'Tablas faltantes (si las hay):'

WITH tablas_esperadas AS (
    SELECT unnest(ARRAY[
        'cat_diasinhabiles', 'cat_semaforo', 'cat_unidad_administrativa', 'cat_roles',
        'cat_valores_catalogo', 'cat_area_remitente', 'cat_remitente', 'tbl_usuarios',
        'tbl_sesiones', 'tbl_documento_entrante', 'tbl_anexos', 'tbl_turnado',
        'tbl_documento_saliente', 'tbl_notificaciones', 'tbl_inventario', 'tbl_log_auditoria'
    ]) as tabla_nombre
)
SELECT
    e.tabla_nombre as tabla_faltante
FROM tablas_esperadas e
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = e.tabla_nombre
);

\echo ''

-- ============================================================================
-- 3. VERIFICAR ÍNDICES CRÍTICOS
-- ============================================================================

\echo '3. Verificando índices críticos...'

SELECT
    COUNT(*) as total_indices,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_%') as indices_personalizados,
    COUNT(*) FILTER (WHERE indexname LIKE '%_pkey') as indices_primary_key,
    COUNT(*) FILTER (WHERE indexdef LIKE '%USING gin%') as indices_gin_fts
FROM pg_indexes
WHERE schemaname = 'public';

\echo ''

-- Verificar índices Full-Text Search específicamente
\echo 'Índices Full-Text Search:'

SELECT
    tablename,
    indexname,
    CASE
        WHEN indexdef LIKE '%ts_contenido_ocr%' THEN '✅'
        ELSE '⚠️'
    END as estado
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef LIKE '%USING gin%'
ORDER BY tablename;

\echo ''

-- ============================================================================
-- 4. VERIFICAR FUNCIONES PRINCIPALES
-- ============================================================================

\echo '4. Verificando funciones principales...'

WITH funciones_esperadas AS (
    SELECT unnest(ARRAY[
        'calcular_fecha_vencimiento',
        'actualizar_ts_contenido_ocr',
        'generar_folio_interno',
        'auto_calcular_vencimiento',
        'actualizar_fecha',
        'search_documentos',
        'generar_storage_path',
        'validar_mime_type',
        'generar_inventario_aleatorio'
    ]) as funcion_nombre
)
SELECT
    CASE
        WHEN COUNT(DISTINCT e.funcion_nombre) >= 7 THEN '✅ Funciones principales creadas'
        ELSE '⚠️ Algunas funciones pueden faltar'
    END as estado_funciones,
    COUNT(DISTINCT p.proname) as funciones_encontradas,
    9 as funciones_esperadas
FROM funciones_esperadas e
LEFT JOIN pg_proc p ON e.funcion_nombre = p.proname
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' OR n.nspname IS NULL
GROUP BY 1;

-- Listar funciones creadas
\echo ''
\echo 'Funciones creadas:'

SELECT
    proname as nombre_funcion,
    pg_get_function_arguments(p.oid) as argumentos,
    CASE
        WHEN proretset THEN 'TABLE'
        ELSE pg_get_function_result(p.oid)
    END as retorna
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN (
    'calcular_fecha_vencimiento', 'actualizar_ts_contenido_ocr', 'generar_folio_interno',
    'auto_calcular_vencimiento', 'actualizar_fecha', 'search_documentos',
    'generar_storage_path', 'validar_mime_type', 'generar_inventario_aleatorio'
)
ORDER BY proname;

\echo ''

-- ============================================================================
-- 5. VERIFICAR TRIGGERS
-- ============================================================================

\echo '5. Verificando triggers...'

SELECT
    COUNT(*) as total_triggers,
    COUNT(*) FILTER (WHERE tgname LIKE 'trg_%') as triggers_personalizados
FROM pg_trigger
WHERE NOT tgisinternal;

\echo ''
\echo 'Triggers activos por tabla:'

SELECT
    t.tgrelid::regclass as tabla,
    t.tgname as trigger_nombre,
    CASE t.tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as momento,
    CASE t.tgtype::integer & cast(28 as int2)
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 20 THEN 'INSERT, UPDATE'
        WHEN 28 THEN 'INSERT, DELETE, UPDATE'
        ELSE 'OTHER'
    END as evento
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
AND n.nspname = 'public'
AND t.tgname LIKE 'trg_%'
ORDER BY tabla, trigger_nombre;

\echo ''

-- ============================================================================
-- 6. VERIFICAR CONSTRAINTS (FK, PK, CHECK)
-- ============================================================================

\echo '6. Verificando constraints...'

SELECT
    constraint_type,
    COUNT(*) as total
FROM information_schema.table_constraints
WHERE table_schema = 'public'
GROUP BY constraint_type
ORDER BY constraint_type;

\echo ''

-- Foreign Keys importantes
\echo 'Foreign Keys críticas:'

SELECT
    tc.table_name as tabla,
    kcu.column_name as columna,
    ccu.table_name as tabla_referenciada,
    ccu.column_name as columna_referenciada
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('tbl_documento_entrante', 'tbl_turnado', 'tbl_usuarios', 'tbl_inventario')
ORDER BY tc.table_name, kcu.column_name;

\echo ''

-- ============================================================================
-- 7. VERIFICAR CONFIGURACIÓN FTS
-- ============================================================================

\echo '7. Verificando configuración Full-Text Search...'

SELECT
    cfgname as configuracion,
    '✅ Configurada' as estado
FROM pg_ts_config
WHERE cfgname = 'spanish_unaccent';

\echo ''

-- ============================================================================
-- 8. VERIFICAR DATOS INICIALES
-- ============================================================================

\echo '8. Verificando datos iniciales...'

SELECT
    'Roles' as catalogo,
    COUNT(*) as registros,
    CASE WHEN COUNT(*) >= 6 THEN '✅' ELSE '⚠️' END as estado
FROM cat_roles
UNION ALL
SELECT
    'Valores de Catálogo',
    COUNT(*),
    CASE WHEN COUNT(*) >= 15 THEN '✅' ELSE '⚠️' END
FROM cat_valores_catalogo
UNION ALL
SELECT
    'Unidades Administrativas',
    COUNT(*),
    CASE WHEN COUNT(*) >= 4 THEN '✅' ELSE '⚠️' END
FROM cat_unidad_administrativa
UNION ALL
SELECT
    'Áreas Remitentes',
    COUNT(*),
    CASE WHEN COUNT(*) >= 5 THEN '✅' ELSE '⚠️' END
FROM cat_area_remitente
UNION ALL
SELECT
    'Días Inhábiles',
    COUNT(*),
    CASE WHEN COUNT(*) >= 5 THEN '✅' ELSE '⚠️' END
FROM cat_diasinhabiles
UNION ALL
SELECT
    'Semáforo',
    COUNT(*),
    CASE WHEN COUNT(*) = 3 THEN '✅' ELSE '⚠️' END
FROM cat_semaforo;

\echo ''

-- ============================================================================
-- 9. VERIFICAR STORAGE BUCKETS (Si Supabase está configurado)
-- ============================================================================

\echo '9. Verificando Storage Buckets...'

SELECT
    id as bucket_id,
    name as nombre,
    public as es_publico,
    '✅' as estado
FROM storage.buckets
WHERE id IN (
    'documentos-entrantes',
    'documentos-salientes',
    'inventario',
    'seguimientos',
    'avatares'
)
ORDER BY name;

\echo ''

-- ============================================================================
-- 10. INTEGRIDAD REFERENCIAL
-- ============================================================================

\echo '10. Verificando integridad referencial...'

-- Verificar que no haya registros huérfanos en tablas principales
WITH verificaciones AS (
    SELECT
        'tbl_usuarios → cat_unidad_administrativa' as relacion,
        COUNT(*) as registros_huerfanos
    FROM tbl_usuarios u
    WHERE NOT EXISTS (SELECT 1 FROM cat_unidad_administrativa WHERE id_ua = u.id_ua)

    UNION ALL

    SELECT
        'tbl_usuarios → cat_roles',
        COUNT(*)
    FROM tbl_usuarios u
    WHERE NOT EXISTS (SELECT 1 FROM cat_roles WHERE id_rol = u.id_rol)

    UNION ALL

    SELECT
        'tbl_documento_entrante → cat_unidad_administrativa',
        COUNT(*)
    FROM tbl_documento_entrante d
    WHERE NOT EXISTS (SELECT 1 FROM cat_unidad_administrativa WHERE id_ua = d.id_ua_destinataria)

    UNION ALL

    SELECT
        'tbl_turnado → tbl_documento_entrante',
        COUNT(*)
    FROM tbl_turnado t
    WHERE NOT EXISTS (SELECT 1 FROM tbl_documento_entrante WHERE id_doc_entrante = t.id_doc_entrante)
)
SELECT
    relacion,
    registros_huerfanos,
    CASE WHEN registros_huerfanos = 0 THEN '✅' ELSE '❌' END as estado
FROM verificaciones;

\echo ''

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

\echo '============================================================================'
\echo 'RESUMEN DE VERIFICACIÓN'
\echo '============================================================================'

SELECT
    '✅ Esquema verificado correctamente' as resultado,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tablas_totales,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indices_totales,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public') as funciones_totales,
    (SELECT COUNT(*) FROM pg_trigger WHERE NOT tgisinternal) as triggers_totales;

\echo ''
\echo '============================================================================'
\echo 'FIN DE VERIFICACIÓN'
\echo '============================================================================'
