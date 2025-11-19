# SISGEDI 2.0 - Instrucciones de Seed y Testing

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación](#instalación)
3. [Configuración](#configuración)
4. [Inicialización de Base de Datos](#inicialización-de-base-de-datos)
5. [Generación de Datos de Prueba](#generación-de-datos-de-prueba)
6. [Ejecución de Pruebas](#ejecución-de-pruebas)
7. [Comandos Disponibles](#comandos-disponibles)
8. [Estructura de Datos Generados](#estructura-de-datos-generados)
9. [Troubleshooting](#troubleshooting)

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 15.0
- **npm** o **yarn**
- **Git** (para control de versiones)

Verifica las versiones instaladas:

```bash
node --version
npm --version
psql --version
```

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd SISGEDI
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias:
- **TypeScript** y **tsx** (ejecución de TypeScript)
- **Vitest** (framework de testing)
- **pg** (cliente PostgreSQL)
- **@faker-js/faker** (generación de datos)
- **chalk** y **ora** (utilidades de consola)

---

## ⚙️ Configuración

### 1. Configurar Variables de Entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de PostgreSQL:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sisgedi
DB_USER=postgres
DB_PASSWORD=tu_password_aqui

# Seed Data Configuration
SEED_UNIDADES_ADMINISTRATIVAS=20
SEED_USUARIOS_POR_UA=5
SEED_DOCUMENTOS_ENTRANTES=100
SEED_DOCUMENTOS_SALIENTES=50
SEED_TURNADOS_POR_DOC=3

# Test Configuration
TEST_DB_NAME=sisgedi_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=test_password
```

### 2. Crear la Base de Datos

Conéctate a PostgreSQL y crea la base de datos:

```bash
psql -U postgres
```

```sql
CREATE DATABASE sisgedi;
\c sisgedi

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\q
```

---

## 🗄️ Inicialización de Base de Datos

### 1. Cargar el Esquema

Ejecuta el script SQL para crear todas las tablas:

```bash
psql -U postgres -d sisgedi -f database_schema.sql
```

Esto creará:
- ✅ 14 tablas principales
- ✅ Funciones almacenadas
- ✅ Triggers de seguridad
- ✅ Políticas Row-Level Security (RLS)
- ✅ Datos iniciales (7 roles, catálogos base)

### 2. Verificar la Instalación

```bash
psql -U postgres -d sisgedi -c "\dt"
```

Deberías ver todas las tablas listadas.

---

## 📊 Generación de Datos de Prueba

### Modo Estándar (Recomendado para Desarrollo)

Genera un conjunto básico de datos de prueba:

```bash
npm run seed
```

**Datos generados:**
- 20 Unidades Administrativas (jerarquía completa)
- 100 Usuarios (5 por UA)
- 100 Documentos Entrantes (con OCR simulado)
- 50 Documentos Salientes
- ~300 Turnados
- Notificaciones aleatorias
- Relaciones entre documentos

**Tiempo estimado:** 2-5 minutos

### Modo Completo (Para Testing Exhaustivo)

Genera un conjunto amplio de datos:

```bash
npm run seed:full
```

**Datos generados:**
- 50 Unidades Administrativas
- 500 Usuarios
- 500 Documentos Entrantes
- 200 Documentos Salientes
- ~2,500 Turnados
- Notificaciones extensivas

**Tiempo estimado:** 10-15 minutos

### Generar Solo Inventario

```bash
npm run seed:inventory
```

**Datos generados:**
- Inventario completo para cada UA
- 10-100 items por UA (según nivel jerárquico)
- 8 categorías de bienes:
  - Mobiliario de Oficina
  - Equipo de Cómputo
  - Equipo de Comunicación
  - Equipo de Seguridad
  - Vehículos
  - Equipo de Oficina
  - Climatización
  - Equipo Audiovisual

**Salida:**
- Tabla de resumen por UA
- Tabla de resumen por categoría
- Valores totales de inventario

**Tiempo estimado:** 1-3 minutos

---

## 🧪 Ejecución de Pruebas

### Ejecutar Todas las Pruebas

```bash
npm test
```

**Pruebas incluidas:**
- ✅ Pruebas unitarias de configuración DB
- ✅ Pruebas unitarias de generación de datos
- ✅ Pruebas de integridad de datos
- ✅ Pruebas de reglas de negocio
- ✅ Pruebas de Full-Text Search
- ✅ Pruebas de inventario
- ✅ Pruebas de rendimiento

### Ejecutar Pruebas con Cobertura

```bash
npm run test:coverage
```

**Reportes generados:**
- Reporte en consola
- Reporte HTML en `coverage/index.html`
- Reporte LCOV para integración CI/CD

**Meta de cobertura:** >= 70%

### Ejecutar Pruebas en Modo Watch

```bash
npm run test:watch
```

Útil para desarrollo: las pruebas se ejecutan automáticamente al guardar cambios.

### Ejecutar Pruebas con UI Interactiva

```bash
npm run test:ui
```

Abre una interfaz web en `http://localhost:51204` con:
- Visualización de pruebas
- Inspección de resultados
- Re-ejecución selectiva

---

## 📝 Comandos Disponibles

| Comando | Descripción | Tiempo Estimado |
|---------|-------------|-----------------|
| `npm install` | Instalar dependencias | 1-2 min |
| `npm run seed` | Generar datos estándar | 2-5 min |
| `npm run seed:full` | Generar datos completos | 10-15 min |
| `npm run seed:inventory` | Generar inventario | 1-3 min |
| `npm test` | Ejecutar todas las pruebas | 30-60 seg |
| `npm run test:watch` | Pruebas en modo watch | - |
| `npm run test:coverage` | Pruebas con cobertura | 1-2 min |
| `npm run test:ui` | Interfaz web de pruebas | - |
| `npm run db:reset` | Limpiar base de datos | 10-30 seg |
| `npm run db:init` | Reinicializar esquema | 30-60 seg |

---

## 📂 Estructura de Datos Generados

### Jerarquía de Unidades Administrativas

```
Nivel 1 - Subsecretarías (10%)
  └─ Nivel 2 - Direcciones Generales (20%)
      └─ Nivel 3 - Direcciones (40%)
          └─ Nivel 4 - Jefaturas (30%)
```

### Distribución de Roles

| Rol | Porcentaje | Permisos |
|-----|------------|----------|
| Admin General | 1% | Acceso completo |
| Admin UA | 5% | Gestión de UA |
| Recepción | 40% | Captura documentos |
| Nivel 1 | 25% | Turnado y firma |
| Nivel 2 | 15% | Firma y avance |
| Nivel 3 | 10% | Avance y conclusión |
| Visor | 4% | Solo consulta |

### Estados de Documentos Entrantes

- **Pendiente:** 20%
- **En Proceso:** 50%
- **Concluido:** 20%
- **Archivado:** 10%

### Estados de Documentos Salientes

- **Borrador:** 20%
- **Firmado:** 30%
- **Enviado:** 40%
- **Cancelado:** 10%

---

## 🔍 Troubleshooting

### Error: "Cannot connect to database"

**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql
# O en Mac:
brew services list

# Iniciar PostgreSQL si está detenido
sudo systemctl start postgresql
# O en Mac:
brew services start postgresql
```

### Error: "Database does not exist"

**Solución:**
```bash
psql -U postgres -c "CREATE DATABASE sisgedi;"
```

### Error: "Extension uuid-ossp not found"

**Solución:**
```bash
psql -U postgres -d sisgedi -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### Error: "Permission denied"

**Solución:**
```bash
# Asegúrate de que el usuario tenga permisos
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE sisgedi TO tu_usuario;"
```

### Las pruebas fallan con "timeout"

**Solución:**
```bash
# Aumentar el timeout en vitest.config.ts
testTimeout: 60000  # 60 segundos
```

### El seed es muy lento

**Solución:**
```bash
# Usar modo estándar en lugar de completo
npm run seed  # En lugar de seed:full

# O reducir cantidades en .env
SEED_DOCUMENTOS_ENTRANTES=50
SEED_DOCUMENTOS_SALIENTES=25
```

### Quiero limpiar la base de datos

**Solución:**
```bash
# Opción 1: Reset (mantiene estructura)
npm run db:reset

# Opción 2: Reinicializar completamente
npm run db:init
npm run seed
```

---

## 📊 Validación de Datos

Para validar que los datos se generaron correctamente:

```sql
-- Conectar a la base de datos
psql -U postgres -d sisgedi

-- Verificar cantidades
SELECT 'Unidades Administrativas' as tabla, COUNT(*) FROM cat_unidad_administrativa
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM tbl_usuarios
UNION ALL
SELECT 'Documentos Entrantes', COUNT(*) FROM tbl_documento_entrante
UNION ALL
SELECT 'Documentos Salientes', COUNT(*) FROM tbl_documento_saliente
UNION ALL
SELECT 'Turnados', COUNT(*) FROM tbl_turnado
UNION ALL
SELECT 'Inventario', COUNT(*) FROM tbl_inventario;

-- Verificar integridad referencial
SELECT 'Usuarios sin UA' as problema, COUNT(*)
FROM tbl_usuarios u
WHERE NOT EXISTS (SELECT 1 FROM cat_unidad_administrativa ua WHERE ua.id_ua = u.id_ua);

-- Verificar Full-Text Search
SELECT COUNT(*) as documentos_indexados
FROM tbl_documento_entrante
WHERE ts_contenido_ocr IS NOT NULL;
```

---

## 📞 Soporte

Para reportar problemas o solicitar ayuda:

1. Revisar esta documentación
2. Consultar los logs de errores
3. Verificar la configuración en `.env`
4. Contactar al equipo de desarrollo

---

**Última actualización:** Noviembre 2025
**Versión:** 2.0.0
