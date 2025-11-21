-- ============================================================================
-- SISGEDI 2.0 - GENERADOR DE INVENTARIO ALEATORIO
-- ============================================================================
-- Script para generar datos de inventario de prueba con valores realistas
-- Ejecutar DESPUÉS del esquema principal y datos de prueba
-- ============================================================================

-- Función para generar inventario aleatorio
CREATE OR REPLACE FUNCTION generar_inventario_aleatorio(p_cantidad INT DEFAULT 100)
RETURNS TABLE (
    total_generado INT,
    valor_total_inventario NUMERIC
) AS $$
DECLARE
    v_contador INT := 0;
    v_ua UUID;
    v_categoria TEXT;
    v_subcategoria TEXT;
    v_descripcion TEXT;
    v_marca TEXT;
    v_modelo TEXT;
    v_serie TEXT;
    v_estado TEXT;
    v_ubicacion TEXT;
    v_responsable TEXT;
    v_numero_inventario TEXT;
    v_valor_unitario NUMERIC;
    v_cantidad INT;
    v_unidad TEXT;
    v_fecha_adq DATE;
    v_proveedor TEXT;
    v_anio INT;

    -- Arrays de datos aleatorios
    arr_categorias TEXT[] := ARRAY[
        'Mobiliario', 'Equipo de Cómputo', 'Equipo de Oficina', 'Vehículos',
        'Equipo de Comunicación', 'Herramientas', 'Equipo Médico', 'Equipo de Seguridad',
        'Equipo Audiovisual', 'Climatización', 'Instrumentos de Medición'
    ];

    arr_marcas_computo TEXT[] := ARRAY[
        'Dell', 'HP', 'Lenovo', 'Apple', 'Acer', 'ASUS', 'Samsung', 'Microsoft', 'Toshiba'
    ];

    arr_marcas_mobiliario TEXT[] := ARRAY[
        'Steelcase', 'Herman Miller', 'IKEA', 'Haworth', 'Knoll', 'Officina', 'Teknion'
    ];

    arr_marcas_vehiculos TEXT[] := ARRAY[
        'Toyota', 'Nissan', 'Ford', 'Chevrolet', 'Volkswagen', 'Honda', 'Mazda'
    ];

    arr_estados TEXT[] := ARRAY['Excelente', 'Bueno', 'Regular', 'Malo'];

    arr_ubicaciones TEXT[] := ARRAY[
        'Edificio A - Piso 1', 'Edificio A - Piso 2', 'Edificio A - Piso 3',
        'Edificio B - Piso 1', 'Edificio B - Piso 2', 'Edificio C - Planta Baja',
        'Almacén General', 'Bodega Norte', 'Bodega Sur', 'Estacionamiento'
    ];

    arr_responsables TEXT[] := ARRAY[
        'Ing. Pedro Ramírez López', 'Lic. Ana María Sánchez García', 'Mtro. Carlos Hernández Ruiz',
        'Dra. Laura Patricia Gómez Torres', 'Ing. Roberto Jiménez Valdez', 'Lic. María Fernanda Martínez Cruz',
        'C.P. Jorge Alberto Díaz Morales', 'Arq. Sandra Elizabeth Pérez Luna', 'Ing. Fernando García Domínguez',
        'Lic. Gabriela Ortiz Mendoza', 'Mtro. Eduardo Sánchez Vera', 'Dra. Mónica Torres Sánchez'
    ];

    arr_proveedores TEXT[] := ARRAY[
        'Computadoras y Equipos SA de CV', 'Mobiliario Corporativo del Centro',
        'Distribuidora de Tecnología Avanzada', 'Equipos y Suministros Profesionales',
        'Soluciones Integrales de Oficina', 'Grupo Comercial de Equipamiento',
        'Proveeduría Nacional de Activos', 'Comercializadora de Bienes Empresariales'
    ];

    arr_uas UUID[];
BEGIN
    -- Obtener todas las UAs disponibles
    SELECT ARRAY_AGG(id_ua) INTO arr_uas
    FROM cat_unidad_administrativa
    WHERE estatus = TRUE;

    IF arr_uas IS NULL OR array_length(arr_uas, 1) = 0 THEN
        RAISE EXCEPTION 'No hay unidades administrativas disponibles';
    END IF;

    -- Generar registros
    FOR i IN 1..p_cantidad LOOP
        -- Seleccionar categoría aleatoria
        v_categoria := arr_categorias[1 + floor(random() * array_length(arr_categorias, 1))];

        -- UA aleatoria
        v_ua := arr_uas[1 + floor(random() * array_length(arr_uas, 1))];

        -- Estado aleatorio (80% Excelente/Bueno, 15% Regular, 5% Malo)
        CASE
            WHEN random() < 0.50 THEN v_estado := 'Excelente';
            WHEN random() < 0.80 THEN v_estado := 'Bueno';
            WHEN random() < 0.95 THEN v_estado := 'Regular';
            ELSE v_estado := 'Malo';
        END CASE;

        -- Datos según categoría
        CASE v_categoria
            WHEN 'Equipo de Cómputo' THEN
                v_subcategoria := (ARRAY['Computadora de Escritorio', 'Laptop', 'Servidor', 'Impresora', 'Scanner', 'Monitor'])[1 + floor(random() * 6)];
                v_marca := arr_marcas_computo[1 + floor(random() * array_length(arr_marcas_computo, 1))];
                v_modelo := 'Modelo-' || (2020 + floor(random() * 5))::TEXT || '-' || chr(65 + floor(random() * 26)::INT);
                v_serie := 'SN' || LPAD(floor(random() * 999999999)::TEXT, 9, '0');
                v_descripcion := v_subcategoria || ' ' || v_marca || ' ' || v_modelo;
                v_valor_unitario := 5000 + (random() * 45000)::NUMERIC(10,2);
                v_cantidad := 1;
                v_unidad := 'Pieza';

            WHEN 'Mobiliario' THEN
                v_subcategoria := (ARRAY['Escritorio', 'Silla Ejecutiva', 'Archivero', 'Librero', 'Mesa de Juntas', 'Silla de Visita'])[1 + floor(random() * 6)];
                v_marca := arr_marcas_mobiliario[1 + floor(random() * array_length(arr_marcas_mobiliario, 1))];
                v_modelo := 'MOD-' || (floor(random() * 9000) + 1000)::TEXT;
                v_serie := 'MUE' || LPAD(floor(random() * 9999999)::TEXT, 7, '0');
                v_descripcion := v_subcategoria || ' ' || v_marca || ' color ' || (ARRAY['Negro', 'Gris', 'Madera', 'Blanco'])[1 + floor(random() * 4)];
                v_valor_unitario := 2000 + (random() * 18000)::NUMERIC(10,2);
                v_cantidad := CASE WHEN v_subcategoria IN ('Silla de Visita', 'Silla Ejecutiva')
                    THEN 1 + floor(random() * 5)::INT
                    ELSE 1 END;
                v_unidad := 'Pieza';

            WHEN 'Vehículos' THEN
                v_subcategoria := (ARRAY['Automóvil Sedán', 'Camioneta', 'Pickup', 'Van'])[1 + floor(random() * 4)];
                v_marca := arr_marcas_vehiculos[1 + floor(random() * array_length(arr_marcas_vehiculos, 1))];
                v_modelo := (2018 + floor(random() * 7))::TEXT;
                v_serie := 'VEH' || chr(65 + floor(random() * 26)::INT) || LPAD(floor(random() * 999999)::TEXT, 6, '0');
                v_descripcion := v_subcategoria || ' ' || v_marca || ' año ' || v_modelo;
                v_valor_unitario := 180000 + (random() * 420000)::NUMERIC(10,2);
                v_cantidad := 1;
                v_unidad := 'Unidad';

            WHEN 'Equipo de Oficina' THEN
                v_subcategoria := (ARRAY['Teléfono', 'Fax', 'Engargoladora', 'Trituradora', 'Calculadora', 'Proyector'])[1 + floor(random() * 6)];
                v_marca := (ARRAY['Canon', 'Epson', 'Brother', 'Panasonic', 'Sony', 'BenQ'])[1 + floor(random() * 6)];
                v_modelo := 'MOD-' || chr(65 + floor(random() * 26)::INT) || (floor(random() * 900) + 100)::TEXT;
                v_serie := 'EQO' || LPAD(floor(random() * 99999999)::TEXT, 8, '0');
                v_descripcion := v_subcategoria || ' ' || v_marca || ' ' || v_modelo;
                v_valor_unitario := 800 + (random() * 14200)::NUMERIC(10,2);
                v_cantidad := CASE WHEN v_subcategoria IN ('Teléfono', 'Calculadora')
                    THEN 1 + floor(random() * 10)::INT
                    ELSE 1 END;
                v_unidad := 'Pieza';

            WHEN 'Climatización' THEN
                v_subcategoria := (ARRAY['Aire Acondicionado', 'Ventilador', 'Calentador'])[1 + floor(random() * 3)];
                v_marca := (ARRAY['LG', 'Samsung', 'Carrier', 'York', 'Mitsubishi'])[1 + floor(random() * 5)];
                v_modelo := (floor(random() * 9000) + 1000)::TEXT || '-' || chr(65 + floor(random() * 26)::INT);
                v_serie := 'CLIM' || LPAD(floor(random() * 9999999)::TEXT, 7, '0');
                v_descripcion := v_subcategoria || ' ' || v_marca || ' ' || (floor(random() * 24) + 12)::TEXT || ' BTU';
                v_valor_unitario := 5000 + (random() * 25000)::NUMERIC(10,2);
                v_cantidad := 1;
                v_unidad := 'Unidad';

            ELSE
                v_subcategoria := 'Diversos';
                v_marca := 'Genérica';
                v_modelo := 'STD-' || (floor(random() * 999) + 1)::TEXT;
                v_serie := 'GEN' || LPAD(floor(random() * 99999999)::TEXT, 8, '0');
                v_descripcion := v_categoria || ' - ' || v_subcategoria;
                v_valor_unitario := 500 + (random() * 9500)::NUMERIC(10,2);
                v_cantidad := 1 + floor(random() * 5)::INT;
                v_unidad := 'Pieza';
        END CASE;

        -- Datos comunes
        v_ubicacion := arr_ubicaciones[1 + floor(random() * array_length(arr_ubicaciones, 1))];
        v_responsable := arr_responsables[1 + floor(random() * array_length(arr_responsables, 1))];
        v_proveedor := arr_proveedores[1 + floor(random() * array_length(arr_proveedores, 1))];

        -- Fecha de adquisición (últimos 10 años)
        v_anio := 2015 + floor(random() * 10)::INT;
        v_fecha_adq := (v_anio || '-' || LPAD((1 + floor(random() * 12))::TEXT, 2, '0') || '-' || LPAD((1 + floor(random() * 28))::TEXT, 2, '0'))::DATE;

        -- Número de inventario único
        v_numero_inventario := 'INV-' || v_anio::TEXT || '-' || LPAD((v_contador + 1)::TEXT, 6, '0');

        -- Insertar registro
        INSERT INTO tbl_inventario (
            categoria,
            subcategoria,
            descripcion,
            marca,
            modelo,
            numero_serie,
            cantidad,
            unidad,
            estado,
            id_ua,
            ubicacion_fisica,
            responsable,
            numero_inventario,
            fecha_adquisicion,
            valor_unitario,
            valor_total,
            proveedor,
            metadata
        ) VALUES (
            v_categoria,
            v_subcategoria,
            v_descripcion,
            v_marca,
            v_modelo,
            v_serie,
            v_cantidad,
            v_unidad,
            v_estado,
            v_ua,
            v_ubicacion,
            v_responsable,
            v_numero_inventario,
            v_fecha_adq,
            v_valor_unitario,
            v_valor_unitario * v_cantidad,
            v_proveedor,
            jsonb_build_object(
                'generado_automaticamente', true,
                'fecha_generacion', NOW(),
                'version', '1.0'
            )
        );

        v_contador := v_contador + 1;
    END LOOP;

    -- Retornar estadísticas
    RETURN QUERY
    SELECT
        v_contador::INT as total_generado,
        (SELECT COALESCE(SUM(valor_total), 0) FROM tbl_inventario)::NUMERIC as valor_total_inventario;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_inventario_aleatorio IS 'Genera registros de inventario con datos aleatorios pero realistas para pruebas';

-- ============================================================================
-- EJECUTAR GENERACIÓN
-- ============================================================================

-- Generar 150 elementos de inventario
SELECT * FROM generar_inventario_aleatorio(150);

-- ============================================================================
-- ESTADÍSTICAS DEL INVENTARIO GENERADO
-- ============================================================================

-- Resumen por categoría
SELECT
    categoria,
    COUNT(*) as total_items,
    SUM(cantidad) as cantidad_total,
    TO_CHAR(SUM(valor_total), 'FM$999,999,999.00') as valor_total_categoria,
    TO_CHAR(AVG(valor_unitario), 'FM$999,999.00') as valor_promedio
FROM tbl_inventario
GROUP BY categoria
ORDER BY SUM(valor_total) DESC;

-- Resumen por estado
SELECT
    estado,
    COUNT(*) as total_items,
    TO_CHAR(SUM(valor_total), 'FM$999,999,999.00') as valor_total,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tbl_inventario)), 2) || '%' as porcentaje
FROM tbl_inventario
GROUP BY estado
ORDER BY COUNT(*) DESC;

-- Resumen por unidad administrativa
SELECT
    u.nombre_ua,
    u.codigo_ua,
    COUNT(i.*) as total_items,
    TO_CHAR(SUM(i.valor_total), 'FM$999,999,999.00') as valor_total
FROM tbl_inventario i
JOIN cat_unidad_administrativa u ON i.id_ua = u.id_ua
GROUP BY u.nombre_ua, u.codigo_ua
ORDER BY SUM(i.valor_total) DESC;

-- Top 10 items más valiosos
SELECT
    numero_inventario,
    categoria,
    descripcion,
    estado,
    TO_CHAR(valor_total, 'FM$999,999,999.00') as valor,
    fecha_adquisicion
FROM tbl_inventario
ORDER BY valor_total DESC
LIMIT 10;

-- Antigüedad del inventario
SELECT
    EXTRACT(YEAR FROM fecha_adquisicion) as anio_adquisicion,
    COUNT(*) as total_items,
    TO_CHAR(SUM(valor_total), 'FM$999,999,999.00') as valor_total
FROM tbl_inventario
GROUP BY EXTRACT(YEAR FROM fecha_adquisicion)
ORDER BY anio_adquisicion DESC;

-- ============================================================================
-- RESULTADO FINAL
-- ============================================================================

SELECT
    '✅ INVENTARIO ALEATORIO GENERADO' as estado,
    (SELECT COUNT(*) FROM tbl_inventario) as total_registros,
    (SELECT COUNT(DISTINCT categoria) FROM tbl_inventario) as categorias_unicas,
    (SELECT TO_CHAR(SUM(valor_total), 'FM$999,999,999.00') FROM tbl_inventario) as valor_total_inventario;
