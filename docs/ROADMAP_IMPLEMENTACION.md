# ROADMAP DE IMPLEMENTACIÓN - SISGEDI 2.0

## Estado Actual del Proyecto

**Fecha:** 19 de Noviembre de 2025
**Rama:** `claude/continue-analysis-01K4uR5zUUR6ZzVePxYNQZ4e`
**Estado:** ✅ Fase 0 Completa - Infraestructura Base

---

## ✅ Fase 0: Configuración Inicial (COMPLETADA)

### Logros

- ✅ Estructura completa del proyecto creada
- ✅ Configuración de Vite + React + TypeScript
- ✅ Integración de Supabase
- ✅ Módulo de autenticación básico implementado
- ✅ Sistema de RLS (Row-Level Security) configurado
- ✅ Layout principal y navegación
- ✅ Dashboard básico funcional
- ✅ Configuración de CI/CD con GitHub Actions

### Archivos Creados

#### Frontend
- `frontend/package.json` - Dependencias del proyecto
- `frontend/tsconfig.json` - Configuración de TypeScript
- `frontend/vite.config.ts` - Configuración de Vite
- `frontend/tailwind.config.js` - Configuración de TailwindCSS
- `frontend/index.html` - Punto de entrada HTML
- `frontend/src/main.tsx` - Punto de entrada de React
- `frontend/src/App.tsx` - Componente principal con rutas
- `frontend/src/lib/supabase.ts` - Cliente de Supabase

#### Módulo de Autenticación
- `frontend/src/modules/auth/store/authStore.ts` - Estado global de autenticación
- `frontend/src/modules/auth/pages/LoginPage.tsx` - Página de login

#### Layout y Dashboard
- `frontend/src/shared/components/layout/MainLayout.tsx` - Layout principal
- `frontend/src/modules/dashboard/pages/DashboardPage.tsx` - Dashboard

#### Backend
- `backend/supabase/config.toml` - Configuración de Supabase
- `backend/supabase/migrations/20250101000000_initial_schema.sql` - Esquema inicial
- `backend/supabase/migrations/20250101000001_create_rls_policies.sql` - Políticas RLS
- `backend/supabase/functions/ocr-processor/index.ts` - Edge Function para OCR

#### Documentación
- `docs/INSTRUCCIONES_SETUP.md` - Instrucciones de instalación
- `ANALISIS_PROFUNDO_SISGEDI.md` - Análisis completo del sistema
- `FUNCIONALIDADES_VANGUARDIA_2025.md` - Funcionalidades de vanguardia
- `README.md` - Documentación principal

---

## 📋 Fase 1: Fundamentos (Sprints 1-3) - PRÓXIMA

**Duración estimada:** 6 semanas
**Objetivo:** Sistema funcional con autenticación, administración de usuarios y navegación completa

### Sprint 1: Autenticación y Base de Datos (Semanas 1-2)

**Tareas Pendientes:**

- [ ] Completar integración con Supabase Auth
- [ ] Implementar timeout de sesión (30 minutos de inactividad)
- [ ] Implementar bloqueo por 3 intentos fallidos
- [ ] Crear sistema de recuperación de contraseña
- [ ] Testing de autenticación (cobertura > 70%)

**Entregables:**
- Autenticación completa y funcional
- Sesiones con timeout automático
- Sistema de bloqueo temporal

### Sprint 2: Administración de Usuarios y Roles (Semanas 3-4)

**Tareas Pendientes:**

- [ ] Crear CRUD completo de usuarios (RF3)
- [ ] Implementar gestión de roles (RF2)
- [ ] Crear componente de asignación de elementos del menú
- [ ] Implementar administración de catálogos dinámicos
- [ ] Crear pantalla de administración de Unidades Administrativas
- [ ] Testing de administración

**Componentes a Crear:**
- `modules/admin/users/UserManagement.tsx`
- `modules/admin/users/UserForm.tsx`
- `modules/admin/roles/RoleManagement.tsx`
- `modules/admin/roles/MenuAssignment.tsx`
- `modules/admin/catalogs/CatalogManager.tsx`

**Entregables:**
- Admin UA puede crear usuarios en su dirección
- Admin General puede asignar elementos del menú
- Catálogos dinámicos funcionales

### Sprint 3: Layout y Navegación (Semanas 5-6)

**Tareas Pendientes:**

- [ ] Mejorar MainLayout con menú dinámico basado en roles
- [ ] Implementar sistema de permisos en frontend
- [ ] Crear componentes UI base (Button, Input, Modal, Table)
- [ ] Implementar breadcrumbs de navegación
- [ ] Crear sistema de notificaciones en tiempo real
- [ ] Testing de componentes UI

**Componentes a Crear:**
- `shared/components/ui/Button/`
- `shared/components/ui/Input/`
- `shared/components/ui/Modal/`
- `shared/components/ui/Table/`
- `shared/hooks/usePermissions.ts`

**Entregables:**
- Navegación completa y funcional
- Componentes UI reutilizables
- Sistema de permisos implementado

---

## 📄 Fase 2: Documentos Entrantes (Sprints 4-6)

**Duración estimada:** 6 semanas
**Objetivo:** Sistema completo de gestión de documentos entrantes con OCR

### Sprint 4: Alta de Documentos (Sin OCR) (Semanas 7-8)

**Tareas:**

- [ ] Crear formulario de alta de documento
- [ ] Implementar upload de anexos a Supabase Storage
- [ ] Validar límite de 50 MB por archivo
- [ ] Guardar documentos en tbl_documento_entrante
- [ ] Implementar marca de seguimiento (RF9)

**Componentes a Crear:**
- `modules/documento-entrante/components/FormularioDocumento.tsx`
- `modules/documento-entrante/components/AnexosUploader.tsx`
- `modules/documento-entrante/hooks/useDocumentoEntrante.ts`

### Sprint 5: Integración OCR (Semanas 9-10) ⚠️ CRÍTICO

**Tareas:**

- [ ] Configurar Google Vision API
- [ ] Implementar Edge Function ocr-processor completa
- [ ] Crear extracción de asunto/remitente (RF6)
- [ ] Implementar clasificación de tipo de documento
- [ ] Crear sugerencia de prioridad con ML
- [ ] Implementar prellenado automático del formulario

**Componentes a Crear:**
- `modules/documento-entrante/components/AltaInteligente.tsx`
- `modules/documento-entrante/components/OCRProcessor.tsx`
- `modules/documento-entrante/hooks/useOCR.ts`

### Sprint 6: Búsqueda y Duplicados (Semanas 11-12)

**Tareas:**

- [ ] Implementar Full-Text Search con PostgreSQL
- [ ] Crear función search_documentos
- [ ] Implementar detector de duplicados (RF11)
- [ ] Crear pantalla de edición de documentos (RF8)
- [ ] Implementar función de Alcance

**Componentes a Crear:**
- `modules/consultas/components/BusquedaAvanzada.tsx`
- `modules/consultas/hooks/useBusqueda.ts`
- `modules/documento-entrante/components/DuplicateDetector.tsx`

---

## 🔄 Fase 3: Seguimiento y Turnado (Sprints 7-9)

**Duración estimada:** 6 semanas
**Objetivo:** Sistema completo de turnado con firma electrónica

### Sprint 7: Turnado Básico (Semanas 13-14)

**Tareas:**

- [ ] Crear formulario de turnado (RF13)
- [ ] Validar jerarquía (hasta Jefe de Departamento)
- [ ] Implementar cálculo de fecha de vencimiento
- [ ] Crear dashboard con indicadores (RF5)
- [ ] Implementar turnado predictivo con IA

### Sprint 8: Firma Electrónica de Recepción (Semanas 15-16) ⚠️ CRÍTICO

**Tareas:**

- [ ] Integrar con certificados C5
- [ ] Implementar Edge Function firma-electronica
- [ ] Crear generación de hash SHA-256
- [ ] Implementar almacenamiento en tbl_firmas
- [ ] Crear trigger de inmutabilidad
- [ ] Crear interfaz de firma en frontend

### Sprint 9: Avance, Rechazo y Conclusión (Semanas 17-18)

**Tareas:**

- [ ] Implementar control de avance con porcentaje (RF17)
- [ ] Crear trigger de inmutabilidad al 100%
- [ ] Implementar rechazo de documentos (RF15)
- [ ] Crear restricción de re-turnar al mismo destinatario
- [ ] Implementar conclusión de documentos (RF26)
- [ ] Crear sistema de notificaciones por correo (RF18)

---

## 📤 Fase 4: Documentos Salientes (Sprints 10-11)

**Duración estimada:** 4 semanas

### Tareas Principales:

- [ ] Generación automática de números de folio (RF19)
- [ ] Editor de documentos salientes (RF21)
- [ ] Relación con documento entrante (RF20)
- [ ] Firma electrónica de emisión (RF22)
- [ ] Gestión de acuses (RF24)

---

## 📊 Fase 5: Consultas y Reportes (Sprint 12)

**Duración estimada:** 2 semanas

### Tareas Principales:

- [ ] Búsqueda avanzada completa (RF7)
- [ ] Filtros múltiples
- [ ] Exportación a Excel
- [ ] Dashboard completo con gráficas
- [ ] Optimización de queries

---

## 🧪 Fase 6: Testing y Despliegue (Sprints 13-14)

**Duración estimada:** 4 semanas

### Sprint 13: Testing

- [ ] Tests unitarios (cobertura > 70%)
- [ ] Tests de integración
- [ ] Tests E2E con Playwright
- [ ] Testing de carga (< 1 min para 95% de transacciones)
- [ ] Corrección de bugs

### Sprint 14: Despliegue

- [ ] Despliegue a producción
- [ ] Migración de datos legados
- [ ] Manual de usuario
- [ ] Manual técnico
- [ ] Capacitación a usuarios

---

## 📈 Métricas de Progreso

### Completado: 10%

- ✅ Fase 0: 100%
- ⏳ Fase 1: 0%
- ⏳ Fase 2: 0%
- ⏳ Fase 3: 0%
- ⏳ Fase 4: 0%
- ⏳ Fase 5: 0%
- ⏳ Fase 6: 0%

### Hitos Críticos

| Hito | Fecha Objetivo | Estado |
|------|----------------|--------|
| H0: Infraestructura Base | ✅ 19/Nov/2025 | COMPLETADO |
| H1: Autenticación Funcional | 03/Dic/2025 | PENDIENTE |
| H2: CRUD de Usuarios | 17/Dic/2025 | PENDIENTE |
| H4: OCR Funcional | 14/Ene/2026 | PENDIENTE |
| H7: Firma Electrónica | 11/Feb/2026 | PENDIENTE |
| H10: Go-Live | 28/Abr/2026 | PENDIENTE |

---

## 🚀 Próximos Pasos Inmediatos

### Esta Semana (19-25 Nov 2025)

1. **Configurar Supabase en la nube**
   - Crear proyecto
   - Ejecutar migraciones
   - Configurar variables de entorno

2. **Crear datos de prueba**
   - Unidades Administrativas
   - Roles
   - Usuario administrador

3. **Probar autenticación**
   - Verificar login
   - Verificar RLS
   - Verificar timeout de sesión

### Siguiente Semana (26 Nov - 2 Dic 2025)

1. **Iniciar Sprint 1**
   - Completar autenticación
   - Implementar bloqueo por intentos fallidos
   - Testing de autenticación

---

**Última actualización:** 19 de Noviembre de 2025
**Responsable:** Equipo de Desarrollo SISGEDI 2.0
