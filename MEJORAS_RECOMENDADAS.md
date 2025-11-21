# MEJORAS RECOMENDADAS PARA SISGEDI 2.0

## 🔍 ANÁLISIS HONESTO DEL ESTADO ACTUAL

**Fecha:** 21 de Noviembre de 2025
**Estado:** Solo existe documentación y esquema SQL - NO HAY APLICACIÓN

---

## ✅ MEJORAS AL ESQUEMA DE BASE DE DATOS

### 1. Agregar validaciones faltantes

```sql
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
```

### 2. Índices compuestos para consultas frecuentes

```sql
-- Búsqueda de documentos por UA y fecha
CREATE INDEX idx_doc_entrante_ua_fecha
ON tbl_documento_entrante(id_ua_registro, fecha_registro DESC);

-- Turnados pendientes por UA destino
CREATE INDEX idx_turnado_destino_estatus
ON tbl_turnado(id_ua_destino, estatus_turnado)
WHERE estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso');

-- Documentos con vencimiento próximo
CREATE INDEX idx_turnado_vencimiento_pendiente
ON tbl_turnado(fecha_vencimiento)
WHERE estatus_turnado != 'Concluido' AND porcentaje_avance < 100;
```

### 3. Particionamiento para escalabilidad

```sql
-- Particionar tbl_log_auditoria por mes (retención 7 años)
CREATE TABLE tbl_log_auditoria_partitioned (
    LIKE tbl_log_auditoria INCLUDING ALL
) PARTITION BY RANGE (fecha_hora);

-- Crear particiones automáticas
CREATE TABLE tbl_log_auditoria_2025_11 PARTITION OF tbl_log_auditoria_partitioned
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Script para crear particiones futuras automáticamente
CREATE OR REPLACE FUNCTION crear_particion_auditoria()
RETURNS void AS $$
DECLARE
    fecha_inicio DATE;
    fecha_fin DATE;
    nombre_particion TEXT;
BEGIN
    fecha_inicio := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    fecha_fin := fecha_inicio + INTERVAL '1 month';
    nombre_particion := 'tbl_log_auditoria_' || TO_CHAR(fecha_inicio, 'YYYY_MM');

    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF tbl_log_auditoria_partitioned
         FOR VALUES FROM (%L) TO (%L)',
        nombre_particion, fecha_inicio, fecha_fin
    );
END;
$$ LANGUAGE plpgsql;
```

### 4. Mejorar función de búsqueda Full-Text

```sql
-- Agregar búsqueda por rangos de fecha
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
    snippet TEXT  -- Extracto del texto con palabras resaltadas
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
        d.ts_contenido_ocr @@ websearch_to_tsquery('spanish_unaccent', p_query)
        AND (p_id_ua IS NULL OR d.id_ua_registro = p_id_ua)
        AND (p_fecha_inicio IS NULL OR d.fecha_registro::date >= p_fecha_inicio)
        AND (p_fecha_fin IS NULL OR d.fecha_registro::date <= p_fecha_fin)
        AND (p_estatus IS NULL OR d.estatus_general = p_estatus)
    ORDER BY rank DESC, d.fecha_registro DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Función para dashboard (indicadores Verde/Amarillo/Rojo)

```sql
CREATE OR REPLACE FUNCTION obtener_indicadores_dashboard(p_id_ua UUID)
RETURNS TABLE (
    total_documentos BIGINT,
    verdes BIGINT,      -- Más de 3 días para vencer
    amarillos BIGINT,   -- 1-3 días para vencer
    rojos BIGINT,       -- Vencidos
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
    WHERE t.id_ua_destino = p_id_ua
      AND t.estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso')
      AND t.porcentaje_avance < 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6. Trigger para notificaciones automáticas

```sql
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
        'El documento ' || de.folio_interno || ' vence mañana',
        t.id_turnado
    FROM tbl_turnado t
    JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
    JOIN tbl_usuarios u ON u.id_ua = t.id_ua_destino
    WHERE t.fecha_vencimiento BETWEEN NOW() AND NOW() + INTERVAL '1 day'
      AND t.estatus_turnado IN ('Turnado', 'Recibido', 'En_Proceso')
      AND t.porcentaje_avance < 100
      AND NOT EXISTS (
          SELECT 1 FROM tbl_notificaciones n
          WHERE n.id_turnado = t.id_turnado
            AND n.tipo_notificacion = 'Vencimiento_Proximo'
            AND n.fecha_creacion > NOW() - INTERVAL '1 day'
      );
END;
$$ LANGUAGE plpgsql;

-- Programar ejecución diaria (requiere pg_cron extension)
-- SELECT cron.schedule('notificaciones-vencimiento', '0 8 * * *', 'SELECT fn_crear_notificacion_vencimiento()');
```

### 7. Vista materializada para reportes rápidos

```sql
CREATE MATERIALIZED VIEW mv_reporte_documentos AS
SELECT
    de.id_doc_entrante,
    de.folio_interno,
    de.numero_oficio_externo,
    de.asunto,
    de.fecha_registro,
    de.estatus_general,
    ua.nombre_ua as unidad_administrativa,
    u.nombre_completo as registrado_por,
    p.valor as prioridad,
    COUNT(DISTINCT t.id_turnado) as total_turnos,
    MAX(t.fecha_vencimiento) as fecha_vencimiento,
    MAX(t.porcentaje_avance) as avance_actual
FROM tbl_documento_entrante de
JOIN cat_unidad_administrativa ua ON de.id_ua_registro = ua.id_ua
JOIN tbl_usuarios u ON de.id_usuario_registro = u.id_usuario
LEFT JOIN cat_valores_catalogo p ON de.id_prioridad = p.id_valor_catalogo
LEFT JOIN tbl_turnado t ON de.id_doc_entrante = t.id_doc_entrante
GROUP BY de.id_doc_entrante, ua.nombre_ua, u.nombre_completo, p.valor;

-- Índice para búsquedas rápidas
CREATE INDEX idx_mv_reporte_ua ON mv_reporte_documentos(unidad_administrativa);
CREATE INDEX idx_mv_reporte_fecha ON mv_reporte_documentos(fecha_registro DESC);

-- Refrescar automáticamente cada hora
-- SELECT cron.schedule('refresh-reporte', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_reporte_documentos');
```

---

## 🏗️ MEJORAS ARQUITECTÓNICAS

### 1. Separación de preocupaciones

**PROBLEMA ACTUAL:** Toda la lógica está en la base de datos

**SOLUCIÓN:**
```
┌─────────────────────────────────────────┐
│  FRONTEND (React)                       │
│  - Solo UI y validación básica          │
└────────────┬────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│  API LAYER (Supabase Edge Functions)    │
│  - Validación de negocio                │
│  - Orquestación de servicios            │
│  - Rate limiting                        │
└────────────┬────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│  DATABASE (PostgreSQL)                  │
│  - Solo datos y constraints             │
│  - RLS para seguridad                   │
└─────────────────────────────────────────┘
```

### 2. Implementar cache para consultas frecuentes

```javascript
// Ejemplo: Edge Function con Redis
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function handler(req: Request) {
  const { id_ua } = await req.json()

  // Intentar obtener de cache
  const cacheKey = `dashboard:${id_ua}`
  const cached = await redis.get(cacheKey)

  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Si no está en cache, consultar BD
  const supabase = createClient(...)
  const { data } = await supabase.rpc('obtener_indicadores_dashboard', { p_id_ua: id_ua })

  // Guardar en cache por 5 minutos
  await redis.setex(cacheKey, 300, JSON.stringify(data))

  return new Response(JSON.stringify(data))
}
```

### 3. Implementar Event-Driven Architecture

```sql
-- Tabla de eventos del sistema
CREATE TABLE tbl_eventos_sistema (
    id_evento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_evento VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    procesado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_procesamiento TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_eventos_pendientes ON tbl_eventos_sistema(procesado, fecha_creacion)
WHERE procesado = FALSE;
```

```javascript
// Worker que procesa eventos (envío de emails, notificaciones push, etc.)
async function procesarEventos() {
  const eventos = await obtenerEventosPendientes()

  for (const evento of eventos) {
    switch (evento.tipo_evento) {
      case 'DOCUMENTO_TURNADO':
        await enviarEmailTurnado(evento.payload)
        break
      case 'DOCUMENTO_VENCIDO':
        await enviarNotificacionPush(evento.payload)
        break
    }

    await marcarEventoProcesado(evento.id_evento)
  }
}
```

---

## 🚀 MEJORAS DE PERFORMANCE

### 1. Implementar paginación cursor-based

```sql
-- Más eficiente que OFFSET para grandes volúmenes
CREATE OR REPLACE FUNCTION listar_documentos_cursor(
    p_id_ua UUID,
    p_cursor TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id_doc_entrante UUID,
    folio_interno VARCHAR,
    asunto TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE,
    next_cursor TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id_doc_entrante,
        d.folio_interno,
        d.asunto,
        d.fecha_registro,
        d.fecha_registro as next_cursor
    FROM tbl_documento_entrante d
    WHERE d.id_ua_registro = p_id_ua
      AND (p_cursor IS NULL OR d.fecha_registro < p_cursor)
    ORDER BY d.fecha_registro DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

### 2. Optimización de consultas N+1

```typescript
// MAL: N+1 queries
const documentos = await obtenerDocumentos()
for (const doc of documentos) {
  const turnos = await obtenerTurnos(doc.id)  // 1 query por documento
}

// BIEN: 1 query con JOIN
const documentosConTurnos = await supabase
  .from('tbl_documento_entrante')
  .select(`
    *,
    turnos:tbl_turnado(*)
  `)
```

---

## 🔒 MEJORAS DE SEGURIDAD

### 1. Implementar rate limiting

```sql
CREATE TABLE tbl_rate_limit (
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),
    endpoint VARCHAR(100),
    intentos INT DEFAULT 0,
    ventana_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_usuario, endpoint)
);

CREATE OR REPLACE FUNCTION verificar_rate_limit(
    p_id_usuario UUID,
    p_endpoint VARCHAR,
    p_max_intentos INT DEFAULT 100,
    p_ventana_minutos INT DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_intentos INT;
    v_ventana_inicio TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT intentos, ventana_inicio INTO v_intentos, v_ventana_inicio
    FROM tbl_rate_limit
    WHERE id_usuario = p_id_usuario AND endpoint = p_endpoint;

    -- Si no existe, crear registro
    IF NOT FOUND THEN
        INSERT INTO tbl_rate_limit (id_usuario, endpoint, intentos)
        VALUES (p_id_usuario, p_endpoint, 1);
        RETURN TRUE;
    END IF;

    -- Si la ventana expiró, resetear
    IF v_ventana_inicio < NOW() - (p_ventana_minutos || ' minutes')::INTERVAL THEN
        UPDATE tbl_rate_limit
        SET intentos = 1, ventana_inicio = NOW()
        WHERE id_usuario = p_id_usuario AND endpoint = p_endpoint;
        RETURN TRUE;
    END IF;

    -- Si excede el límite, rechazar
    IF v_intentos >= p_max_intentos THEN
        RETURN FALSE;
    END IF;

    -- Incrementar contador
    UPDATE tbl_rate_limit
    SET intentos = intentos + 1
    WHERE id_usuario = p_id_usuario AND endpoint = p_endpoint;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### 2. Encriptación de campos sensibles

```sql
-- Usar pgcrypto para encriptar datos sensibles
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ejemplo: Encriptar observaciones privadas
ALTER TABLE tbl_turnado ADD COLUMN observaciones_encriptadas BYTEA;

CREATE OR REPLACE FUNCTION encriptar_observaciones()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.observaciones IS NOT NULL THEN
        NEW.observaciones_encriptadas := pgp_sym_encrypt(
            NEW.observaciones,
            current_setting('app.encryption_key')
        );
        NEW.observaciones := NULL;  -- No guardar en texto plano
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_encriptar_observaciones
    BEFORE INSERT OR UPDATE ON tbl_turnado
    FOR EACH ROW
    EXECUTE FUNCTION encriptar_observaciones();
```

### 3. Auditoría de accesos a datos sensibles

```sql
CREATE TABLE tbl_accesos_datos_sensibles (
    id_acceso BIGSERIAL PRIMARY KEY,
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),
    tabla_accedida VARCHAR(100),
    id_registro_accedido UUID,
    tipo_acceso VARCHAR(20),  -- 'SELECT', 'UPDATE', 'DELETE'
    ip_origen INET,
    fecha_acceso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Log automático al acceder a documentos
CREATE OR REPLACE FUNCTION log_acceso_documento()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tbl_accesos_datos_sensibles (
        id_usuario, tabla_accedida, id_registro_accedido, tipo_acceso, ip_origen
    ) VALUES (
        auth.uid(),
        TG_TABLE_NAME,
        NEW.id_doc_entrante,
        TG_OP,
        inet_client_addr()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 MEJORAS DE MONITOREO

### 1. Métricas clave a trackear

```sql
CREATE TABLE tbl_metricas_sistema (
    id_metrica BIGSERIAL PRIMARY KEY,
    nombre_metrica VARCHAR(100),
    valor NUMERIC,
    etiquetas JSONB,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Función para registrar métricas
CREATE OR REPLACE FUNCTION registrar_metrica(
    p_nombre VARCHAR,
    p_valor NUMERIC,
    p_etiquetas JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
    INSERT INTO tbl_metricas_sistema (nombre_metrica, valor, etiquetas)
    VALUES (p_nombre, p_valor, p_etiquetas);
END;
$$ LANGUAGE plpgsql;

-- Ejemplos de uso en triggers
CREATE OR REPLACE FUNCTION metric_tiempo_turnado()
RETURNS TRIGGER AS $$
DECLARE
    tiempo_transcurrido INTERVAL;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.estatus_turnado = 'Recibido' AND OLD.estatus_turnado = 'Turnado' THEN
        tiempo_transcurrido := NEW.fecha_actualizacion - OLD.fecha_turnado;

        PERFORM registrar_metrica(
            'tiempo_recepcion_turnado_segundos',
            EXTRACT(EPOCH FROM tiempo_transcurrido),
            jsonb_build_object('ua_destino', NEW.id_ua_destino::text)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_metric_turnado
    AFTER UPDATE ON tbl_turnado
    FOR EACH ROW
    EXECUTE FUNCTION metric_tiempo_turnado();
```

### 2. Dashboard de salud del sistema

```sql
CREATE OR REPLACE VIEW v_salud_sistema AS
SELECT
    (SELECT COUNT(*) FROM tbl_usuarios WHERE estatus = 'Activo') as usuarios_activos,
    (SELECT COUNT(*) FROM tbl_sesiones WHERE estatus_sesion = 'Activa') as sesiones_activas,
    (SELECT COUNT(*) FROM tbl_documento_entrante WHERE fecha_registro > NOW() - INTERVAL '24 hours') as docs_ultimas_24h,
    (SELECT AVG(porcentaje_avance) FROM tbl_turnado WHERE estatus_turnado IN ('En_Proceso', 'Recibido')) as avance_promedio,
    (SELECT COUNT(*) FROM tbl_turnado WHERE fecha_vencimiento < NOW() AND estatus_turnado != 'Concluido') as documentos_vencidos,
    (SELECT pg_size_pretty(pg_database_size(current_database()))) as tamano_base_datos,
    (SELECT COUNT(*) FROM tbl_log_auditoria WHERE fecha_hora > NOW() - INTERVAL '1 hour') as eventos_ultima_hora;
```

---

## 🎯 MEJORAS DE USABILIDAD

### 1. Autocompletado inteligente

```sql
-- Sugerencias basadas en historial
CREATE OR REPLACE FUNCTION sugerir_turnado(
    p_id_usuario UUID,
    p_asunto TEXT
) RETURNS TABLE (
    id_ua_sugerida UUID,
    nombre_ua VARCHAR,
    veces_turnada BIGINT,
    ultima_vez TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Analizar a dónde ha turnado este usuario documentos similares
    RETURN QUERY
    SELECT
        t.id_ua_destino,
        ua.nombre_ua,
        COUNT(*) as veces_turnada,
        MAX(t.fecha_turnado) as ultima_vez
    FROM tbl_turnado t
    JOIN tbl_documento_entrante de ON t.id_doc_entrante = de.id_doc_entrante
    JOIN cat_unidad_administrativa ua ON t.id_ua_destino = ua.id_ua
    WHERE t.id_usuario_turno = p_id_usuario
      AND de.ts_contenido_ocr @@ websearch_to_tsquery('spanish_unaccent', p_asunto)
    GROUP BY t.id_ua_destino, ua.nombre_ua
    ORDER BY veces_turnada DESC, ultima_vez DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;
```

### 2. Plantillas de documentos frecuentes

```sql
CREATE TABLE tbl_plantillas_documentos (
    id_plantilla UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_plantilla VARCHAR(200) NOT NULL,
    tipo_documento VARCHAR(50),
    contenido_plantilla TEXT,
    variables JSONB,  -- {"nombre_destinatario": "", "fecha": ""}
    id_ua_propietaria UUID REFERENCES cat_unidad_administrativa(id_ua),
    uso_contador INT DEFAULT 0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📱 MEJORAS PARA MOBILE-FIRST

### 1. API optimizada para móviles

```typescript
// Respuesta ligera para móviles (solo datos esenciales)
interface DocumentoListaMobile {
  id: string
  folio: string
  asunto_corto: string  // Máx 100 caracteres
  fecha: string
  vencimiento: string
  prioridad: 'Normal' | 'Urgente'
  avatar_remitente: string  // URL optimizada
  badge_count: number  // Cantidad de turnos pendientes
}

// Endpoint específico para móvil
export async function listarDocumentosMobile(idUA: string) {
  const { data } = await supabase.rpc('listar_documentos_mobile', {
    p_id_ua: idUA,
    p_limit: 20
  })
  return data
}
```

### 2. Sincronización offline

```sql
-- Tabla de cambios pendientes para sincronizar
CREATE TABLE tbl_cambios_pendientes_sync (
    id_cambio UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario),
    tabla VARCHAR(100),
    operacion VARCHAR(10),  -- INSERT, UPDATE, DELETE
    datos JSONB,
    sincronizado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚡ QUICK WINS (Mejoras rápidas de implementar)

### 1. Contador de folios más robusto

```sql
-- Evitar race conditions con SEQUENCE
CREATE SEQUENCE seq_folio_entrante_2025;

CREATE OR REPLACE FUNCTION generar_folio_interno_mejorado()
RETURNS TRIGGER AS $$
DECLARE
    v_contador INT;
    v_anio INT;
BEGIN
    v_anio := EXTRACT(YEAR FROM NEW.fecha_registro);

    -- Reiniciar secuencia si cambió el año
    IF v_anio != EXTRACT(YEAR FROM CURRENT_DATE) THEN
        EXECUTE 'CREATE SEQUENCE IF NOT EXISTS seq_folio_entrante_' || v_anio;
    END IF;

    EXECUTE 'SELECT nextval(''seq_folio_entrante_' || v_anio || ''')' INTO v_contador;

    NEW.folio_interno := 'ENT-' || v_anio || '-' || LPAD(v_contador::TEXT, 6, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Soft delete en lugar de DELETE

```sql
-- Agregar columna de eliminación lógica
ALTER TABLE tbl_documento_entrante ADD COLUMN eliminado BOOLEAN DEFAULT FALSE;
ALTER TABLE tbl_documento_entrante ADD COLUMN fecha_eliminacion TIMESTAMP WITH TIME ZONE;

-- Vista que excluye eliminados
CREATE VIEW v_documentos_activos AS
SELECT * FROM tbl_documento_entrante WHERE eliminado = FALSE;

-- Política RLS actualizada
DROP POLICY "rls_doc_entrante_select_ua" ON tbl_documento_entrante;
CREATE POLICY "rls_doc_entrante_select_ua"
    ON tbl_documento_entrante
    FOR SELECT
    USING (
        eliminado = FALSE AND
        id_ua_registro IN (
            SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid()
        )
    );
```

### 3. Backup automático de documentos críticos

```sql
CREATE TABLE tbl_documentos_backup (
    LIKE tbl_documento_entrante INCLUDING ALL
);

CREATE OR REPLACE FUNCTION backup_documento_critico()
RETURNS TRIGGER AS $$
BEGIN
    -- Backup automático al firmar electrónicamente
    IF TG_OP = 'UPDATE' AND NEW.estatus_general = 'Concluido' THEN
        INSERT INTO tbl_documentos_backup SELECT NEW.*;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_backup_concluido
    AFTER UPDATE ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION backup_documento_critico();
```

---

## 🎓 RECOMENDACIONES FINALES

### 1. Testing desde el inicio

```sql
-- Crear esquema separado para tests
CREATE SCHEMA IF NOT EXISTS tests;

-- Función helper para tests
CREATE OR REPLACE FUNCTION tests.crear_usuario_test()
RETURNS UUID AS $$
DECLARE
    v_id_ua UUID;
    v_id_rol UUID;
    v_id_usuario UUID;
BEGIN
    -- Crear UA de prueba
    INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico)
    VALUES ('UA Test', 'TEST001', 4)
    RETURNING id_ua INTO v_id_ua;

    -- Obtener rol
    SELECT id_rol INTO v_id_rol FROM cat_roles WHERE nombre_rol = 'Nivel 3' LIMIT 1;

    -- Crear usuario
    INSERT INTO tbl_usuarios (
        clave_servidor_publico, id_ua, id_rol, nombre_completo,
        correo_institucional, password_hash
    ) VALUES (
        'TEST' || gen_random_uuid()::text,
        v_id_ua,
        v_id_rol,
        'Usuario Test',
        'test@example.com',
        'hash_temporal'
    )
    RETURNING id_usuario INTO v_id_usuario;

    RETURN v_id_usuario;
END;
$$ LANGUAGE plpgsql;
```

### 2. Documentación automática de la API

```typescript
// Usar OpenAPI/Swagger
import { createClient } from '@supabase/supabase-js'
import { generateOpenApiSpec } from './utils/openapi'

// Generar spec automáticamente de los tipos TypeScript
const spec = generateOpenApiSpec({
  title: 'SISGEDI 2.0 API',
  version: '1.0.0',
  schemas: {
    DocumentoEntrante,
    Turnado,
    Usuario
  }
})
```

### 3. Monitoreo de costos

```sql
-- Tabla para trackear costos estimados
CREATE TABLE tbl_costos_api (
    id_costo BIGSERIAL PRIMARY KEY,
    servicio VARCHAR(50),  -- 'google_vision', 'storage', 'functions'
    unidades_consumidas INT,
    costo_estimado_usd NUMERIC(10, 4),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Registrar cada uso de OCR
CREATE OR REPLACE FUNCTION registrar_costo_ocr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.confianza_ocr IS NOT NULL THEN
        INSERT INTO tbl_costos_api (servicio, unidades_consumidas, costo_estimado_usd)
        VALUES ('google_vision', 1, 0.0015);  -- $1.50 por 1000 páginas
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📌 PRIORIZACIÓN SUGERIDA

### Fase 1: Fundamentos (Semanas 1-2)
1. ✅ Ejecutar `database_schema.sql`
2. ✅ Aplicar validaciones adicionales (sección 1)
3. ✅ Implementar soft delete
4. ✅ Mejorar generación de folios

### Fase 2: Performance (Semanas 3-4)
1. ✅ Agregar índices compuestos
2. ✅ Implementar paginación cursor-based
3. ✅ Crear vista materializada de reportes
4. ✅ Optimizar función de búsqueda

### Fase 3: Features (Semanas 5-8)
1. ✅ Dashboard con indicadores
2. ✅ Notificaciones automáticas
3. ✅ Sugerencias de turnado
4. ✅ Plantillas de documentos

### Fase 4: Producción (Semanas 9-10)
1. ✅ Rate limiting
2. ✅ Encriptación de datos sensibles
3. ✅ Métricas y monitoreo
4. ✅ Backup automático

---

**CONCLUSIÓN:** El esquema de base de datos está bien diseñado, pero necesita estas mejoras antes de production. Prioriza seguridad y performance desde el inicio.
