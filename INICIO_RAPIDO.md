# 🚀 INICIO RÁPIDO - SISGEDI 2.0

## Script SQL con Datos de Prueba Incluidos

Este script crea la base de datos completa con datos de prueba en **UN SOLO PASO**.

---

## 📋 Opción 1: Instalación Todo-en-Uno (Recomendada)

### Un solo comando:

```bash
# 1. Crear BD y cargar todo (esquema + datos)
psql -U postgres -c "DROP DATABASE IF EXISTS sisgedi;" && \
psql -U postgres -c "CREATE DATABASE sisgedi;" && \
psql -U postgres -d sisgedi -f database_schema_with_test_data.sql
```

**¡Listo!** Ya tienes la base de datos completa con datos de prueba.

---

## 📋 Opción 2: Paso a Paso

### Paso 1: Crear la Base de Datos

```bash
psql -U postgres
```

```sql
-- Eliminar si existe (opcional)
DROP DATABASE IF EXISTS sisgedi;

-- Crear nueva
CREATE DATABASE sisgedi;

-- Salir
\q
```

### Paso 2: Cargar el Script Completo

```bash
psql -U postgres -d sisgedi -f database_schema_with_test_data.sql
```

**Tiempo de ejecución:** 10-30 segundos

---

## ✅ Verificar la Instalación

```bash
psql -U postgres -d sisgedi
```

```sql
-- Ver resumen de datos
SELECT 'Unidades Administrativas' as tabla, COUNT(*) as total FROM cat_unidad_administrativa
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM tbl_usuarios
UNION ALL
SELECT 'Documentos Entrantes', COUNT(*) FROM tbl_documento_entrante
UNION ALL
SELECT 'Documentos Salientes', COUNT(*) FROM tbl_documento_saliente
UNION ALL
SELECT 'Turnados', COUNT(*) FROM tbl_turnado
UNION ALL
SELECT 'Inventario', COUNT(*) FROM tbl_inventario
UNION ALL
SELECT 'Notificaciones', COUNT(*) FROM tbl_notificaciones;
```

**Resultado esperado:**

```
         tabla           | total
-------------------------+-------
 Unidades Administrativas|    20
 Usuarios                |   101
 Documentos Entrantes    |   100
 Documentos Salientes    |    50
 Turnados                |   300+
 Inventario              |   500+
 Notificaciones          |   150
```

---

## 📊 Datos de Prueba Incluidos

### 🏛️ Unidades Administrativas (20)
- **Nivel 1:** 2 Subsecretarías
- **Nivel 2:** 4 Direcciones Generales
- **Nivel 3:** 8 Direcciones
- **Nivel 4:** 6 Jefaturas

### 👥 Usuarios (101)
- **1** Administrador General (clave: ADMIN001)
- **100** Usuarios operativos distribuidos:
  - 20 Recepción
  - 20 Nivel 1
  - 20 Nivel 2
  - 20 Nivel 3
  - 20 Visores

### 📥 Documentos Entrantes (100)
- Con contenido OCR simulado
- Metadatos JSON
- Niveles de confianza 0.85-0.99
- Estados: Pendiente, En Proceso, Concluido, Archivado

### 📤 Documentos Salientes (50)
- Tipos: Oficio, Nota Informativa, Circular, Memorándum
- Estados: Borrador, Firmado, Enviado

### 🔄 Turnados (300+)
- 3 turnados promedio por documento
- Instrucciones variadas
- Avances: 0%, 25%, 50%, 75%, 100%
- Estados: Turnado, Recibido, En Proceso, Concluido

### 📦 Inventario (500+)
8 categorías de bienes:
1. **Mobiliario** - Escritorios, sillas, archiveros
2. **Equipo de Cómputo** - PCs, laptops, monitores, servidores
3. **Equipo de Comunicación** - Teléfonos IP
4. **Climatización** - Aires acondicionados
5. **Equipo Audiovisual** - Proyectores
6. **Equipo de Seguridad** - Cámaras (datos base)
7. **Vehículos** - (datos base)
8. **Equipo de Oficina** - Destructoras, engargoladoras

Cada item incluye:
- Número de inventario único
- Valores unitario y total
- Marca, modelo, serie (según aplique)
- Responsable, ubicación
- Fecha de adquisición
- Estado (Excelente, Bueno, Regular, Malo)

### 🔔 Notificaciones (150)
- Tipos: Vencimiento, Turnado, Rechazo, Firma
- Distribuidas entre primeros 50 usuarios
- Algunas leídas, otras pendientes

---

## 🔐 Credenciales de Prueba

### Administrador General
```
Usuario: admin.general@economia.gob.mx
Clave: ADMIN001
Password Hash: $2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKL
```

### Usuarios Operativos
```
Formato de Clave: SP2024XXXXX, CS2024XXXXX, EP2024XXXXX
Correos: nombre.apellido[numero]@[economia|gob|funcionpublica].gob.mx

Ejemplos:
- maria.hernandez1@economia.gob.mx (Recepción)
- juan.garcia2@gob.mx (Nivel 1)
- ana.martinez3@funcionpublica.gob.mx (Nivel 2)
```

**Nota:** Todos los passwords están hasheados con bcrypt. Para desarrollo, puedes buscar usuarios en la tabla:

```sql
SELECT clave_servidor_publico, nombre_completo, correo_institucional, r.nombre_rol
FROM tbl_usuarios u
JOIN cat_roles r ON u.id_rol = r.id_rol
ORDER BY r.nombre_rol, u.nombre_completo
LIMIT 20;
```

---

## 🔍 Consultas Útiles de Validación

### Ver jerarquía de UAs

```sql
SELECT
    REPEAT('  ', nivel_jerarquico - 1) || nombre_ua as "Unidad Administrativa",
    codigo_ua,
    nivel_jerarquico
FROM cat_unidad_administrativa
ORDER BY nivel_jerarquico, codigo_ua;
```

### Ver distribución de usuarios por rol

```sql
SELECT r.nombre_rol, COUNT(*) as cantidad
FROM tbl_usuarios u
JOIN cat_roles r ON u.id_rol = r.id_rol
GROUP BY r.nombre_rol
ORDER BY cantidad DESC;
```

### Ver documentos con OCR

```sql
SELECT
    folio_interno,
    asunto,
    remitente_nombre,
    confianza_ocr,
    estatus_general
FROM tbl_documento_entrante
ORDER BY fecha_registro DESC
LIMIT 10;
```

### Probar búsqueda Full-Text Search

```sql
-- Búsqueda simple
SELECT * FROM search_documentos('información programa', NULL, 10, 0);

-- Búsqueda por UA específica
SELECT * FROM search_documentos('solicita',
    (SELECT id_ua FROM cat_unidad_administrativa LIMIT 1),
    10, 0);
```

### Ver inventario por categoría

```sql
SELECT
    categoria,
    COUNT(*) as items,
    SUM(valor_total)::NUMERIC(12,2) as valor_total
FROM tbl_inventario
GROUP BY categoria
ORDER BY valor_total DESC;
```

### Ver inventario de una UA específica

```sql
SELECT
    numero_inventario,
    descripcion,
    marca,
    modelo,
    estado,
    valor_total,
    responsable
FROM tbl_inventario
WHERE id_ua = (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001')
ORDER BY categoria, descripcion
LIMIT 20;
```

### Ver turnados pendientes

```sql
SELECT
    d.folio_interno,
    d.asunto,
    t.instruccion,
    t.fecha_vencimiento,
    t.porcentaje_avance,
    t.estatus_turnado,
    ua_o.codigo_ua as origen,
    ua_d.codigo_ua as destino
FROM tbl_turnado t
JOIN tbl_documento_entrante d ON t.id_doc_entrante = d.id_doc_entrante
JOIN cat_unidad_administrativa ua_o ON t.id_ua_origen = ua_o.id_ua
JOIN cat_unidad_administrativa ua_d ON t.id_ua_destino = ua_d.id_ua
WHERE t.estatus_turnado != 'Concluido'
ORDER BY t.fecha_vencimiento
LIMIT 20;
```

---

## 🧪 Siguiente Paso: Pruebas Automatizadas

Una vez creada la BD, puedes ejecutar las pruebas:

```bash
# Instalar dependencias (primera vez)
npm install

# Configurar .env
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar pruebas
npm test

# Con cobertura
npm run test:coverage
```

---

## 🔄 Regenerar Datos

Si necesitas empezar de nuevo:

```bash
# Opción 1: Todo en uno
psql -U postgres -c "DROP DATABASE sisgedi;" && \
psql -U postgres -c "CREATE DATABASE sisgedi;" && \
psql -U postgres -d sisgedi -f database_schema_with_test_data.sql

# Opción 2: Solo limpiar datos (mantiene estructura)
npm run db:reset
npm run seed
npm run seed:inventory
```

---

## 📚 Documentación Completa

- **Instrucciones detalladas:** `docs/INSTRUCCIONES_SEED_Y_TESTING.md`
- **Plan de validación QA:** `docs/PLAN_VALIDACION_EXTERNA_QA.md`
- **Esquema sin datos:** `database_schema.sql`
- **Esquema con datos:** `database_schema_with_test_data.sql`

---

## ⚠️ Troubleshooting

### Error: "database sisgedi already exists"
```bash
psql -U postgres -c "DROP DATABASE sisgedi;"
# Luego crear de nuevo
```

### Error: "extension uuid-ossp does not exist"
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-contrib

# Mac
brew install postgresql
```

### Error: "permission denied"
```bash
psql -U postgres -c "ALTER USER postgres CREATEDB;"
```

### Las pruebas fallan
```bash
# Verificar que la BD existe y tiene datos
psql -U postgres -d sisgedi -c "SELECT COUNT(*) FROM tbl_usuarios;"

# Verificar .env
cat .env

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Estadísticas del Sistema

**Total de registros generados:** ~1,200+
- 20 Unidades Administrativas
- 101 Usuarios
- 100 Documentos Entrantes
- 50 Documentos Salientes
- 300+ Turnados
- 500+ Items de Inventario
- 150 Notificaciones

**Funciones implementadas:** 3
**Triggers implementados:** 5+
**Índices creados:** 40+
**Políticas RLS:** 8

---

## ✅ Checklist de Validación

- [ ] Base de datos creada
- [ ] Extensiones instaladas (uuid-ossp, unaccent, pgcrypto)
- [ ] 20 UAs con jerarquía correcta
- [ ] 101 usuarios distribuidos por roles
- [ ] 100 documentos con OCR
- [ ] 300+ turnados con seguimiento
- [ ] 500+ items de inventario
- [ ] Full-Text Search funcional
- [ ] Triggers activos
- [ ] RLS configurado

---

**¡Todo listo para empezar a trabajar con SISGEDI 2.0!** 🎉
