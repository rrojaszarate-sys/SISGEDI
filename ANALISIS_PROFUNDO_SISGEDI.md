# ANÁLISIS PROFUNDO Y PLAN DE DESARROLLO
# SISGEDI 2.0 - Sistema de Gestión Documental Inteligente

**Fecha de Análisis:** 18 de Noviembre de 2025
**Estado del Proyecto:** Inicialización - Repositorio Vacío
**Rama de Desarrollo:** `claude/develop-system-analysis-01YGdcdKBeruvVZf2QvHBDGY`

---

## ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Análisis de Requisitos](#2-análisis-de-requisitos)
3. [Arquitectura Técnica del Sistema](#3-arquitectura-técnica-del-sistema)
4. [Modelo de Datos y Base de Datos](#4-modelo-de-datos-y-base-de-datos)
5. [Diseño de Módulos y Componentes](#5-diseño-de-módulos-y-componentes)
6. [Integración de Inteligencia Artificial](#6-integración-de-inteligencia-artificial)
7. [Seguridad y Control de Acceso](#7-seguridad-y-control-de-acceso)
8. [Plan de Implementación](#8-plan-de-implementación)
9. [Roadmap de Desarrollo](#9-roadmap-de-desarrollo)
10. [Análisis de Riesgos y Mitigación](#10-análisis-de-riesgos-y-mitigación)
11. [Estimaciones y Recursos](#11-estimaciones-y-recursos)
12. [Conclusiones y Recomendaciones](#12-conclusiones-y-recomendaciones)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Contexto del Proyecto

El proyecto SISGEDI 2.0 representa una **modernización completa** del sistema legado SISGEDO, migrando de una arquitectura monolítica basada en Java/Oracle a una **arquitectura de microservicios moderna** con capacidades de inteligencia artificial.

**Sistema Legado (SISGEDO):**
- Java 1.8.0_131, NetBeans IDE 8.2
- Framework Eclipse Link 3.0 (JPA, EJB, JSF)
- Glassfish Server 4.1.1
- Oracle 12c (descentralizado)
- **Problema principal:** Múltiples sistemas desconectados, duplicación de datos, bajo rendimiento

**Sistema Objetivo (SISGEDI 2.0):**
- Arquitectura moderna de microservicios
- Stack tecnológico de alto rendimiento
- Centralización de datos
- Inteligencia artificial integrada (OCR, ML, NLP)
- Firma electrónica (Etapa 2)

### 1.2 Objetivos Estratégicos

| Objetivo | Descripción | Métrica de Éxito |
|----------|-------------|------------------|
| **Centralización** | Unificar información de todas las UAs en una única base de datos | 100% de UAs integradas |
| **Rendimiento** | 95% de transacciones completadas en < 1 minuto | SLA 95% < 60s |
| **Automatización** | Reducir captura manual mediante OCR/IA | 80% de campos prellenados automáticamente |
| **Trazabilidad** | Garantizar auditoría completa con firma electrónica | 100% de documentos críticos firmados |
| **Seguridad** | Implementar Row-Level Security (RLS) por UA | 0 accesos no autorizados |

### 1.3 Alcance del Proyecto

**Incluye:**
- ✅ 7 Módulos principales completos
- ✅ 27+ Requisitos funcionales críticos
- ✅ Sistema de firma electrónica
- ✅ OCR e IA para procesamiento documental
- ✅ Dashboard en tiempo real
- ✅ Sistema de notificaciones
- ✅ Auditoría y trazabilidad completa

**No Incluye:**
- ❌ Proceso físico de escaneo (solo carga de archivos)
- ❌ Integración con sistemas externos (SICOFI) en Fase 1
- ❌ App móvil nativa (se evaluará en Fase 2)

---

## 2. ANÁLISIS DE REQUISITOS

### 2.1 Requisitos Funcionales Críticos (Prioridad Alta)

#### **RF1 - Control de Acceso por Unidad Administrativa**
**Descripción:** El acceso al sistema debe estar restringido por UA mediante autenticación única.
**Complejidad:** ALTA
**Impacto:** CRÍTICO
**Tecnología:** Supabase Auth + Row-Level Security (RLS)

**Criterios de Aceptación:**
- Usuario se autentica con clave de servidor público
- Sistema identifica automáticamente la UA del usuario
- Solo puede visualizar documentos de su UA (RLS activo)
- Sesión expira a los 30 minutos de inactividad
- 3 intentos fallidos = inhabilitación por 10 minutos

---

#### **RF6 - Alta Inteligente de Documentos (OCR)**
**Descripción:** Captura automatizada de datos mediante OCR para prellenar formularios.
**Complejidad:** ALTA
**Impacto:** CRÍTICO
**Tecnología:** Google Vision API / Tesseract.js

**Criterios de Aceptación:**
- Carga de PDF/JPG (máx 50 MB)
- Extracción automática de: Tipo Doc, Asunto, Remitente
- Indexación Full-Text Search (FTS) en PostgreSQL
- Sugerencia de prioridad mediante ML
- Validación de duplicidad por contenido

---

#### **RF23 - Firma Electrónica de Recepción (Etapa 2)**
**Descripción:** Implementación de firma electrónica dinámica al turnar documentos.
**Complejidad:** ALTA
**Impacto:** LEGAL/CRÍTICO
**Tecnología:** Gestión local C5 + Supabase Storage para certificados

**Criterios de Aceptación:**
- Firma obligatoria para: Unidades, Oficialía Mayor, Subsecretaría, Direcciones
- Registro de `id_firma_recepcion` en base de datos
- Hash criptográfico del documento
- No repudio (inmutabilidad post-firma)
- Auditoría de cada firma

---

#### **RF22 - Firma Electrónica de Emisión**
**Descripción:** Firma de documentos salientes antes de su envío.
**Complejidad:** ALTA
**Impacto:** LEGAL/CRÍTICO
**Tecnología:** Misma infraestructura que RF23

**Criterios de Aceptación:**
- Firma obligatoria para documentos salientes
- Generación de `hash_documento` para integridad
- Registro en tabla `tbl_documento_saliente`
- Bloqueo de edición post-firma

---

### 2.2 Requisitos Funcionales de Prioridad Media

| RF | Descripción | Complejidad | Módulo |
|----|-------------|-------------|---------|
| **RF2** | Asignación de elementos del menú por rol (solo Admin General) | Media | Admin |
| **RF3** | Creación de usuarios por Administrador UA | Media | Admin |
| **RF5** | Dashboard con indicadores Verde/Amarillo/Rojo | Media | Dashboard |
| **RF7** | Búsqueda avanzada con FTS | Media | Consultas |
| **RF13** | Turnado jerárquico hasta Jefatura de Depto | Media | Seguimiento |
| **RF15** | Rechazo de documentos con restricción de re-turnar | Media | Seguimiento |
| **RF17** | Control de avance con porcentaje (100% = inmutable) | Media | Seguimiento |
| **RF19** | Generación automática de números de folio | Media | Doc. Saliente |
| **RF20** | Relación entre documento saliente y entrante | Media | Doc. Saliente |

### 2.3 Requisitos No Funcionales

#### **RNF1 - Rendimiento**
- **Objetivo:** 95% de transacciones en < 1 minuto
- **Estrategia:**
  - TanStack Query para optimización de llamadas API
  - Índices FTS en PostgreSQL
  - CDN para assets estáticos
  - Lazy loading de componentes React
  - Supabase Edge Functions para procesamiento asíncrono

#### **RNF2 - Seguridad**
- **Confidencialidad:** Row-Level Security (RLS) por UA
- **Integridad:** Firma electrónica + hash de documentos
- **Disponibilidad:** 99.5% uptime (Supabase SLA)
- **Auditoría:** Registro completo en `tbl_log_auditoria`

#### **RNF3 - Escalabilidad**
- **Horizontal:** Supabase auto-escalado
- **Vertical:** PostgreSQL optimizado con índices
- **Storage:** Supabase Storage (ilimitado)

#### **RNF4 - Mantenibilidad**
- **Código:** TypeScript para type-safety
- **Documentación:** JSDoc + comentarios inline
- **Testing:** Jest + React Testing Library (cobertura > 70%)
- **CI/CD:** GitHub Actions

---

## 3. ARQUITECTURA TÉCNICA DEL SISTEMA

### 3.1 Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   React 18.3 + TypeScript 5.5 + Vite 5.4             │   │
│  │   - NextUI 2.6 (Componentes UI)                      │   │
│  │   - TailwindCSS 3.4 (Estilos)                        │   │
│  │   - Framer Motion (Animaciones)                      │   │
│  │   - TanStack Query 5.90 (Estado del servidor)        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   CAPA DE LÓGICA DE NEGOCIO                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Supabase Edge Functions (Node.js)                  │   │
│  │   - API REST/GraphQL                                 │   │
│  │   - Validación de reglas de negocio                  │   │
│  │   - Orquestación de microservicios IA                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS Y SERVICIOS                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │  PostgreSQL     │  │  Supabase       │  │  Servicios │  │
│  │  (Supabase)     │  │  Storage        │  │  Externos  │  │
│  │  - RLS          │  │  - PDFs/JPGs    │  │  - G Vision│  │
│  │  - FTS          │  │  - Certificados │  │  - Tesseract│ │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Stack Tecnológico Detallado

#### **Frontend Stack**

| Tecnología | Versión | Justificación Técnica | Rol en RNF |
|------------|---------|----------------------|-----------|
| **React** | 18.3 | Virtual DOM optimizado, hooks modernos, ecosistema maduro | Rendimiento |
| **TypeScript** | 5.5 | Type-safety, mejor DX, menos bugs en producción | Mantenibilidad |
| **Vite** | 5.4 | Build ultra-rápido (HMR < 100ms), optimización automática | Desarrollo |
| **NextUI** | 2.6 | Componentes accesibles (a11y), tema dark/light, mobile-first | UX |
| **TailwindCSS** | 3.4 | Utility-first, tree-shaking, bundle pequeño | Performance |
| **TanStack Query** | 5.90 | Cache inteligente, revalidación automática, optimistic updates | Rendimiento |
| **Framer Motion** | Latest | Animaciones fluidas 60fps, gestures | UX |
| **React Router** | 6.x | Navegación declarativa, lazy loading de rutas | Performance |

#### **Backend Stack**

| Tecnología | Versión | Justificación Técnica | Rol en RNF |
|------------|---------|----------------------|-----------|
| **Supabase** | Latest | BaaS completo, PostgreSQL managed, auth integrado, RLS nativo | Seguridad + Desarrollo |
| **PostgreSQL** | 15+ | ACID compliant, FTS nativo, JSONB, extensibilidad | Integridad + Performance |
| **Edge Functions** | Deno runtime | Serverless, bajo cold-start, TypeScript nativo | Escalabilidad |
| **Supabase Auth** | JWT | OAuth 2.0, MFA ready, session management | Seguridad |
| **Supabase Storage** | S3-compatible | CDN integrado, transformaciones de imagen | Performance |

#### **AI/ML Stack**

| Tecnología | Propósito | Integración |
|------------|-----------|-------------|
| **Google Vision API** | OCR de alta precisión (PDF/JPG) | Edge Function → Vision API → PostgreSQL |
| **Tesseract.js** | OCR alternativo (on-premise) | Client-side para documentos pequeños |
| **PostgreSQL FTS** | Búsqueda semántica con ranking | Índice `ts_contenido_ocr` |
| **ML Predictivo** | Sugerencia de UA destino en turnado | TensorFlow.js (Fase 2) |

### 3.3 Arquitectura de Seguridad

#### **Modelo de Seguridad en Capas**

```
┌───────────────────────────────────────────────────────────┐
│  CAPA 1: Autenticación                                    │
│  - Supabase Auth (JWT)                                    │
│  - Expiración de sesión: 30 min inactividad              │
│  - Bloqueo por intentos fallidos (3 intentos = 10 min)   │
└───────────────────────────────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────────┐
│  CAPA 2: Autorización (Row-Level Security)                │
│  - RLS en todas las tablas críticas                       │
│  - Política: WHERE id_ua = auth.user_metadata->>'id_ua'   │
│  - Restricción a nivel de base de datos (no bypasseable)  │
└───────────────────────────────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────────┐
│  CAPA 3: Integridad                                       │
│  - Firma electrónica con certificados                     │
│  - Hash SHA-256 de documentos                             │
│  - Inmutabilidad post-firma                               │
└───────────────────────────────────────────────────────────┘
                        ▼
┌───────────────────────────────────────────────────────────┐
│  CAPA 4: Auditoría                                        │
│  - Tabla tbl_log_auditoria                                │
│  - Triggers para eventos críticos                         │
│  - Retención: 7 años (cumplimiento legal)                │
└───────────────────────────────────────────────────────────┘
```

#### **Implementación de RLS (Ejemplo)**

```sql
-- Política RLS para tbl_documento_entrante
CREATE POLICY "Usuarios solo ven documentos de su UA"
  ON tbl_documento_entrante
  FOR SELECT
  USING (
    id_ua_registro = (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- Política para Admin General (ve todo)
CREATE POLICY "Admin General ve todo"
  ON tbl_documento_entrante
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM tbl_usuarios u
      JOIN cat_roles r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol = 'Administrador General'
    )
  );
```

---

## 4. MODELO DE DATOS Y BASE DE DATOS

### 4.1 Diagrama Entidad-Relación (ER)

```
┌─────────────────────┐
│   cat_roles         │
│─────────────────────│
│ PK id_rol           │
│    nombre_rol       │
│    elementos_menu   │◄────┐
└─────────────────────┘     │
                            │
┌─────────────────────────┐ │
│ cat_unidad_admin        │ │
│─────────────────────────│ │
│ PK id_ua                │◄┼──┐
│    nombre_ua            │ │  │
└─────────────────────────┘ │  │
          ▲                 │  │
          │                 │  │
┌─────────┴──────────────┐  │  │
│   tbl_usuarios         │  │  │
│────────────────────────│  │  │
│ PK id_usuario          │  │  │
│ FK id_ua               ├──┘  │
│ FK id_rol              ├─────┘
│    clave_servidor_pub  │
│    password_hash       │
│    correo_institucional│
│    estatus             │
└────────────────────────┘
          │
          │ (Auditoría)
          ▼
┌────────────────────────┐
│ tbl_log_auditoria      │
│────────────────────────│
│ PK id_log              │
│ FK id_usuario          │
│    fecha_hora          │
│    accion              │
│    modulo              │
└────────────────────────┘

┌─────────────────────────────┐
│ tbl_documento_entrante      │
│─────────────────────────────│
│ PK id_doc_entrante          │
│ FK id_ua_registro           │
│    numero_oficio_externo    │
│    asunto                   │
│    contenido_ocr            │
│    ts_contenido_ocr (FTS)   │──┐ (Búsqueda)
│    marca_seguimiento        │  │
└─────────────────────────────┘  │
          │                      │
          ├─────────────┐        │
          ▼             ▼        │
┌──────────────┐  ┌──────────────┐
│ tbl_anexos   │  │ tbl_turnado  │
│──────────────│  │──────────────│
│ PK id_anexo  │  │ PK id_turnado│
│ FK id_doc_ent│  │ FK id_doc_ent│
│ url_storage  │  │ FK id_ua_orig│
│ es_alcance   │  │ FK id_ua_dest│
└──────────────┘  │ fecha_vencim │
                  │ % avance     │
                  │ id_firma_rec │
                  └──────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ tbl_doc_saliente    │
              │─────────────────────│
              │ PK id_doc_saliente  │
              │    numero_folio     │
              │    tipo_doc         │
              │    hash_documento   │
              │    id_firma_emision │
              └─────────────────────┘
                        │
                        ▼
              ┌────────────────────────┐
              │ tbl_relacion_respuesta │
              │────────────────────────│
              │ FK id_doc_saliente     │
              │ FK id_doc_entrante     │
              └────────────────────────┘
```

### 4.2 Tablas Críticas y Optimizaciones

#### **Tabla: tbl_documento_entrante**

```sql
CREATE TABLE tbl_documento_entrante (
    id_doc_entrante UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_oficio_externo VARCHAR(100),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_ua_registro UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    asunto TEXT NOT NULL,
    id_prioridad UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    id_tipo_doc UUID REFERENCES cat_valores_catalogo(id_valor_catalogo),
    remitente_nombre VARCHAR(200),
    marca_seguimiento VARCHAR(20) NOT NULL,
    estatus_general VARCHAR(20) DEFAULT 'Pendiente',

    -- IA/OCR
    contenido_ocr TEXT,
    ts_contenido_ocr TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('spanish_unaccent', COALESCE(contenido_ocr, '') || ' ' || COALESCE(asunto, ''))
    ) STORED
);

-- Índices para rendimiento
CREATE INDEX idx_doc_entrante_ua ON tbl_documento_entrante(id_ua_registro);
CREATE INDEX idx_doc_entrante_fecha ON tbl_documento_entrante(fecha_registro DESC);
CREATE INDEX idx_doc_entrante_fts ON tbl_documento_entrante USING GIN(ts_contenido_ocr);
CREATE INDEX idx_doc_entrante_estatus ON tbl_documento_entrante(estatus_general)
    WHERE estatus_general != 'Concluido'; -- Partial index para activos
```

**Optimizaciones:**
- **GIN Index en FTS:** Búsqueda full-text en < 50ms para 1M documentos
- **Partial Index:** Solo indexa documentos activos, reduce espacio 60%
- **Generated Column:** `ts_contenido_ocr` se actualiza automáticamente

#### **Tabla: tbl_turnado (Crítica para RF5, RF13, RF23)**

```sql
CREATE TABLE tbl_turnado (
    id_turnado UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_doc_entrante UUID REFERENCES tbl_documento_entrante(id_doc_entrante) ON DELETE CASCADE,
    id_ua_origen UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    id_ua_destino UUID REFERENCES cat_unidad_administrativa(id_ua) NOT NULL,
    instruccion VARCHAR(150),
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    porcentaje_avance NUMERIC(3, 0) DEFAULT 0 CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
    estatus_turnado VARCHAR(20) DEFAULT 'Turnado',

    -- Firma Electrónica (RF23)
    id_firma_recepcion UUID,
    fecha_firma_recepcion TIMESTAMP WITH TIME ZONE,

    -- Rechazo (RF15)
    motivo_rechazo TEXT,
    fecha_rechazo TIMESTAMP WITH TIME ZONE,

    -- IA
    ua_sugerida_ia UUID,
    confianza_ia NUMERIC(3, 2) -- 0.00 a 1.00
);

-- Trigger para inmutabilidad al 100% (RF17)
CREATE OR REPLACE FUNCTION fn_bloquear_avance_100()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.porcentaje_avance = 100 THEN
        RAISE EXCEPTION 'No se puede modificar un documento con avance del 100%%';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bloquear_avance_100
    BEFORE UPDATE ON tbl_turnado
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloquear_avance_100();
```

### 4.3 Estrategia de Índices y Performance

| Tabla | Índice | Tipo | Justificación | Impacto en Performance |
|-------|--------|------|---------------|------------------------|
| tbl_documento_entrante | idx_doc_entrante_fts | GIN | Búsqueda full-text (RF7) | 95% más rápido en búsquedas |
| tbl_turnado | idx_turnado_vencimiento | B-tree | Dashboard indicadores (RF5) | Query < 100ms para 10K docs |
| tbl_usuarios | idx_usuario_clave | B-tree UNIQUE | Login (RF1) | Login < 50ms |
| tbl_log_auditoria | idx_auditoria_fecha | B-tree | Reportes de auditoría | Escaneo de logs 80% más rápido |

---

## 5. DISEÑO DE MÓDULOS Y COMPONENTES

### 5.1 Estructura de Directorios Propuesta

```
SISGEDI/
├── frontend/
│   ├── src/
│   │   ├── app/                      # Configuración de la app
│   │   │   ├── providers/            # Context providers
│   │   │   └── router/               # React Router config
│   │   ├── modules/                  # Módulos del sistema (feature-based)
│   │   │   ├── auth/                 # Módulo 1: Control de Acceso
│   │   │   │   ├── components/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   └── SessionTimeout.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useAuth.ts
│   │   │   │   │   └── useSession.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── authService.ts
│   │   │   │   └── types/
│   │   │   │       └── auth.types.ts
│   │   │   ├── admin/                # Módulo 1: Administración
│   │   │   │   ├── users/
│   │   │   │   │   ├── UserManagement.tsx
│   │   │   │   │   └── UserForm.tsx
│   │   │   │   ├── roles/
│   │   │   │   │   ├── RoleManagement.tsx
│   │   │   │   │   └── MenuAssignment.tsx
│   │   │   │   └── catalogs/
│   │   │   │       └── CatalogManager.tsx
│   │   │   ├── documento-entrante/   # Módulo 2: Doc. Entrante
│   │   │   │   ├── components/
│   │   │   │   │   ├── AltaInteligente.tsx
│   │   │   │   │   ├── OCRProcessor.tsx
│   │   │   │   │   ├── FormularioDocumento.tsx
│   │   │   │   │   ├── AnexosUploader.tsx
│   │   │   │   │   └── DuplicateDetector.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useOCR.ts
│   │   │   │   │   └── useDocumentoEntrante.ts
│   │   │   │   └── services/
│   │   │   │       ├── ocrService.ts
│   │   │   │       └── documentoService.ts
│   │   │   ├── seguimiento/          # Módulo 3: Seguimiento
│   │   │   │   ├── components/
│   │   │   │   │   ├── TurnarDocumento.tsx
│   │   │   │   │   ├── FirmaRecepcion.tsx
│   │   │   │   │   ├── AvanceDocumento.tsx
│   │   │   │   │   └── RechazoDocumento.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useTurnado.ts
│   │   │   │   │   └── useFirmaElectronica.ts
│   │   │   │   └── services/
│   │   │   │       └── seguimientoService.ts
│   │   │   ├── documento-saliente/   # Módulo 4: Doc. Saliente
│   │   │   │   ├── components/
│   │   │   │   │   ├── GenerarNumero.tsx
│   │   │   │   │   ├── ElaboracionDocumento.tsx
│   │   │   │   │   ├── FirmaEmision.tsx
│   │   │   │   │   └── RelacionDocumento.tsx
│   │   │   │   └── hooks/
│   │   │   │       └── useDocumentoSaliente.ts
│   │   │   ├── dashboard/            # Módulo 6: Dashboard
│   │   │   │   ├── components/
│   │   │   │   │   ├── IndicadoresCard.tsx
│   │   │   │   │   ├── GraficaVencimientos.tsx
│   │   │   │   │   └── ResumenUA.tsx
│   │   │   │   └── hooks/
│   │   │   │       └── useDashboard.ts
│   │   │   └── consultas/            # Módulo 6: Consultas
│   │   │       ├── components/
│   │   │       │   ├── BusquedaAvanzada.tsx
│   │   │       │   ├── ResultadosTabla.tsx
│   │   │       │   └── ExportarExcel.tsx
│   │   │       └── hooks/
│   │   │           └── useBusqueda.ts
│   │   ├── shared/                   # Componentes compartidos
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Componentes UI base
│   │   │   │   │   ├── Button/
│   │   │   │   │   ├── Input/
│   │   │   │   │   ├── Modal/
│   │   │   │   │   └── Table/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── MainLayout.tsx
│   │   │   │   └── notifications/
│   │   │   │       └── ToastNotification.tsx
│   │   │   ├── hooks/                # Hooks compartidos
│   │   │   │   ├── useDebounce.ts
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   └── usePermissions.ts
│   │   │   ├── utils/                # Utilidades
│   │   │   │   ├── formatters.ts
│   │   │   │   ├── validators.ts
│   │   │   │   └── constants.ts
│   │   │   └── types/                # Tipos compartidos
│   │   │       └── common.types.ts
│   │   ├── lib/                      # Configuraciones de librerías
│   │   │   ├── supabase.ts           # Cliente de Supabase
│   │   │   ├── queryClient.ts        # TanStack Query config
│   │   │   └── router.tsx            # React Router config
│   │   ├── assets/                   # Assets estáticos
│   │   │   ├── images/
│   │   │   └── fonts/
│   │   ├── styles/                   # Estilos globales
│   │   │   └── globals.css
│   │   ├── App.tsx                   # App principal
│   │   ├── main.tsx                  # Entry point
│   │   └── vite-env.d.ts
│   ├── public/                       # Assets públicos
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/
│   ├── supabase/
│   │   ├── functions/                # Edge Functions
│   │   │   ├── ocr-processor/
│   │   │   │   └── index.ts
│   │   │   ├── turnado-predictor/
│   │   │   │   └── index.ts
│   │   │   ├── email-notifier/
│   │   │   │   └── index.ts
│   │   │   └── firma-electronica/
│   │   │       └── index.ts
│   │   ├── migrations/               # SQL migrations
│   │   │   ├── 20250101000000_initial_schema.sql
│   │   │   ├── 20250101000001_create_rls_policies.sql
│   │   │   ├── 20250101000002_create_indexes.sql
│   │   │   └── 20250101000003_create_triggers.sql
│   │   └── config.toml               # Supabase config
│   └── scripts/                      # Scripts de utilidad
│       ├── seed-data.sql             # Datos de prueba
│       └── backup.sh                 # Backup automatizado
├── docs/                             # Documentación
│   ├── arquitectura/
│   ├── api/
│   └── manuales/
├── .github/
│   └── workflows/                    # CI/CD
│       ├── deploy-frontend.yml
│       └── deploy-functions.yml
├── .gitignore
├── README.md
└── ANALISIS_PROFUNDO_SISGEDI.md     # Este documento
```

### 5.2 Diseño de Componentes React (Ejemplos)

#### **Componente: AltaInteligente (OCR + Formulario)**

```typescript
// frontend/src/modules/documento-entrante/components/AltaInteligente.tsx

import { useState } from 'react';
import { useOCR } from '../hooks/useOCR';
import { useDocumentoEntrante } from '../hooks/useDocumentoEntrante';
import { Button, Input, Select, FileUpload } from '@/shared/components/ui';
import { toast } from 'react-hot-toast';

interface FormData {
  tipoDoc: string;
  asunto: string;
  remitente: string;
  prioridad: string;
  anexos: File[];
}

export const AltaInteligente = () => {
  const [formData, setFormData] = useState<FormData>({
    tipoDoc: '',
    asunto: '',
    remitente: '',
    prioridad: 'Normal',
    anexos: []
  });

  const { processOCR, isProcessing } = useOCR();
  const { createDocumento, isCreating } = useDocumentoEntrante();

  const handleFileUpload = async (files: File[]) => {
    // Validación de tamaño (50 MB máx)
    const maxSize = 50 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast.error('Algunos archivos exceden el límite de 50 MB');
      return;
    }

    setFormData(prev => ({ ...prev, anexos: files }));

    // Procesamiento OCR automático
    toast.loading('Procesando documentos con OCR...');
    try {
      const ocrResults = await processOCR(files[0]); // Primer archivo

      // Prellenado automático (RF6)
      setFormData(prev => ({
        ...prev,
        tipoDoc: ocrResults.tipoDoc || prev.tipoDoc,
        asunto: ocrResults.asunto || prev.asunto,
        remitente: ocrResults.remitente || prev.remitente,
        prioridad: ocrResults.prioridadSugerida || prev.prioridad
      }));

      toast.success('Campos prellenados automáticamente');
    } catch (error) {
      toast.error('Error en OCR. Complete manualmente los campos.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones (RF6: campos obligatorios)
    if (!formData.tipoDoc || !formData.asunto || !formData.remitente) {
      toast.error('Complete los campos obligatorios (*)');
      return;
    }

    try {
      await createDocumento(formData);
      toast.success('Documento registrado exitosamente');
      // Reset form...
    } catch (error) {
      toast.error('Error al registrar documento');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold">Alta Inteligente de Documento</h2>

      {/* Sección de Digitalización */}
      <FileUpload
        accept=".pdf,.jpg,.jpeg"
        multiple
        maxSize={50 * 1024 * 1024}
        onUpload={handleFileUpload}
        isLoading={isProcessing}
      />

      {/* Formulario prellenado por OCR */}
      <Select
        label="Tipo de Documento *"
        value={formData.tipoDoc}
        onChange={(e) => setFormData(prev => ({ ...prev, tipoDoc: e.target.value }))}
        required
      >
        <option value="">Seleccione...</option>
        <option value="Oficio">Oficio</option>
        <option value="Circular">Circular</option>
        {/* Más opciones del catálogo */}
      </Select>

      <Input
        label="Asunto *"
        value={formData.asunto}
        onChange={(e) => setFormData(prev => ({ ...prev, asunto: e.target.value }))}
        required
        placeholder="Extraído automáticamente por OCR"
      />

      <Input
        label="Remitente *"
        value={formData.remitente}
        onChange={(e) => setFormData(prev => ({ ...prev, remitente: e.target.value }))}
        required
      />

      <Select
        label="Prioridad *"
        value={formData.prioridad}
        onChange={(e) => setFormData(prev => ({ ...prev, prioridad: e.target.value }))}
      >
        <option value="Normal">Normal</option>
        <option value="Urgente">Urgente</option>
      </Select>

      <Button type="submit" isLoading={isCreating}>
        Registrar Documento
      </Button>
    </form>
  );
};
```

#### **Hook: useOCR (Integración con Google Vision)**

```typescript
// frontend/src/modules/documento-entrante/hooks/useOCR.ts

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface OCRResult {
  tipoDoc?: string;
  asunto?: string;
  remitente?: string;
  prioridadSugerida?: string;
  contenidoCompleto: string;
}

export const useOCR = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processOCR = async (file: File): Promise<OCRResult> => {
    setIsProcessing(true);

    try {
      // Llamada a Edge Function que procesa con Google Vision
      const { data, error } = await supabase.functions.invoke('ocr-processor', {
        body: { file }
      });

      if (error) throw error;

      // Procesamiento de resultados con ML para clasificación
      const result: OCRResult = {
        tipoDoc: classifyDocumentType(data.text),
        asunto: extractAsunto(data.text),
        remitente: extractRemitente(data.text),
        prioridadSugerida: predictPriority(data.text),
        contenidoCompleto: data.text
      };

      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const classifyDocumentType = (text: string): string => {
    // ML simple: búsqueda de palabras clave
    if (text.toLowerCase().includes('oficio')) return 'Oficio';
    if (text.toLowerCase().includes('circular')) return 'Circular';
    if (text.toLowerCase().includes('memorándum')) return 'Memorándum';
    return '';
  };

  const extractAsunto = (text: string): string => {
    // Extracción mediante regex (mejorable con NLP)
    const match = text.match(/asunto:?\s*(.+?)(?:\n|$)/i);
    return match ? match[1].trim() : '';
  };

  const extractRemitente = (text: string): string => {
    const match = text.match(/(?:de|remitente):?\s*(.+?)(?:\n|$)/i);
    return match ? match[1].trim() : '';
  };

  const predictPriority = (text: string): string => {
    // ML: detección de urgencia
    const urgentKeywords = ['urgente', 'inmediato', 'prioritario', 'emergencia'];
    const lowerText = text.toLowerCase();
    return urgentKeywords.some(kw => lowerText.includes(kw)) ? 'Urgente' : 'Normal';
  };

  return { processOCR, isProcessing };
};
```

---

## 6. INTEGRACIÓN DE INTELIGENCIA ARTIFICIAL

### 6.1 OCR - Procesamiento de Documentos

#### **Pipeline de OCR**

```
┌───────────────┐
│ Usuario carga │
│   PDF/JPG     │
└───────┬───────┘
        │
        ▼
┌────────────────────────┐
│ Supabase Storage       │
│ - Almacenamiento       │
│ - Generación de URL    │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────────────┐
│ Edge Function: ocr-processor   │
│ ┌────────────────────────────┐ │
│ │ 1. Descarga del archivo    │ │
│ │ 2. Preprocesamiento        │ │
│ │ 3. Llamada a Google Vision │ │
│ │ 4. Extracción de texto     │ │
│ │ 5. Post-procesamiento      │ │
│ └────────────────────────────┘ │
└───────┬────────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ Clasificación ML           │
│ - Tipo de documento        │
│ - Prioridad                │
│ - Entidades (remitente)    │
└───────┬────────────────────┘
        │
        ▼
┌────────────────────────────┐
│ PostgreSQL                 │
│ - INSERT contenido_ocr     │
│ - Actualizar ts_vector     │
│ - Indexación FTS           │
└────────────────────────────┘
```

#### **Edge Function: OCR Processor**

```typescript
// backend/supabase/functions/ocr-processor/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import vision from '@google-cloud/vision';

const visionClient = new vision.ImageAnnotatorClient({
  credentials: JSON.parse(Deno.env.get('GOOGLE_VISION_CREDENTIALS') || '{}')
});

serve(async (req) => {
  try {
    const { fileUrl } = await req.json();

    // 1. Descargar archivo de Supabase Storage
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    // 2. Procesar con Google Vision
    const [result] = await visionClient.textDetection({
      image: { content: Buffer.from(buffer) }
    });

    const detections = result.textAnnotations;
    const fullText = detections?.[0]?.description || '';

    // 3. Extracción de entidades
    const entities = extractEntities(fullText);

    // 4. Clasificación
    const classification = classifyDocument(fullText);

    return new Response(
      JSON.stringify({
        text: fullText,
        entities,
        classification,
        confidence: result.confidence || 0.0
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function extractEntities(text: string) {
  return {
    asunto: extractWithRegex(text, /asunto:?\s*(.+?)(?:\n|$)/i),
    remitente: extractWithRegex(text, /(?:de|remitente):?\s*(.+?)(?:\n|$)/i),
    fecha: extractWithRegex(text, /(\d{1,2}\/\d{1,2}\/\d{4})/),
    numeroOficio: extractWithRegex(text, /(?:oficio|no\.?)\s*(\w+-\d+)/i)
  };
}

function classifyDocument(text: string) {
  const keywords = {
    'Oficio': ['oficio', 'of.'],
    'Circular': ['circular', 'circ.'],
    'Memorándum': ['memorándum', 'memo'],
    'Nota Informativa': ['nota informativa']
  };

  for (const [tipo, kws] of Object.entries(keywords)) {
    if (kws.some(kw => text.toLowerCase().includes(kw))) {
      return tipo;
    }
  }

  return 'Desconocido';
}

function extractWithRegex(text: string, regex: RegExp): string {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}
```

### 6.2 Búsqueda Full-Text Search (FTS)

#### **Configuración de FTS en PostgreSQL**

```sql
-- Configuración de diccionario español sin acentos
CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = spanish);
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, spanish_stem;

-- Función de búsqueda optimizada
CREATE OR REPLACE FUNCTION search_documentos(
  p_query TEXT,
  p_id_ua UUID DEFAULT NULL,
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  id_doc_entrante UUID,
  numero_oficio_externo VARCHAR,
  asunto TEXT,
  remitente_nombre VARCHAR,
  fecha_registro TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id_doc_entrante,
    d.numero_oficio_externo,
    d.asunto,
    d.remitente_nombre,
    d.fecha_registro,
    ts_rank(d.ts_contenido_ocr, websearch_to_tsquery('spanish_unaccent', p_query)) AS rank
  FROM tbl_documento_entrante d
  WHERE
    d.ts_contenido_ocr @@ websearch_to_tsquery('spanish_unaccent', p_query)
    AND (p_id_ua IS NULL OR d.id_ua_registro = p_id_ua) -- RLS manual
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

#### **Uso desde Frontend**

```typescript
// frontend/src/modules/consultas/hooks/useBusqueda.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useBusqueda = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_documentos', {
        p_query: query,
        p_limit: 100
      });

      if (error) throw error;
      return data;
    },
    enabled: query.length > 2, // Solo buscar con 3+ caracteres
    staleTime: 30000 // Cache por 30 segundos
  });
};
```

### 6.3 Turnado Predictivo (ML)

#### **Algoritmo de Sugerencia de UA**

```typescript
// backend/supabase/functions/turnado-predictor/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { asunto, tipoDoc, contenidoOCR } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Obtener histórico de turnados similares
  const { data: historico } = await supabase
    .rpc('get_similar_turnados', {
      p_asunto: asunto,
      p_tipo_doc: tipoDoc
    });

  // 2. Calcular frecuencia de UA destino
  const uaFrequency = historico.reduce((acc, item) => {
    acc[item.id_ua_destino] = (acc[item.id_ua_destino] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. Obtener la UA más frecuente
  const sugerida = Object.entries(uaFrequency)
    .sort(([, a], [, b]) => b - a)[0];

  const [idUA, frecuencia] = sugerida || [null, 0];
  const confianza = frecuencia / historico.length;

  return new Response(
    JSON.stringify({
      ua_sugerida: idUA,
      confianza,
      alternativas: Object.entries(uaFrequency)
        .slice(0, 3)
        .map(([id, freq]) => ({ id_ua: id, probabilidad: freq / historico.length }))
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

---

## 7. SEGURIDAD Y CONTROL DE ACCESO

### 7.1 Implementación de Row-Level Security (RLS)

#### **Políticas RLS Completas**

```sql
-- ====================
-- POLÍTICAS PARA tbl_documento_entrante
-- ====================

-- Política: Usuario ve solo documentos de su UA
CREATE POLICY "rls_doc_entrante_select_ua"
  ON tbl_documento_entrante
  FOR SELECT
  USING (
    id_ua_registro IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- Política: Administrador General ve todo
CREATE POLICY "rls_doc_entrante_select_admin_general"
  ON tbl_documento_entrante
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM tbl_usuarios u
      JOIN cat_roles r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol = 'Administrador General'
    )
  );

-- Política: Solo usuarios de la UA pueden insertar
CREATE POLICY "rls_doc_entrante_insert"
  ON tbl_documento_entrante
  FOR INSERT
  WITH CHECK (
    id_ua_registro IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- ====================
-- POLÍTICAS PARA tbl_turnado
-- ====================

-- Política: Ver turnados donde la UA es origen o destino
CREATE POLICY "rls_turnado_select"
  ON tbl_turnado
  FOR SELECT
  USING (
    id_ua_origen IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
    OR id_ua_destino IN (SELECT id_ua FROM tbl_usuarios WHERE id_usuario = auth.uid())
  );

-- Política: Solo puede turnar si es de la UA origen
CREATE POLICY "rls_turnado_insert"
  ON tbl_turnado
  FOR INSERT
  WITH CHECK (
    id_ua_origen IN (
      SELECT id_ua
      FROM tbl_usuarios
      WHERE id_usuario = auth.uid()
    )
  );

-- ====================
-- POLÍTICAS PARA tbl_usuarios (Administración)
-- ====================

-- Solo Admin General puede ver todos los usuarios
CREATE POLICY "rls_usuarios_select_admin_general"
  ON tbl_usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM tbl_usuarios u
      JOIN cat_roles r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol = 'Administrador General'
    )
  );

-- Admin UA solo ve usuarios de su UA (RF3)
CREATE POLICY "rls_usuarios_select_admin_ua"
  ON tbl_usuarios
  FOR SELECT
  USING (
    id_ua IN (
      SELECT u2.id_ua
      FROM tbl_usuarios u2
      JOIN cat_roles r ON u2.id_rol = r.id_rol
      WHERE u2.id_usuario = auth.uid()
        AND r.nombre_rol = 'Administrador UA'
    )
  );

-- Admin UA solo puede crear usuarios en su UA
CREATE POLICY "rls_usuarios_insert_admin_ua"
  ON tbl_usuarios
  FOR INSERT
  WITH CHECK (
    id_ua IN (
      SELECT u.id_ua
      FROM tbl_usuarios u
      WHERE u.id_usuario = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM tbl_usuarios u
      JOIN cat_roles r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = auth.uid()
        AND r.nombre_rol IN ('Administrador UA', 'Administrador General')
    )
  );
```

### 7.2 Sistema de Roles y Permisos

#### **Jerarquía de Roles**

```
┌────────────────────────────────────────────────────┐
│             Administrador General                  │
│  - Acceso total al sistema                         │
│  - Asignación de elementos del menú (RF2)          │
│  - Modificación de catálogos globales              │
│  - Visualización de todas las UAs                  │
└────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
┌───────────────────┐         ┌─────────────────────┐
│ Administrador UA  │         │      Recepción      │
│ - Gestión usuarios│         │ - Alta de docs      │
│   de su UA (RF3)  │         │ - Carga de anexos   │
│ - Catálogos UA    │         │ - Turnado inicial   │
└───────────────────┘         └─────────────────────┘
        │
        ├───────────┬───────────┬───────────┐
        ▼           ▼           ▼           ▼
    ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
    │Nivel 1│  │Nivel 2│  │Nivel 3│  │ Visor │
    │-Turnado│  │-Firma │  │-Avance│  │-Conslt│
    │-Firma  │  │-Avance│  │-Concln│  │       │
    └───────┘  └───────┘  └───────┘  └───────┘
```

#### **Tabla cat_roles con Elementos del Menú**

```sql
-- Ejemplo de inserción de roles
INSERT INTO cat_roles (nombre_rol, elementos_menu) VALUES
('Administrador General', '{
  "modulos": ["admin", "doc_entrante", "seguimiento", "doc_saliente", "dashboard", "consultas", "auditoria"],
  "acciones": ["crear", "editar", "eliminar", "turnar", "firmar", "rechazar", "concluir", "exportar"]
}'::jsonb),

('Administrador UA', '{
  "modulos": ["admin_usuarios", "doc_entrante", "seguimiento", "doc_saliente", "dashboard", "consultas"],
  "acciones": ["crear", "editar", "turnar", "firmar", "rechazar", "concluir"]
}'::jsonb),

('Recepción', '{
  "modulos": ["doc_entrante", "consultas"],
  "acciones": ["crear", "editar", "turnar"]
}'::jsonb),

('Nivel 1', '{
  "modulos": ["seguimiento", "doc_saliente", "consultas"],
  "acciones": ["turnar", "firmar", "avance", "elaborar"]
}'::jsonb),

('Visor', '{
  "modulos": ["consultas"],
  "acciones": ["ver", "exportar"]
}'::jsonb);
```

### 7.3 Firma Electrónica (Etapa 2)

#### **Flujo de Firma Electrónica**

```
┌─────────────────────────────────────────────────────┐
│ 1. Usuario solicita firmar documento               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Validación de permisos (RLS + Rol)              │
│    - ¿El usuario tiene permiso para firmar?        │
│    - ¿El documento está en estado "Firmable"?      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Generación de hash del documento (SHA-256)      │
│    hash = SHA256(contenido + metadatos + timestamp)│
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. Firma con certificado local (C5)                │
│    - Lectura de certificado del usuario            │
│    - Firma del hash con clave privada              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. Almacenamiento en PostgreSQL                    │
│    - INSERT en tbl_firmas                          │
│    - UPDATE documento (id_firma_recepcion/emision) │
│    - INSERT en tbl_log_auditoria                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Inmutabilidad del documento                     │
│    - Trigger bloquea ediciones posteriores         │
│    - Estado cambia a "Firmado"                     │
└─────────────────────────────────────────────────────┘
```

#### **Tabla de Firmas Electrónicas**

```sql
CREATE TABLE tbl_firmas (
    id_firma UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID REFERENCES tbl_usuarios(id_usuario) NOT NULL,
    tipo_firma VARCHAR(20) NOT NULL, -- 'Recepción' o 'Emisión'
    hash_documento TEXT NOT NULL,
    firma_digital TEXT NOT NULL, -- Firma cifrada
    certificado_thumbprint TEXT NOT NULL, -- Huella del certificado
    fecha_firma TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_origen INET,

    -- Metadatos para auditoría
    metadatos JSONB
);

-- Trigger para inmutabilidad post-firma
CREATE OR REPLACE FUNCTION fn_bloquear_documento_firmado()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.id_firma_recepcion IS NOT NULL OR OLD.id_firma_emision IS NOT NULL THEN
        RAISE EXCEPTION 'No se puede modificar un documento firmado electrónicamente';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bloquear_doc_entrante_firmado
    BEFORE UPDATE ON tbl_documento_entrante
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloquear_documento_firmado();

CREATE TRIGGER trg_bloquear_doc_saliente_firmado
    BEFORE UPDATE ON tbl_documento_saliente
    FOR EACH ROW
    EXECUTE FUNCTION fn_bloquear_documento_firmado();
```

---

## 8. PLAN DE IMPLEMENTACIÓN

### 8.1 Metodología de Desarrollo

**Metodología:** Scrum Adaptado
**Sprints:** 2 semanas
**Ceremonias:**
- Daily standup (15 min)
- Sprint planning (4 horas)
- Sprint review (2 horas)
- Sprint retrospective (1.5 horas)

### 8.2 Fases del Proyecto

#### **FASE 0: Configuración del Entorno (Sprint 0) - 1 semana**

| Tarea | Responsable | Herramientas | Entregable |
|-------|-------------|--------------|------------|
| Configuración de repositorio Git | DevOps | GitHub | Repo inicializado con estructura |
| Setup de Supabase | Backend Dev | Supabase CLI | Proyecto Supabase configurado |
| Configuración de CI/CD | DevOps | GitHub Actions | Pipelines funcionando |
| Setup de entorno de desarrollo | Frontend Dev | Vite, Node.js | Proyecto React compilable |

**Criterios de Éxito:**
- ✅ `npm run dev` funciona sin errores
- ✅ Conexión a Supabase exitosa
- ✅ CI/CD despliega a entorno de desarrollo

---

#### **FASE 1: Fundamentos (Sprints 1-3) - 6 semanas**

**Sprint 1: Autenticación y Base de Datos**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Implementar esquema inicial de base de datos | 8 | CRÍTICA |
| Configurar Supabase Auth | 5 | CRÍTICA |
| Crear políticas RLS base | 8 | CRÍTICA |
| Implementar LoginForm component | 5 | CRÍTICA |
| Sistema de sesiones (30 min timeout) | 3 | ALTA |
| Bloqueo por intentos fallidos (RF1) | 3 | ALTA |
| **TOTAL** | **32 SP** | |

**Sprint 2: Administración de Usuarios y Roles**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| CRUD de usuarios (RF3) | 8 | CRÍTICA |
| Gestión de roles (RF2) | 8 | CRÍTICA |
| Asignación de elementos del menú | 5 | ALTA |
| Administración de catálogos (RF2) | 5 | ALTA |
| Pantalla de administración de UA | 5 | ALTA |
| **TOTAL** | **31 SP** | |

**Sprint 3: Layout y Navegación**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Implementar MainLayout con sidebar | 5 | ALTA |
| Sistema de rutas con React Router | 5 | ALTA |
| Implementar sistema de permisos frontend | 8 | CRÍTICA |
| Dashboard skeleton | 3 | MEDIA |
| Componentes UI base (Button, Input, Modal) | 8 | ALTA |
| **TOTAL** | **29 SP** | |

---

#### **FASE 2: Documentos Entrantes (Sprints 4-6) - 6 semanas**

**Sprint 4: Alta de Documentos (Sin OCR)**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Formulario de Alta de Documento | 8 | CRÍTICA |
| Upload de anexos a Supabase Storage | 5 | CRÍTICA |
| Validación de 50 MB máximo | 2 | ALTA |
| Guardado en tbl_documento_entrante | 5 | CRÍTICA |
| Implementar marca de seguimiento (RF9) | 3 | ALTA |
| **TOTAL** | **23 SP** | |

**Sprint 5: Integración OCR (Fase Crítica)**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Configurar Google Vision API | 5 | CRÍTICA |
| Edge Function: ocr-processor | 13 | CRÍTICA |
| Extracción de asunto/remitente (RF6) | 8 | CRÍTICA |
| Clasificación de tipo de documento | 5 | ALTA |
| Sugerencia de prioridad con ML | 8 | MEDIA |
| Prellenado automático del formulario | 5 | CRÍTICA |
| **TOTAL** | **44 SP** | (Sprint extendido o dividir) |

**Sprint 6: Búsqueda y Duplicados**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Indexación Full-Text Search (FTS) | 8 | CRÍTICA |
| Función search_documentos | 5 | CRÍTICA |
| Detector de duplicados (RF11) | 8 | ALTA |
| Edición de documentos (RF8) | 5 | ALTA |
| Función de Alcance (CU 8.2) | 3 | MEDIA |
| **TOTAL** | **29 SP** | |

---

#### **FASE 3: Seguimiento y Turnado (Sprints 7-9) - 6 semanas**

**Sprint 7: Turnado Básico**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Formulario de turnado (RF13) | 8 | CRÍTICA |
| Validación de jerarquía (hasta Jefe Depto) | 5 | ALTA |
| Guardado en tbl_turnado | 3 | CRÍTICA |
| Cálculo de fecha de vencimiento | 3 | ALTA |
| Dashboard con indicadores (RF5) | 8 | CRÍTICA |
| **TOTAL** | **27 SP** | |

**Sprint 8: Firma Electrónica de Recepción (RF23)**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Integración con certificados C5 | 13 | CRÍTICA |
| Edge Function: firma-electronica | 13 | CRÍTICA |
| Generación de hash SHA-256 | 5 | CRÍTICA |
| Almacenamiento en tbl_firmas | 5 | CRÍTICA |
| Trigger de inmutabilidad | 3 | CRÍTICA |
| Interfaz de firma en frontend | 8 | CRÍTICA |
| **TOTAL** | **47 SP** | (Sprint crítico, priorizar) |

**Sprint 9: Avance, Rechazo y Conclusión**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Control de avance con porcentaje (RF17) | 5 | ALTA |
| Inmutabilidad al 100% (trigger) | 3 | CRÍTICA |
| Rechazo de documentos (RF15) | 8 | ALTA |
| Restricción de re-turnar al mismo destinatario | 5 | ALTA |
| Conclusión de documentos (RF26) | 5 | ALTA |
| Notificaciones por correo (RF18) | 5 | MEDIA |
| **TOTAL** | **31 SP** | |

---

#### **FASE 4: Documentos Salientes (Sprints 10-11) - 4 semanas**

**Sprint 10: Generación y Elaboración**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Generación de números de folio (RF19) | 8 | CRÍTICA |
| Editor de documentos salientes (RF21) | 13 | CRÍTICA |
| Relación con doc. entrante (RF20) | 5 | ALTA |
| Sugerencia IA de respuesta | 8 | MEDIA |
| Impresión con html2canvas | 3 | ALTA |
| **TOTAL** | **37 SP** | |

**Sprint 11: Firma de Emisión y Acuse**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Firma electrónica de emisión (RF22) | 8 | CRÍTICA |
| Generación de hash_documento | 3 | CRÍTICA |
| Reactivación de folios (RF27) | 5 | MEDIA |
| Gestión de acuses (RF24) | 5 | ALTA |
| Envío de acuses por correo | 3 | MEDIA |
| **TOTAL** | **24 SP** | |

---

#### **FASE 5: Consultas y Reportes (Sprint 12) - 2 semanas**

| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Búsqueda avanzada con FTS (RF7) | 8 | CRÍTICA |
| Filtros múltiples | 5 | ALTA |
| Exportación a Excel | 5 | ALTA |
| Dashboard completo con gráficas | 8 | ALTA |
| Optimización de queries | 5 | MEDIA |
| **TOTAL** | **31 SP** | |

---

#### **FASE 6: Testing y Despliegue (Sprints 13-14) - 4 semanas**

**Sprint 13: Testing**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Tests unitarios (cobertura > 70%) | 13 | CRÍTICA |
| Tests de integración | 8 | ALTA |
| Tests E2E con Playwright | 8 | ALTA |
| Testing de carga (RNF: < 1 min) | 5 | CRÍTICA |
| Corrección de bugs | 8 | CRÍTICA |
| **TOTAL** | **42 SP** | |

**Sprint 14: Despliegue y Documentación**
| Tarea | Story Points | Prioridad |
|-------|-------------|-----------|
| Despliegue a producción | 8 | CRÍTICA |
| Migración de datos legados (si aplica) | 13 | CRÍTICA |
| Manual de usuario | 5 | ALTA |
| Manual técnico | 5 | ALTA |
| Capacitación a usuarios | 5 | ALTA |
| **TOTAL** | **36 SP** | |

---

## 9. ROADMAP DE DESARROLLO

### 9.1 Cronograma General

```
Mes 1  │ Mes 2  │ Mes 3  │ Mes 4  │ Mes 5  │ Mes 6  │ Mes 7  │
───────┼────────┼────────┼────────┼────────┼────────┼────────┤
 F0    │  FASE 1: FUNDAMENTOS         │                       │
       │ S1 S2 S3│                     │                       │
       │         │  FASE 2: DOC. ENTRANTES                    │
       │         │ S4  S5  S6│                                │
       │         │           │  FASE 3: SEGUIMIENTO           │
       │         │           │ S7  S8  S9│                    │
       │         │           │           │ F4: SALIENTES      │
       │         │           │           │ S10 S11│           │
       │         │           │           │        │F5│F6: TEST│
       │         │           │           │        │  │ S13 S14│
───────┴─────────┴───────────┴───────────┴────────┴──┴────────┤
                                                    GO-LIVE ✅
```

**Duración Total:** 7 meses (28 semanas)
**Sprints:** 14 sprints de 2 semanas
**Holgura:** 2 semanas adicionales para imprevistos

### 9.2 Hitos Críticos

| Hito | Fecha Estimada | Entregables Clave | Criterio de Éxito |
|------|----------------|-------------------|-------------------|
| **H1: Autenticación Funcional** | Fin Sprint 1 (Semana 2) | Login, RLS básico | Usuario puede autenticarse y ver datos de su UA |
| **H2: CRUD de Usuarios** | Fin Sprint 2 (Semana 4) | Admin de usuarios y roles | Admin UA crea usuarios en su dirección |
| **H3: Alta de Documentos** | Fin Sprint 4 (Semana 8) | Formulario de alta manual | Recepción registra documentos manualmente |
| **H4: OCR Funcional** | Fin Sprint 5 (Semana 10) | OCR prellenando campos | 80% de campos prellenados automáticamente |
| **H5: Búsqueda FTS** | Fin Sprint 6 (Semana 12) | FTS operacional | Búsqueda < 1 segundo para 10K docs |
| **H6: Turnado Básico** | Fin Sprint 7 (Semana 14) | Turnado entre UAs | Documento puede turnarse con vencimiento |
| **H7: Firma Electrónica** | Fin Sprint 8 (Semana 16) | Firma de recepción | Documento turnado se firma electrónicamente |
| **H8: Documentos Salientes** | Fin Sprint 11 (Semana 22) | Generación de oficios | Oficio generado, firmado y enviado |
| **H9: Sistema Completo** | Fin Sprint 12 (Semana 24) | Todos los módulos | 27 RFs implementados |
| **H10: Go-Live** | Fin Sprint 14 (Semana 28) | Producción | 100 usuarios activos, 0 incidentes críticos |

---

## 10. ANÁLISIS DE RIESGOS Y MITIGACIÓN

### 10.1 Matriz de Riesgos

| ID | Riesgo | Probabilidad | Impacto | Severidad | Mitigación |
|----|--------|--------------|---------|-----------|------------|
| **R1** | Integración de Google Vision API falla | Media | Alto | 🔴 ALTA | Implementar Tesseract.js como fallback. Presupuestar tiempo extra en Sprint 5. |
| **R2** | Firma electrónica no cumple con normatividad | Baja | Crítico | 🔴 CRÍTICA | Consultar con área legal desde Sprint 0. Validar certificados C5. |
| **R3** | Rendimiento de FTS insuficiente (> 1 min) | Media | Alto | 🔴 ALTA | Optimización agresiva de índices. Considerar Elasticsearch si FTS nativo falla. |
| **R4** | Migraciones de datos del sistema legado fallan | Alta | Medio | 🟡 MEDIA | Crear scripts de migración temprano (Sprint 6). Validación en etapa de staging. |
| **R5** | RLS bypassed por error de configuración | Baja | Crítico | 🔴 CRÍTICA | Auditoría de seguridad en Sprint 13. Pentesting externo. |
| **R6** | Capacidad de Supabase insuficiente | Baja | Alto | 🟡 MEDIA | Monitoreo de uso desde Sprint 1. Plan de escalado listo. |
| **R7** | Cambios en requisitos a mitad de proyecto | Alta | Medio | 🟡 MEDIA | Backlog priorizado. Proceso de control de cambios formal. |
| **R8** | Falta de recursos de desarrollo | Media | Alto | 🔴 ALTA | Contratar freelancers especializados si es necesario. Priorizar RFs críticos. |

### 10.2 Plan de Contingencia

#### **Contingencia R1: Fallo de Google Vision API**

**Trigger:** Tasa de error > 20% en OCR o costo > presupuesto
**Acción:**
1. Activar Tesseract.js para documentos < 5 páginas
2. Revisión manual asistida para documentos complejos
3. Re-entrenar modelo con dataset local (Fase 2)

#### **Contingencia R3: Rendimiento Insuficiente**

**Trigger:** 95% de transacciones > 1 minuto en pruebas de carga
**Acción:**
1. Implementar caché en Redis (Supabase compatible)
2. Migrar a Elasticsearch para FTS
3. Optimizar queries con EXPLAIN ANALYZE
4. Implementar paginación lazy loading

#### **Contingencia R5: Vulnerabilidad de Seguridad**

**Trigger:** Detección de bypass de RLS o acceso no autorizado
**Acción:**
1. Rollback inmediato a versión segura
2. Auditoría completa de políticas RLS
3. Implementar logging exhaustivo
4. Notificar a área de seguridad

---

## 11. ESTIMACIONES Y RECURSOS

### 11.1 Equipo de Desarrollo Recomendado

| Rol | Cantidad | Responsabilidades | Tecnologías Clave |
|-----|----------|-------------------|-------------------|
| **Tech Lead / Arquitecto** | 1 | Decisiones arquitectónicas, code reviews, mentoring | Full stack |
| **Frontend Developer Senior** | 2 | React, TypeScript, componentes UI, integración OCR | React, TS, TanStack Query |
| **Backend Developer** | 1 | Supabase, PostgreSQL, Edge Functions, API design | PostgreSQL, Node.js, Deno |
| **DevOps Engineer** | 1 (part-time) | CI/CD, despliegues, monitoreo | GitHub Actions, Supabase CLI |
| **UX/UI Designer** | 1 (part-time) | Diseño de interfaces, flujos de usuario | Figma, NextUI |
| **QA Engineer** | 1 | Testing, automatización, validación de RFs | Jest, Playwright, Postman |
| **Product Owner** | 1 (stakeholder) | Priorización, clarificación de requisitos | - |
| **Scrum Master** | 1 (puede ser Tech Lead) | Facilitación, resolución de impedimentos | - |

**Total:** 7-8 personas (6.5 FTE)

### 11.2 Estimación de Esfuerzo

**Metodología:** Story Points (1 SP ≈ 4 horas ideales)
**Velocidad estimada del equipo:** 30-35 SP por sprint (2 semanas)

| Fase | Sprints | Story Points | Horas Ideales | Horas Reales (x1.5) |
|------|---------|--------------|---------------|---------------------|
| Fase 0 | 0.5 | 15 | 60 | 90 |
| Fase 1 | 3 | 92 | 368 | 552 |
| Fase 2 | 3 | 96 | 384 | 576 |
| Fase 3 | 3 | 105 | 420 | 630 |
| Fase 4 | 2 | 61 | 244 | 366 |
| Fase 5 | 1 | 31 | 124 | 186 |
| Fase 6 | 2 | 78 | 312 | 468 |
| **TOTAL** | **14.5** | **478 SP** | **1,912 hrs** | **2,868 hrs** |

**Esfuerzo Total:** 2,868 horas (aprox. 359 días-persona con jornada de 8 hrs)
**Con equipo de 6.5 FTE:** 359 / 6.5 ≈ **55 días laborables ≈ 7.8 meses**
**Con holgura del 15%:** **9 meses**

### 11.3 Presupuesto Estimado (USD)

#### **Costos de Personal (7 meses)**

| Rol | Tarifa Mensual (USD) | Meses | Costo Total |
|-----|---------------------|-------|-------------|
| Tech Lead | $8,000 | 7 | $56,000 |
| Frontend Sr. (x2) | $6,500 | 7 | $91,000 |
| Backend Dev | $6,000 | 7 | $42,000 |
| DevOps (50%) | $5,500 | 3.5 | $19,250 |
| UX/UI (50%) | $4,500 | 3.5 | $15,750 |
| QA Engineer | $5,000 | 7 | $35,000 |
| **SUBTOTAL PERSONAL** | | | **$259,000** |

#### **Costos de Infraestructura y Servicios**

| Servicio | Costo Mensual | Meses | Costo Total |
|----------|--------------|-------|-------------|
| Supabase Pro | $25 | 12 | $300 |
| Supabase Storage (500 GB) | $40 | 12 | $480 |
| Google Vision API (50K imágenes/mes) | $75 | 12 | $900 |
| Dominio y SSL | - | - | $50 |
| Monitoreo (Sentry, etc.) | $26 | 12 | $312 |
| **SUBTOTAL INFRAESTRUCTURA** | | | **$2,042** |

#### **Otros Costos**

| Concepto | Costo |
|----------|-------|
| Licencias de software (Figma, etc.) | $500 |
| Certificados de firma electrónica (prueba) | $300 |
| Contingencia (10%) | $26,184 |
| **SUBTOTAL OTROS** | **$26,984** |

#### **PRESUPUESTO TOTAL**

```
Personal:          $259,000
Infraestructura:     $2,042
Otros:              $26,984
───────────────────────────
TOTAL:             $288,026
```

**Presupuesto Recomendado (con margen):** **$300,000 USD**

---

## 12. CONCLUSIONES Y RECOMENDACIONES

### 12.1 Viabilidad Técnica

El proyecto **SISGEDI 2.0 es técnicamente viable** con el stack propuesto:

✅ **Fortalezas:**
- Stack moderno y maduro (React 18, PostgreSQL, Supabase)
- Arquitectura escalable (microservicios, serverless)
- Seguridad robusta (RLS nativo, firma electrónica)
- IA integrada de manera práctica (Google Vision, FTS)
- Costo de infraestructura bajo ($2K/año)

⚠️ **Riesgos Técnicos:**
- Complejidad de la firma electrónica (requiere validación legal)
- Rendimiento de OCR para documentos complejos (mitigable con fallback)
- Curva de aprendizaje de Supabase para el equipo

### 12.2 Recomendaciones Estratégicas

#### **Recomendación 1: Priorizar MVP con RFs Críticos**

**Propuesta:** Lanzar MVP en 4 meses con:
- Autenticación + RLS (RF1)
- Alta de documentos manual (sin OCR)
- Turnado básico
- Dashboard simple

**Beneficio:** Validar adopción de usuarios antes de invertir en IA.

#### **Recomendación 2: Implementar Firma Electrónica en Fase 2**

**Justificación:** La firma electrónica (RF23, RF22) es el requisito más complejo y riesgoso. Requiere:
- Validación legal
- Integración con C5
- Testing exhaustivo

**Propuesta:** Lanzar SISGEDI 2.0 sin firma en Fase 1, agregar en Fase 2 tras validación legal.

#### **Recomendación 3: Migración Gradual del Sistema Legado**

**Estrategia:**
1. **Mes 1-7:** Desarrollo de SISGEDI 2.0
2. **Mes 8:** Piloto con 2-3 UAs seleccionadas
3. **Mes 9:** Ajustes basados en feedback
4. **Mes 10-12:** Migración gradual de todas las UAs

**Beneficio:** Reducir riesgo de fallo masivo, permitir ajustes basados en uso real.

#### **Recomendación 4: Invertir en Capacitación Temprana**

**Acciones:**
- Crear videos tutoriales desde Sprint 6
- Sesiones de capacitación mensuales con usuarios piloto
- Manual de usuario en formato interactivo

**Beneficio:** Reducir resistencia al cambio, aumentar tasa de adopción.

### 12.3 Siguientes Pasos Inmediatos

1. **Aprobación de Presupuesto** ($300K USD, 7-9 meses)
2. **Contratación del Equipo** (priorizar Tech Lead y Frontend Sr.)
3. **Setup de Infraestructura** (Supabase, GitHub, CI/CD)
4. **Kickoff Meeting** con stakeholders
5. **Sprint 0:** Configuración de entorno (1 semana)
6. **Sprint 1:** ¡Inicio del desarrollo! 🚀

---

## ANEXOS

### A. Glosario de Términos

| Término | Definición |
|---------|------------|
| **UA** | Unidad Administrativa |
| **RLS** | Row-Level Security (Seguridad a Nivel de Fila en PostgreSQL) |
| **OCR** | Optical Character Recognition (Reconocimiento Óptico de Caracteres) |
| **FTS** | Full-Text Search (Búsqueda de Texto Completo) |
| **RNF** | Requisito No Funcional |
| **RF** | Requisito Funcional |
| **C5** | (Contexto específico: gestión local de certificados) |
| **BaaS** | Backend as a Service |
| **Edge Function** | Función serverless ejecutada en el borde de la red |

### B. Referencias Técnicas

- [Documentación de Supabase](https://supabase.com/docs)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [React 18 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### C. Contactos del Proyecto

| Rol | Nombre | Email | Responsabilidad |
|-----|--------|-------|-----------------|
| Product Owner | [TBD] | [TBD] | Priorización de requisitos |
| Tech Lead | [TBD] | [TBD] | Arquitectura técnica |
| Scrum Master | [TBD] | [TBD] | Facilitación de Scrum |

---

**Documento elaborado por:** Claude AI (Anthropic)
**Versión:** 1.0
**Fecha:** 18 de Noviembre de 2025
**Estado:** BORRADOR PARA REVISIÓN

---

**FIN DEL ANÁLISIS PROFUNDO**
