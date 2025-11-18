# SISGEDI 2.0

**Sistema de Gestión Documental Inteligente**

[![Estado](https://img.shields.io/badge/Estado-En%20Desarrollo-yellow)]()
[![Versión](https://img.shields.io/badge/Versión-2.0-blue)]()
[![Licencia](https://img.shields.io/badge/Licencia-Propietaria-red)]()

---

## 📋 Descripción

SISGEDI 2.0 es la **modernización completa** del sistema legado SISGEDO, transformándolo en una plataforma de gestión documental inteligente con capacidades de:

- 🤖 **Inteligencia Artificial**: OCR automático, clasificación de documentos, turnado predictivo
- 🔒 **Seguridad Avanzada**: Row-Level Security (RLS), firma electrónica, auditoría completa
- ⚡ **Alto Rendimiento**: 95% de transacciones en < 1 minuto
- 📊 **Centralización**: Base de datos única para todas las Unidades Administrativas
- 📱 **Interfaz Moderna**: React 18 + TypeScript + NextUI

---

## 🎯 Objetivos del Proyecto

| Objetivo | Descripción | Métrica |
|----------|-------------|---------|
| **Centralización** | Unificar información de todas las UAs | 100% de UAs integradas |
| **Rendimiento** | Optimizar tiempos de respuesta | 95% transacciones < 60s |
| **Automatización** | Reducir captura manual | 80% campos prellenados |
| **Trazabilidad** | Garantizar auditoría completa | 100% docs críticos firmados |
| **Seguridad** | Implementar RLS por UA | 0 accesos no autorizados |

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

```
┌─────────────────────────────────────────┐
│          FRONTEND                       │
│  React 18.3 + TypeScript 5.5 + Vite    │
│  NextUI 2.6 + TailwindCSS 3.4          │
│  TanStack Query 5.90                   │
└────────────┬────────────────────────────┘
             │ HTTPS
┌────────────┴────────────────────────────┐
│          BACKEND                        │
│  Supabase Edge Functions (Node.js)     │
│  PostgreSQL 15+ (RLS + FTS)            │
│  Supabase Storage                      │
└────────────┬────────────────────────────┘
             │
┌────────────┴────────────────────────────┐
│          SERVICIOS IA                   │
│  Google Vision API (OCR)               │
│  Tesseract.js (Fallback)               │
│  PostgreSQL FTS (Búsqueda)             │
└─────────────────────────────────────────┘
```

### Tecnologías Principales

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| **Frontend** | React | 18.3 | Framework UI |
| | TypeScript | 5.5 | Type-safety |
| | Vite | 5.4 | Build tool |
| | NextUI | 2.6 | Componentes UI |
| | TailwindCSS | 3.4 | Estilos |
| **Backend** | Supabase | Latest | BaaS completo |
| | PostgreSQL | 15+ | Base de datos |
| | Edge Functions | Deno | Serverless |
| **IA/ML** | Google Vision | v1 | OCR de alta precisión |
| | Tesseract.js | Latest | OCR alternativo |

---

## 📁 Estructura del Proyecto

```
SISGEDI/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── modules/         # Módulos por funcionalidad
│   │   │   ├── auth/        # Autenticación
│   │   │   ├── admin/       # Administración
│   │   │   ├── documento-entrante/
│   │   │   ├── seguimiento/
│   │   │   ├── documento-saliente/
│   │   │   ├── dashboard/
│   │   │   └── consultas/
│   │   ├── shared/          # Componentes compartidos
│   │   └── lib/             # Configuraciones
│   └── package.json
├── backend/
│   └── supabase/
│       ├── functions/       # Edge Functions
│       └── migrations/      # SQL migrations
├── docs/                    # Documentación
├── ANALISIS_PROFUNDO_SISGEDI.md  # Análisis completo
├── database_schema.sql      # Esquema de BD
└── README.md                # Este archivo
```

---

## 🚀 Módulos del Sistema

### 1️⃣ Control de Acceso y Administración (RF1-RF3)

- ✅ Autenticación con clave de servidor público
- ✅ Row-Level Security (RLS) por Unidad Administrativa
- ✅ Gestión de usuarios y roles
- ✅ Asignación de elementos del menú (solo Admin General)
- ✅ Administración de catálogos

### 2️⃣ Documento Entrante (RF6, RF8, RF11)

- 🤖 **Alta Inteligente con OCR**
  - Extracción automática de: Tipo Doc, Asunto, Remitente
  - Clasificación predictiva de prioridad
  - Detección de duplicados con FTS
- 📎 Upload de anexos (PDF/JPG, máx 50 MB)
- ✏️ Edición de documentos
- 📄 Alcance a documentos

### 3️⃣ Seguimiento y Turnado (RF13, RF15, RF17, RF23)

- 🔄 Turnado jerárquico hasta Jefatura de Departamento
- 🔮 **Turnado Predictivo con IA** (sugerencia de UA destino)
- 🖊️ **Firma Electrónica de Recepción** (Etapa 2)
- 📊 Control de avance con porcentaje (100% = inmutable)
- ❌ Rechazo de documentos (restricción de re-turnar)
- ✅ Conclusión de documentos

### 4️⃣ Documento Saliente (RF19-RF22, RF27)

- 🔢 Generación automática de números de folio
- 📝 Elaboración de documentos (Oficio, Nota, Circular, Memorándum)
- 🔗 Relación con documento entrante
- 🖊️ **Firma Electrónica de Emisión** (Etapa 2)
- ♻️ Reactivación de folios cancelados
- 📧 Gestión de acuses

### 5️⃣ Dashboard (RF5)

- 🟢 Indicadores Verde/Amarillo/Rojo (vencimientos)
- 📈 Gráficas de documentos por UA
- 📊 Resumen de pendientes
- 🔔 Notificaciones en tiempo real

### 6️⃣ Consultas y Reportes (RF7)

- 🔍 **Búsqueda Avanzada con Full-Text Search**
- 🔎 Búsqueda semántica en contenido OCR
- 📤 Exportación a Excel
- 📄 Reportes personalizados

---

## 🔒 Seguridad

### Modelo de Seguridad en 4 Capas

1. **Autenticación**
   - Supabase Auth (JWT)
   - Expiración: 30 min de inactividad
   - Bloqueo: 3 intentos fallidos = 10 min

2. **Autorización (RLS)**
   - Políticas a nivel de base de datos
   - Restricción por Unidad Administrativa
   - No bypasseable desde el código

3. **Integridad**
   - Firma electrónica con certificados
   - Hash SHA-256 de documentos
   - Inmutabilidad post-firma

4. **Auditoría**
   - Tabla `tbl_log_auditoria`
   - Triggers automáticos
   - Retención: 7 años

---

## 📊 Requisitos del Sistema

### Requisitos Funcionales Críticos

| RF | Descripción | Prioridad | Estado |
|----|-------------|-----------|--------|
| **RF1** | Control de acceso por UA | CRÍTICA | 📝 Pendiente |
| **RF6** | Alta inteligente con OCR | CRÍTICA | 📝 Pendiente |
| **RF7** | Búsqueda avanzada con FTS | CRÍTICA | 📝 Pendiente |
| **RF13** | Turnado jerárquico | CRÍTICA | 📝 Pendiente |
| **RF23** | Firma electrónica de recepción | CRÍTICA | 📝 Pendiente |
| **RF22** | Firma electrónica de emisión | CRÍTICA | 📝 Pendiente |

> 📋 **Total:** 27+ requisitos funcionales. Ver [ANALISIS_PROFUNDO_SISGEDI.md](./ANALISIS_PROFUNDO_SISGEDI.md) para detalle completo.

### Requisitos No Funcionales

- **RNF1 - Rendimiento:** 95% de transacciones en < 1 minuto
- **RNF2 - Seguridad:** RLS + Firma electrónica + Auditoría
- **RNF3 - Escalabilidad:** Auto-escalado con Supabase
- **RNF4 - Mantenibilidad:** TypeScript + Testing (cobertura > 70%)

---

## 🗓️ Roadmap de Desarrollo

### Cronograma General (7 meses)

```
Mes 1-2  │ FASE 1: FUNDAMENTOS
         │ ✓ Autenticación + RLS
         │ ✓ Admin de usuarios/roles
         │ ✓ Layout y navegación

Mes 2-3  │ FASE 2: DOCUMENTOS ENTRANTES
         │ ✓ Alta de documentos
         │ ✓ Integración OCR
         │ ✓ Búsqueda FTS

Mes 3-4  │ FASE 3: SEGUIMIENTO Y TURNADO
         │ ✓ Turnado básico
         │ ✓ Firma electrónica (CRÍTICO)
         │ ✓ Avance, rechazo, conclusión

Mes 5    │ FASE 4: DOCUMENTOS SALIENTES
         │ ✓ Generación de folios
         │ ✓ Elaboración
         │ ✓ Firma de emisión

Mes 6    │ FASE 5: CONSULTAS Y REPORTES
         │ ✓ Dashboard completo
         │ ✓ Búsquedas avanzadas

Mes 7    │ FASE 6: TESTING Y DESPLIEGUE
         │ ✓ Testing (70% cobertura)
         │ ✓ Migración de datos
         │ ✓ Go-Live 🚀
```

### Hitos Críticos

| Hito | Fecha | Entregable |
|------|-------|------------|
| **H1** | Semana 2 | Autenticación funcional |
| **H4** | Semana 10 | OCR funcional (80% prellenado) |
| **H7** | Semana 16 | Firma electrónica operativa |
| **H10** | Semana 28 | **Go-Live** ✅ |

---

## 💻 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm 9+
- Cuenta de Supabase
- Cuenta de Google Cloud (para Vision API)

### Instalación

```bash
# Clonar el repositorio
git clone [URL_DEL_REPO]
cd SISGEDI

# Instalar dependencias del frontend
cd frontend
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en modo desarrollo
npm run dev
```

### Configuración de Base de Datos

```bash
# Instalar Supabase CLI
npm install -g supabase

# Conectar con el proyecto
supabase link --project-ref [YOUR_PROJECT_REF]

# Ejecutar migraciones
supabase db push

# Aplicar seed data
psql [CONNECTION_STRING] < database_schema.sql
```

---

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con cobertura
npm run test:coverage

# Tests E2E
npm run test:e2e

# Objetivo: > 70% de cobertura
```

---

## 📖 Documentación

- **[Análisis Profundo](./ANALISIS_PROFUNDO_SISGEDI.md)** - Documento completo de análisis y arquitectura
- **[Esquema de BD](./database_schema.sql)** - DDL completo de PostgreSQL
- **[API Docs](./docs/api/)** - Documentación de APIs (por crear)
- **[Manual de Usuario](./docs/manuales/)** - Guías de uso (por crear)

---

## 👥 Equipo de Desarrollo

| Rol | Responsabilidad |
|-----|-----------------|
| **Tech Lead** | Arquitectura y decisiones técnicas |
| **Frontend Dev (x2)** | React, TypeScript, UI/UX |
| **Backend Dev** | Supabase, PostgreSQL, Edge Functions |
| **DevOps** | CI/CD, despliegues, monitoreo |
| **QA Engineer** | Testing, validación de RFs |
| **UX/UI Designer** | Diseño de interfaces |

---

## 📝 Licencia

Este proyecto es **propietario** y confidencial. Todos los derechos reservados.

---

## 📞 Contacto

Para preguntas o soporte, contactar a:
- **Product Owner:** [TBD]
- **Tech Lead:** [TBD]
- **Email:** [TBD]

---

## 🔄 Estado del Proyecto

**Última actualización:** 18 de Noviembre de 2025
**Estado:** 🟡 En Fase de Análisis
**Próximo hito:** Sprint 0 - Configuración de Entorno

---

## ⚠️ Notas Importantes

1. **Firma Electrónica:** Requiere validación legal antes de implementación
2. **OCR:** Google Vision API tiene costos por uso, considerar presupuesto
3. **Migración:** Planear migración gradual del sistema legado (SISGEDO)
4. **Capacitación:** Iniciar capacitación temprana para reducir resistencia al cambio

---

**Desarrollado con ❤️ para la modernización del sistema de gestión documental**
