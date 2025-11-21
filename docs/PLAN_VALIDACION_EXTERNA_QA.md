# SISGEDI 2.0 - Plan de Validación Externa
## Documento para Equipo de Calidad (QA)

---

**Proyecto:** SISGEDI 2.0 - Sistema de Gestión de Documentación Integral
**Versión:** 2.0.0
**Fecha:** Noviembre 2025
**Preparado para:** Equipo de Calidad / QA
**Estado:** Datos de Prueba Generados - Listo para Validación

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Objetivos de la Validación](#2-objetivos-de-la-validación)
3. [Alcance de la Validación](#3-alcance-de-la-validación)
4. [Datos de Prueba Disponibles](#4-datos-de-prueba-disponibles)
5. [Casos de Prueba por Módulo](#5-casos-de-prueba-por-módulo)
6. [Matriz de Trazabilidad](#6-matriz-de-trazabilidad)
7. [Criterios de Aceptación](#7-criterios-de-aceptación)
8. [Procedimientos de Validación](#8-procedimientos-de-validación)
9. [Registro de Hallazgos](#9-registro-de-hallazgos)
10. [Aprobación y Firma](#10-aprobación-y-firma)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Propósito del Documento

Este documento proporciona al equipo de QA una guía completa para realizar la validación externa del sistema SISGEDI 2.0. Incluye casos de prueba, datos de prueba generados automáticamente, criterios de aceptación y procedimientos de validación.

### 1.2 Estado Actual del Proyecto

| Aspecto | Estado | Observaciones |
|---------|--------|---------------|
| **Esquema de Base de Datos** | ✅ Completo | 14 tablas, triggers, RLS configurado |
| **Datos de Prueba** | ✅ Generados | 20-50 UAs, 100-500 usuarios, 100-500 documentos |
| **Inventario de Prueba** | ✅ Generado | 10-100 items por UA, 8 categorías |
| **Pruebas Automatizadas** | ✅ Implementadas | 40+ casos de prueba, cobertura > 70% |
| **Frontend** | ⚠️ Pendiente | Por implementar (Fase 2) |
| **Backend API** | ⚠️ Pendiente | Por implementar (Fase 2) |

### 1.3 Entregables de Validación

El equipo de QA debe validar:

1. **Integridad de Datos** - Consistencia y relaciones entre tablas
2. **Reglas de Negocio** - Cumplimiento de requisitos funcionales
3. **Seguridad** - Row-Level Security, validaciones, triggers
4. **Rendimiento** - Tiempos de consulta < 1 segundo
5. **Inventario** - Completitud y precisión de datos de inventario
6. **Full-Text Search** - Funcionalidad de búsqueda OCR

---

## 2. OBJETIVOS DE LA VALIDACIÓN

### 2.1 Objetivos Principales

| # | Objetivo | Prioridad | Éxito |
|---|----------|-----------|-------|
| 1 | Verificar integridad referencial de todos los datos | Alta | 100% registros válidos |
| 2 | Validar reglas de negocio implementadas | Alta | 100% cumplimiento |
| 3 | Comprobar funcionamiento de triggers y funciones | Alta | 100% operativos |
| 4 | Evaluar rendimiento de consultas críticas | Media | < 1s para operaciones CRUD |
| 5 | Verificar políticas de seguridad RLS | Alta | Aislamiento correcto por UA |
| 6 | Validar datos de inventario generados | Media | 100% consistentes |
| 7 | Probar búsqueda Full-Text Search | Media | Resultados relevantes |

### 2.2 Requisitos Funcionales a Validar

Basado en el documento de análisis, se validarán los siguientes RF:

| RF | Descripción | Módulo |
|----|-------------|--------|
| RF1 | Autenticación con clave de servidor público | Seguridad |
| RF2 | Control de acceso basado en roles | Seguridad |
| RF6 | OCR automático de documentos | Documentos Entrantes |
| RF7 | Búsqueda Full-Text Search | Documentos Entrantes |
| RF11 | Turnado de documentos | Seguimiento |
| RF15 | Rechazo de turnados | Seguimiento |
| RF17 | Control de avance por porcentaje | Seguimiento |
| RF20 | Relación documento saliente-entrante | Documentos Salientes |
| RF23 | Firma electrónica (estructura de datos) | Firma Electrónica |
| RF24 | Acuse de recibo | Documentos Salientes |

---

## 3. ALCANCE DE LA VALIDACIÓN

### 3.1 Dentro del Alcance

✅ **Validación de Base de Datos:**
- Estructura de tablas
- Relaciones y claves foráneas
- Constraints e índices
- Triggers y funciones almacenadas
- Row-Level Security (RLS)
- Datos generados automáticamente

✅ **Validación de Datos:**
- Integridad referencial
- Unicidad de claves
- Formatos y validaciones
- Rangos de valores
- Estados y catálogos

✅ **Validación de Inventario:**
- Completitud de datos
- Valores y cálculos
- Categorización
- Asignación de responsables

✅ **Validación de Rendimiento:**
- Tiempos de consulta
- Eficiencia de índices
- Full-Text Search

### 3.2 Fuera del Alcance

❌ **No Incluido en Esta Validación:**
- Pruebas de interfaz de usuario (UI)
- Pruebas de API REST (por implementar)
- Pruebas de integración con servicios externos
- Pruebas de carga y estrés
- Pruebas de seguridad de penetración
- Pruebas de usabilidad

---

## 4. DATOS DE PRUEBA DISPONIBLES

### 4.1 Resumen de Datos Generados

#### Modo Estándar (Recomendado para QA)

```bash
npm run seed
```

| Entidad | Cantidad | Observaciones |
|---------|----------|---------------|
| Unidades Administrativas | 20 | 4 niveles jerárquicos |
| Usuarios | 100 | 5 por UA, 7 roles diferentes |
| Documentos Entrantes | 100 | Con OCR, anexos, metadatos |
| Documentos Salientes | 50 | 40% relacionados con entrantes |
| Turnados | ~300 | 1-3 por documento |
| Notificaciones | ~150 | Distribuidas entre usuarios |
| Items de Inventario | Variable | 10-100 por UA según nivel |

#### Modo Completo (Opcional - Testing Exhaustivo)

```bash
npm run seed:full
```

| Entidad | Cantidad |
|---------|----------|
| Unidades Administrativas | 50 |
| Usuarios | 500 |
| Documentos Entrantes | 500 |
| Documentos Salientes | 200 |
| Turnados | ~2,500 |
| Items de Inventario | ~1,500 |

### 4.2 Estructura de Datos de Prueba

#### Usuarios de Prueba

Todos los usuarios tienen la estructura:

```
Clave: SP|CS|EP + YYYY + 00001-99999
Contraseña Hash: Bcrypt simulado
Correo: nombre.apellido@[economia|gob|funcionpublica].gob.mx
Estados: Activo (mayoría), Inhabilitado, Suspendido
```

#### Documentos de Prueba

Todos los documentos incluyen:

```
Asunto: Generado con verbos y temas gubernamentales
Contenido OCR: Texto simulado de oficio oficial
Metadatos OCR: Entidades extraídas (fechas, personas, instituciones)
Confianza OCR: 0.85 - 0.99
Estado: Pendiente, En_Proceso, Concluido, Archivado
```

#### Inventario de Prueba

Categorías generadas:

1. **Mobiliario de Oficina** - Escritorios, sillas, archiveros
2. **Equipo de Cómputo** - Computadoras, laptops, servidores
3. **Equipo de Comunicación** - Teléfonos IP, centrales
4. **Equipo de Seguridad** - Cámaras, DVR, controles de acceso
5. **Vehículos** - Automóviles, camionetas, motocicletas
6. **Equipo de Oficina** - Destructoras, engargoladoras
7. **Climatización** - Aires acondicionados, ventiladores
8. **Equipo Audiovisual** - Proyectores, televisores, cámaras

### 4.3 Credenciales de Acceso

Para pruebas de autenticación (cuando se implemente el frontend):

| Rol | Clave Ejemplo | Descripción |
|-----|---------------|-------------|
| Administrador General | Ver en BD | Acceso completo al sistema |
| Administrador UA | Ver en BD | Gestión de su UA |
| Recepción | Ver en BD | Captura de documentos |
| Nivel 1 | Ver en BD | Turnado y firma |
| Nivel 2 | Ver en BD | Firma y avance |
| Nivel 3 | Ver en BD | Avance y conclusión |
| Visor | Ver en BD | Solo lectura |

**Consulta para obtener usuarios por rol:**

```sql
SELECT
  u.clave_servidor_publico,
  u.nombre_completo,
  u.correo_institucional,
  r.nombre_rol,
  ua.nombre_ua
FROM tbl_usuarios u
JOIN cat_roles r ON u.id_rol = r.id_rol
JOIN cat_unidad_administrativa ua ON u.id_ua = ua.id_ua
ORDER BY r.nombre_rol, u.nombre_completo
LIMIT 20;
```

---

## 5. CASOS DE PRUEBA POR MÓDULO

### 5.1 MÓDULO: Seguridad y Administración

#### CP-SEG-001: Validar Unicidad de Claves de Servidor Público

**Objetivo:** Verificar que no existan claves duplicadas
**Prioridad:** Alta
**Precondiciones:** Datos de prueba cargados

**Pasos de Ejecución:**

```sql
-- Buscar claves duplicadas
SELECT clave_servidor_publico, COUNT(*) as duplicados
FROM tbl_usuarios
GROUP BY clave_servidor_publico
HAVING COUNT(*) > 1;
```

**Resultado Esperado:** 0 registros (sin duplicados)
**Criterio de Aceptación:** ✅ PASA si la consulta retorna 0 filas

---

#### CP-SEG-002: Validar Asignación de Roles

**Objetivo:** Verificar que todos los usuarios tienen roles válidos
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Buscar usuarios sin rol válido
SELECT u.id_usuario, u.nombre_completo
FROM tbl_usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM cat_roles r WHERE r.id_rol = u.id_rol
);
```

**Resultado Esperado:** 0 registros
**Criterio de Aceptación:** ✅ PASA si todos los usuarios tienen rol válido

---

#### CP-SEG-003: Validar Jerarquía de Unidades Administrativas

**Objetivo:** Verificar que la jerarquía de UAs es consistente
**Prioridad:** Media

**Pasos de Ejecución:**

```sql
-- Verificar niveles jerárquicos
SELECT nivel_jerarquico, COUNT(*) as cantidad
FROM cat_unidad_administrativa
GROUP BY nivel_jerarquico
ORDER BY nivel_jerarquico;

-- Verificar que UAs de nivel 1 no tienen superior
SELECT COUNT(*) as nivel_1_sin_superior
FROM cat_unidad_administrativa
WHERE nivel_jerarquico = 1 AND id_ua_superior IS NULL;

-- Verificar que UAs de nivel > 1 tienen superior
SELECT COUNT(*) as niveles_superiores_sin_padre
FROM cat_unidad_administrativa
WHERE nivel_jerarquico > 1 AND id_ua_superior IS NULL;
```

**Resultado Esperado:**
- Distribución razonable entre niveles (10% nivel 1, 20% nivel 2, etc.)
- Nivel 1 sin superior: > 0
- Niveles superiores sin padre: 0

**Criterio de Aceptación:** ✅ PASA si la jerarquía es consistente

---

#### CP-SEG-004: Validar Formato de Correos Institucionales

**Objetivo:** Verificar que los correos tienen formato válido
**Prioridad:** Media

**Pasos de Ejecución:**

```sql
-- Buscar correos con formato inválido
SELECT correo_institucional
FROM tbl_usuarios
WHERE correo_institucional !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
```

**Resultado Esperado:** 0 registros
**Criterio de Aceptación:** ✅ PASA si todos los correos son válidos

---

### 5.2 MÓDULO: Documentos Entrantes

#### CP-DOC-001: Validar Generación de Folio Interno

**Objetivo:** Verificar que todos los documentos tienen folio único
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Verificar que todos tienen folio
SELECT COUNT(*) as sin_folio
FROM tbl_documento_entrante
WHERE folio_interno IS NULL;

-- Verificar unicidad
SELECT folio_interno, COUNT(*) as duplicados
FROM tbl_documento_entrante
GROUP BY folio_interno
HAVING COUNT(*) > 1;
```

**Resultado Esperado:**
- sin_folio: 0
- duplicados: 0 filas

**Criterio de Aceptación:** ✅ PASA si todos los folios son únicos y no nulos

---

#### CP-DOC-002: Validar Contenido OCR

**Objetivo:** Verificar que documentos tienen OCR procesado
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Verificar que tienen contenido OCR
SELECT COUNT(*) as total_docs,
       SUM(CASE WHEN contenido_ocr IS NOT NULL THEN 1 ELSE 0 END) as con_ocr,
       SUM(CASE WHEN ts_contenido_ocr IS NOT NULL THEN 1 ELSE 0 END) as con_fts
FROM tbl_documento_entrante;

-- Verificar confianza OCR en rango válido
SELECT COUNT(*) as confianza_invalida
FROM tbl_documento_entrante
WHERE confianza_ocr IS NOT NULL
  AND (confianza_ocr < 0 OR confianza_ocr > 1);
```

**Resultado Esperado:**
- con_ocr: 100% de total_docs
- con_fts: 100% de total_docs
- confianza_invalida: 0

**Criterio de Aceptación:** ✅ PASA si todos los documentos tienen OCR válido

---

#### CP-DOC-003: Validar Metadatos OCR

**Objetivo:** Verificar estructura de metadatos JSON
**Prioridad:** Media

**Pasos de Ejecución:**

```sql
-- Verificar que metadatos tienen estructura esperada
SELECT COUNT(*) as metadatos_invalidos
FROM tbl_documento_entrante
WHERE metadatos_ocr IS NOT NULL
  AND NOT (
    metadatos_ocr ? 'entities' AND
    metadatos_ocr ? 'confidence' AND
    metadatos_ocr ? 'language'
  );

-- Verificar idioma español
SELECT COUNT(*) as idioma_incorrecto
FROM tbl_documento_entrante
WHERE metadatos_ocr->>'language' != 'es';
```

**Resultado Esperado:**
- metadatos_invalidos: 0
- idioma_incorrecto: 0

**Criterio de Aceptación:** ✅ PASA si los metadatos son consistentes

---

#### CP-DOC-004: Validar Anexos de Documentos

**Objetivo:** Verificar que los anexos tienen datos válidos
**Prioridad:** Media

**Pasos de Ejecución:**

```sql
-- Verificar que todos los anexos referencian documentos existentes
SELECT COUNT(*) as anexos_huerfanos
FROM tbl_anexos a
WHERE NOT EXISTS (
  SELECT 1 FROM tbl_documento_entrante d
  WHERE d.id_doc_entrante = a.id_doc_entrante
);

-- Verificar que tamaños son consistentes
SELECT COUNT(*) as tamanos_inconsistentes
FROM tbl_anexos
WHERE tamano_bytes <= 0 OR tamano_mb <= 0
   OR ABS((tamano_bytes / 1048576.0) - tamano_mb) > 0.1;
```

**Resultado Esperado:**
- anexos_huerfanos: 0
- tamanos_inconsistentes: 0

**Criterio de Aceptación:** ✅ PASA si todos los anexos son válidos

---

### 5.3 MÓDULO: Seguimiento y Turnado

#### CP-TUR-001: Validar Turnados Consistentes

**Objetivo:** Verificar que turnados tienen origen y destino válidos
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Verificar que origen y destino son diferentes
SELECT COUNT(*) as turnados_misma_ua
FROM tbl_turnado
WHERE id_ua_origen = id_ua_destino;

-- Verificar que UAs existen
SELECT COUNT(*) as turnados_ua_invalida
FROM tbl_turnado t
WHERE NOT EXISTS (
  SELECT 1 FROM cat_unidad_administrativa WHERE id_ua = t.id_ua_origen
)
OR NOT EXISTS (
  SELECT 1 FROM cat_unidad_administrativa WHERE id_ua = t.id_ua_destino
);
```

**Resultado Esperado:**
- turnados_misma_ua: 0
- turnados_ua_invalida: 0

**Criterio de Aceptación:** ✅ PASA si todos los turnados son válidos

---

#### CP-TUR-002: Validar Porcentaje de Avance

**Objetivo:** Verificar que el avance está en rango 0-100
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Verificar rango válido
SELECT COUNT(*) as avance_invalido
FROM tbl_turnado
WHERE porcentaje_avance < 0 OR porcentaje_avance > 100;

-- Verificar distribución de avances
SELECT porcentaje_avance, COUNT(*) as cantidad
FROM tbl_turnado
GROUP BY porcentaje_avance
ORDER BY porcentaje_avance;
```

**Resultado Esperado:**
- avance_invalido: 0
- Distribución en 0, 25, 50, 75, 100

**Criterio de Aceptación:** ✅ PASA si todos los avances son válidos

---

#### CP-TUR-003: Validar Fechas de Vencimiento

**Objetivo:** Verificar que las fechas de vencimiento son coherentes
**Prioridad:** Media

**Pasos de Ejecución:**

```sql
-- Verificar que fecha_vencimiento > fecha_turno
SELECT COUNT(*) as fechas_invalidas
FROM tbl_turnado
WHERE fecha_vencimiento < fecha_turno;

-- Verificar días de atención consistentes
SELECT COUNT(*) as dias_inconsistentes
FROM tbl_turnado
WHERE dias_para_atencion != EXTRACT(DAY FROM (fecha_vencimiento - fecha_turno));
```

**Resultado Esperado:**
- fechas_invalidas: 0
- dias_inconsistentes: <= 10% (por ajustes de fines de semana)

**Criterio de Aceptación:** ✅ PASA si las fechas son coherentes

---

### 5.4 MÓDULO: Documentos Salientes

#### CP-SAL-001: Validar Numeración de Folios

**Objetivo:** Verificar que los folios son únicos por ejercicio
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Verificar unicidad de folios
SELECT numero_folio, ejercicio_fiscal, COUNT(*) as duplicados
FROM tbl_documento_saliente
GROUP BY numero_folio, ejercicio_fiscal
HAVING COUNT(*) > 1;

-- Verificar que todos tienen folio
SELECT COUNT(*) as sin_folio
FROM tbl_documento_saliente
WHERE numero_folio IS NULL;
```

**Resultado Esperado:**
- duplicados: 0 filas
- sin_folio: 0

**Criterio de Aceptación:** ✅ PASA si todos los folios son únicos

---

#### CP-SAL-002: Validar Relaciones con Documentos Entrantes

**Objetivo:** Verificar que las relaciones son válidas
**Prioridad:** Media

**Pasos de Ejecución:**

```sql
-- Verificar que relaciones referencian documentos existentes
SELECT COUNT(*) as relaciones_invalidas
FROM tbl_relacion_respuesta r
WHERE NOT EXISTS (
  SELECT 1 FROM tbl_documento_saliente WHERE id_doc_saliente = r.id_doc_saliente
)
OR NOT EXISTS (
  SELECT 1 FROM tbl_documento_entrante WHERE id_doc_entrante = r.id_doc_entrante
);

-- Verificar distribución de tipos de relación
SELECT tipo_relacion, COUNT(*) as cantidad
FROM tbl_relacion_respuesta
GROUP BY tipo_relacion;
```

**Resultado Esperado:**
- relaciones_invalidas: 0
- Tipos válidos: Respuesta, Seguimiento, Complemento

**Criterio de Aceptación:** ✅ PASA si todas las relaciones son válidas

---

### 5.5 MÓDULO: Inventario

#### CP-INV-001: Validar Números de Inventario Únicos

**Objetivo:** Verificar que los números de inventario son únicos
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Verificar unicidad
SELECT numero_inventario, COUNT(*) as duplicados
FROM tbl_inventario
GROUP BY numero_inventario
HAVING COUNT(*) > 1;

-- Verificar formato (CODIGO-CAT-YYYY-9999)
SELECT COUNT(*) as formato_invalido
FROM tbl_inventario
WHERE numero_inventario !~ '^[A-Z]+-[A-Z]+-\d{4}-\d{4}$';
```

**Resultado Esperado:**
- duplicados: 0 filas
- formato_invalido: 0

**Criterio de Aceptación:** ✅ PASA si todos los números son únicos y válidos

---

#### CP-INV-002: Validar Valores de Inventario

**Objetivo:** Verificar que los valores son positivos y consistentes
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Verificar valores positivos
SELECT COUNT(*) as valores_negativos
FROM tbl_inventario
WHERE valor_unitario <= 0 OR valor_total <= 0 OR cantidad <= 0;

-- Verificar consistencia valor_total = valor_unitario * cantidad
SELECT COUNT(*) as calculos_incorrectos
FROM tbl_inventario
WHERE ABS(valor_total - (valor_unitario * cantidad)) > 0.01;
```

**Resultado Esperado:**
- valores_negativos: 0
- calculos_incorrectos: 0

**Criterio de Aceptación:** ✅ PASA si todos los valores son válidos

---

#### CP-INV-003: Validar Distribución por Categorías

**Objetivo:** Verificar que hay items en todas las categorías
**Prioridad:** Media

**Pasos de Ejecución:**

```sql
-- Ver distribución por categoría
SELECT categoria, COUNT(*) as cantidad, SUM(valor_total) as valor_total
FROM tbl_inventario
GROUP BY categoria
ORDER BY valor_total DESC;

-- Verificar que hay al menos 8 categorías
SELECT COUNT(DISTINCT categoria) as total_categorias
FROM tbl_inventario;
```

**Resultado Esperado:**
- total_categorias: >= 8
- Distribución razonable entre categorías

**Criterio de Aceptación:** ✅ PASA si hay buena distribución

---

#### CP-INV-004: Validar Asignación a UAs

**Objetivo:** Verificar que todos los items están asignados a UAs válidas
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Verificar que todas las UAs tienen inventario
SELECT ua.nombre_ua, COUNT(inv.id_inventario) as items
FROM cat_unidad_administrativa ua
LEFT JOIN tbl_inventario inv ON ua.id_ua = inv.id_ua
GROUP BY ua.id_ua, ua.nombre_ua
ORDER BY items DESC;

-- Verificar items sin UA válida
SELECT COUNT(*) as items_sin_ua
FROM tbl_inventario inv
WHERE NOT EXISTS (
  SELECT 1 FROM cat_unidad_administrativa WHERE id_ua = inv.id_ua
);
```

**Resultado Esperado:**
- Todas las UAs tienen items
- items_sin_ua: 0

**Criterio de Aceptación:** ✅ PASA si todos los items están asignados

---

### 5.6 MÓDULO: Búsqueda (Full-Text Search)

#### CP-BUS-001: Validar Indexación FTS

**Objetivo:** Verificar que el índice Full-Text Search está generado
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Verificar que ts_contenido_ocr está generado
SELECT COUNT(*) as total_docs,
       SUM(CASE WHEN ts_contenido_ocr IS NOT NULL THEN 1 ELSE 0 END) as indexados
FROM tbl_documento_entrante
WHERE contenido_ocr IS NOT NULL;

-- Verificar que el índice existe
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tbl_documento_entrante'
  AND indexname LIKE '%ts_contenido%';
```

**Resultado Esperado:**
- indexados: = total_docs (100%)
- Índice GIN existe

**Criterio de Aceptación:** ✅ PASA si todos están indexados

---

#### CP-BUS-002: Validar Búsqueda por Palabras Comunes

**Objetivo:** Verificar que la búsqueda retorna resultados
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Buscar palabra común "solicita"
SELECT COUNT(*) as resultados
FROM tbl_documento_entrante
WHERE ts_contenido_ocr @@ to_tsquery('spanish', 'solicita');

-- Buscar frase "información sobre"
SELECT COUNT(*) as resultados
FROM tbl_documento_entrante
WHERE ts_contenido_ocr @@ to_tsquery('spanish', 'informacion & sobre');

-- Verificar ranking
SELECT asunto,
       ts_rank(ts_contenido_ocr, to_tsquery('spanish', 'solicita')) as rank
FROM tbl_documento_entrante
WHERE ts_contenido_ocr @@ to_tsquery('spanish', 'solicita')
ORDER BY rank DESC
LIMIT 10;
```

**Resultado Esperado:**
- resultados > 0 para palabras comunes
- Ranking funcional (mayor a 0)

**Criterio de Aceptación:** ✅ PASA si la búsqueda funciona

---

### 5.7 MÓDULO: Rendimiento

#### CP-PERF-001: Validar Tiempos de Consulta de Listados

**Objetivo:** Verificar que los listados se generan en < 1 segundo
**Prioridad:** Alta

**Pasos de Ejecución:**

```sql
-- Medir tiempo de listado de documentos
EXPLAIN ANALYZE
SELECT d.folio_interno, d.asunto, d.fecha_registro, ua.nombre_ua
FROM tbl_documento_entrante d
JOIN cat_unidad_administrativa ua ON d.id_ua_registro = ua.id_ua
ORDER BY d.fecha_registro DESC
LIMIT 50;

-- Medir tiempo de turnados por UA
EXPLAIN ANALYZE
SELECT t.*, d.asunto
FROM tbl_turnado t
JOIN tbl_documento_entrante d ON t.id_doc_entrante = d.id_doc_entrante
WHERE t.id_ua_destino = (SELECT id_ua FROM cat_unidad_administrativa LIMIT 1)
LIMIT 50;
```

**Resultado Esperado:**
- Execution time: < 1000 ms para cada consulta

**Criterio de Aceptación:** ✅ PASA si tiempo < 1 segundo

---

#### CP-PERF-002: Validar Rendimiento de Búsqueda FTS

**Objetivo:** Verificar que la búsqueda FTS es eficiente
**Prioridad:** Media

**Pasos de Ejecución:**

```sql
-- Medir búsqueda simple
EXPLAIN ANALYZE
SELECT folio_interno, asunto
FROM tbl_documento_entrante
WHERE ts_contenido_ocr @@ to_tsquery('spanish', 'solicita | requiere')
LIMIT 50;

-- Verificar que usa índice GIN
-- Debe mostrar "Bitmap Index Scan on idx_ts_contenido_ocr"
```

**Resultado Esperado:**
- Execution time: < 2000 ms
- Plan usa índice GIN

**Criterio de Aceptación:** ✅ PASA si es eficiente

---

## 6. MATRIZ DE TRAZABILIDAD

| Requisito Funcional | Caso de Prueba | Módulo | Estado |
|---------------------|----------------|--------|--------|
| RF1 - Autenticación | CP-SEG-001, CP-SEG-004 | Seguridad | ⬜ Pendiente |
| RF2 - Control de Acceso | CP-SEG-002 | Seguridad | ⬜ Pendiente |
| RF6 - OCR Automático | CP-DOC-002, CP-DOC-003 | Docs Entrantes | ⬜ Pendiente |
| RF7 - Full-Text Search | CP-BUS-001, CP-BUS-002 | Búsqueda | ⬜ Pendiente |
| RF11 - Turnado | CP-TUR-001, CP-TUR-003 | Seguimiento | ⬜ Pendiente |
| RF15 - Rechazo | (Por implementar) | Seguimiento | ⬜ Pendiente |
| RF17 - Control Avance | CP-TUR-002 | Seguimiento | ⬜ Pendiente |
| RF20 - Relación Docs | CP-SAL-002 | Docs Salientes | ⬜ Pendiente |
| Integridad Datos | CP-DOC-001, CP-INV-001 | General | ⬜ Pendiente |
| Rendimiento | CP-PERF-001, CP-PERF-002 | General | ⬜ Pendiente |

---

## 7. CRITERIOS DE ACEPTACIÓN

### 7.1 Criterios Generales

El sistema será **ACEPTADO** si cumple:

| # | Criterio | Umbral | Prioridad |
|---|----------|--------|-----------|
| 1 | Todos los casos de prueba de prioridad ALTA pasan | 100% | Crítico |
| 2 | Al menos el 90% de casos de prioridad MEDIA pasan | >= 90% | Alto |
| 3 | No hay errores críticos de integridad de datos | 0 errores | Crítico |
| 4 | Rendimiento de consultas críticas | < 1 segundo | Alto |
| 5 | Cobertura de datos de prueba | >= 70% | Medio |

### 7.2 Criterios Específicos por Módulo

#### Seguridad y Administración
- ✅ 100% de usuarios con roles válidos
- ✅ 0 claves de servidor público duplicadas
- ✅ Jerarquía de UAs consistente

#### Documentos Entrantes
- ✅ 100% de documentos con folio único
- ✅ 100% de documentos con OCR procesado
- ✅ Confianza OCR en rango 0.85-0.99

#### Seguimiento y Turnado
- ✅ 100% de turnados con UAs válidas
- ✅ Porcentajes de avance en rango 0-100
- ✅ 0 turnados con origen = destino

#### Inventario
- ✅ 100% de números de inventario únicos
- ✅ Valores calculados correctamente
- ✅ Distribución en 8 categorías mínimo

#### Rendimiento
- ✅ Listados de documentos < 1 segundo
- ✅ Búsqueda FTS < 2 segundos
- ✅ Uso correcto de índices

---

## 8. PROCEDIMIENTOS DE VALIDACIÓN

### 8.1 Preparación del Ambiente de Pruebas

**Paso 1:** Clonar repositorio

```bash
git clone <repository-url>
cd SISGEDI
```

**Paso 2:** Configurar base de datos

```bash
# Crear base de datos
psql -U postgres -c "CREATE DATABASE sisgedi;"

# Cargar esquema
psql -U postgres -d sisgedi -f database_schema.sql
```

**Paso 3:** Instalar dependencias

```bash
npm install
```

**Paso 4:** Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con credenciales correctas
```

**Paso 5:** Generar datos de prueba

```bash
# Modo estándar (recomendado)
npm run seed

# O modo completo para testing exhaustivo
npm run seed:full
```

**Paso 6:** Generar inventario

```bash
npm run seed:inventory
```

### 8.2 Ejecución de Casos de Prueba

**Opción 1:** Ejecutar pruebas automatizadas

```bash
# Todas las pruebas
npm test

# Con cobertura
npm run test:coverage

# Con UI interactiva
npm run test:ui
```

**Opción 2:** Ejecutar casos de prueba manualmente

Conectarse a la base de datos:

```bash
psql -U postgres -d sisgedi
```

Ejecutar cada consulta SQL de los casos de prueba y registrar resultados.

### 8.3 Registro de Resultados

Para cada caso de prueba, completar:

| ID Caso | Fecha | Ejecutor | Resultado | Observaciones | Evidencia |
|---------|-------|----------|-----------|---------------|-----------|
| CP-SEG-001 | | | ⬜ PASA / ❌ FALLA | | Screenshot |
| CP-SEG-002 | | | ⬜ PASA / ❌ FALLA | | Screenshot |
| ... | | | | | |

**Formato de evidencia:**
- Screenshots de resultados de consultas
- Logs de ejecución de tests
- Reportes de cobertura
- Métricas de rendimiento

---

## 9. REGISTRO DE HALLAZGOS

### 9.1 Plantilla de Reporte de Defectos

Para cada defecto encontrado, completar:

```
ID: DEF-001
FECHA: _______________
MÓDULO: _______________
SEVERIDAD: ☐ Crítica  ☐ Alta  ☐ Media  ☐ Baja
PRIORIDAD: ☐ Urgente  ☐ Alta  ☐ Media  ☐ Baja

TÍTULO:
[Descripción breve del defecto]

DESCRIPCIÓN:
[Descripción detallada del problema]

PASOS PARA REPRODUCIR:
1.
2.
3.

RESULTADO ESPERADO:


RESULTADO ACTUAL:


IMPACTO:


EVIDENCIA:
[Screenshots, logs, etc.]

ASIGNADO A: _______________
ESTADO: ☐ Abierto  ☐ En Revisión  ☐ Resuelto  ☐ Cerrado
```

### 9.2 Clasificación de Severidad

| Severidad | Descripción | Ejemplo |
|-----------|-------------|---------|
| **Crítica** | Bloquea funcionalidad principal | Pérdida de datos, sistema inaccesible |
| **Alta** | Afecta funcionalidad importante | Cálculos incorrectos, validaciones faltantes |
| **Media** | Afecta funcionalidad secundaria | Formatos incorrectos, mensajes confusos |
| **Baja** | Cosmético o menor | Alineación, colores, typos |

---

## 10. APROBACIÓN Y FIRMA

### 10.1 Resumen de Validación

**Fecha de Inicio:** _______________
**Fecha de Finalización:** _______________
**Duración:** _______________ días

**Estadísticas:**

| Métrica | Valor |
|---------|-------|
| Total de Casos de Prueba Ejecutados | _____ |
| Casos PASA | _____ (___%) |
| Casos FALLA | _____ (___%) |
| Defectos Críticos | _____ |
| Defectos Altos | _____ |
| Defectos Medios | _____ |
| Defectos Bajos | _____ |
| Cobertura de Datos | _____ % |
| Rendimiento Promedio Consultas | _____ ms |

### 10.2 Decisión de Aceptación

☐ **ACEPTADO** - El sistema cumple con todos los criterios de aceptación

☐ **ACEPTADO CON CONDICIONES** - El sistema es aceptado con las siguientes condiciones:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

☐ **RECHAZADO** - El sistema no cumple con los criterios mínimos de aceptación

**Motivo del rechazo:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

### 10.3 Firmas de Aprobación

**Validado por:**

| Nombre | Rol | Firma | Fecha |
|--------|-----|-------|-------|
| | QA Lead | | |
| | QA Tester 1 | | |
| | QA Tester 2 | | |

**Aprobado por:**

| Nombre | Rol | Firma | Fecha |
|--------|-----|-------|-------|
| | Gerente de QA | | |
| | Project Manager | | |
| | Product Owner | | |

---

## ANEXOS

### ANEXO A: Consultas SQL Útiles

#### A.1 Estadísticas Generales

```sql
-- Resumen completo del sistema
SELECT 'Unidades Administrativas' as entidad, COUNT(*) as total FROM cat_unidad_administrativa
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM tbl_usuarios
UNION ALL
SELECT 'Documentos Entrantes', COUNT(*) FROM tbl_documento_entrante
UNION ALL
SELECT 'Documentos Salientes', COUNT(*) FROM tbl_documento_saliente
UNION ALL
SELECT 'Turnados', COUNT(*) FROM tbl_turnado
UNION ALL
SELECT 'Items Inventario', COUNT(*) FROM tbl_inventario;
```

#### A.2 Validación Completa de Integridad

```sql
-- Script de validación completa
DO $$
DECLARE
  v_errors INT := 0;
BEGIN
  -- Validar usuarios sin rol
  SELECT COUNT(*) INTO v_errors FROM tbl_usuarios
  WHERE NOT EXISTS (SELECT 1 FROM cat_roles WHERE id_rol = tbl_usuarios.id_rol);
  RAISE NOTICE 'Usuarios sin rol válido: %', v_errors;

  -- Validar documentos sin usuario
  SELECT COUNT(*) INTO v_errors FROM tbl_documento_entrante
  WHERE NOT EXISTS (SELECT 1 FROM tbl_usuarios WHERE id_usuario = id_usuario_registro);
  RAISE NOTICE 'Documentos sin usuario válido: %', v_errors;

  -- Más validaciones...
END $$;
```

### ANEXO B: Scripts de Limpieza

```bash
# Reiniciar base de datos
npm run db:reset

# Regenerar datos
npm run seed
npm run seed:inventory
```

### ANEXO C: Contactos del Equipo

| Rol | Nombre | Email | Teléfono |
|-----|--------|-------|----------|
| Tech Lead | | | |
| QA Manager | | | |
| Database Admin | | | |

---

**FIN DEL DOCUMENTO**

**Versión:** 1.0
**Última Actualización:** Noviembre 2025
**Próxima Revisión:** _______________
