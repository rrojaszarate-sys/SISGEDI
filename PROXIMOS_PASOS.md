# PRÓXIMOS PASOS - SISGEDI 2.0

## 🎯 DECISIÓN CRÍTICA QUE DEBES TOMAR AHORA

Tienes **3 opciones**. Lee cada una y decide cuál se ajusta a tu situación:

---

## OPCIÓN 1: MVP FUNCIONAL EN 6-8 SEMANAS ⭐ RECOMENDADO

### ¿Para quién?
- Necesitas algo funcionando pronto
- Tienes presupuesto de $15k - $25k USD
- Puedes esperar 2 meses
- Quieres validar con usuarios reales antes de invertir más

### ¿Qué obtienes?
✅ Sistema web funcional con:
- Login de usuarios
- Alta de documentos entrantes (formulario manual)
- Turnado entre unidades administrativas
- Consulta y búsqueda básica
- Exportación a Excel
- Base de datos lista (PostgreSQL)

❌ NO incluye (se agrega después):
- OCR automático
- Firma electrónica
- IA/Turnado predictivo
- App móvil

### Tareas inmediatas:

#### Semana 1: Setup del proyecto
```bash
# 1. Crear cuenta Supabase
https://supabase.com/dashboard

# 2. Crear nuevo proyecto
Nombre: SISGEDI-2.0
Región: South America (São Paulo)
Plan: Pro ($25/mes)

# 3. Ejecutar script de base de datos
# Ve al SQL Editor en Supabase y ejecuta:
```
- Archivo: `/home/user/SISGEDI/database_schema.sql`
- Copiar contenido completo
- Pegar en SQL Editor
- Click en "Run"

```bash
# 4. Configurar proyecto frontend
mkdir frontend
cd frontend
npm create vite@latest . -- --template react-ts
npm install

# 5. Instalar dependencias necesarias
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install react-router-dom
npm install @nextui-org/react
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### Semana 2-3: Desarrollo core
1. **Autenticación** (3 días)
   - Pantalla de login
   - Integración con Supabase Auth
   - Protección de rutas

2. **Layout y navegación** (2 días)
   - Sidebar con menú
   - Header con usuario logueado
   - Rutas principales

3. **Módulo de documentos entrantes** (5 días)
   - Formulario de alta
   - Lista de documentos
   - Detalle de documento
   - Upload de archivos

4. **Módulo de turnado** (4 días)
   - Formulario de turnado
   - Selección de UA destino
   - Historial de turnados

#### Semana 4-5: Features adicionales
1. **Consultas y búsquedas** (3 días)
2. **Dashboard básico** (3 días)
3. **Exportación a Excel** (2 días)
4. **Gestión de usuarios** (Admin) (3 días)

#### Semana 6-8: Testing y deploy
1. **Testing manual** (1 semana)
2. **Correcciones de bugs** (1 semana)
3. **Deploy a producción** (3 días)
4. **Capacitación** (2 días)

### Presupuesto estimado:
| Item | Costo |
|------|-------|
| Desarrollador Full-Stack (2 meses) | $12,000 - $20,000 |
| Supabase Pro (2 meses) | $50 |
| Dominio + SSL | $20 |
| **TOTAL** | **$12,070 - $20,070** |

---

## OPCIÓN 2: SISTEMA COMPLETO EN 7 MESES

### ¿Para quién?
- Necesitas TODAS las funcionalidades avanzadas
- Tienes presupuesto de $100k - $200k USD
- Puedes esperar 7 meses
- Es un proyecto crítico de largo plazo

### ¿Qué obtienes?
✅ Sistema completo con TODO lo descrito en los documentos:
- Todo lo del MVP
- OCR automático con Google Vision API
- Firma electrónica avanzada
- Turnado predictivo con IA
- Dashboard avanzado con gráficas
- App móvil (iOS + Android)
- Búsqueda semántica con Full-Text Search
- Sistema de notificaciones en tiempo real

### Equipo necesario:
- 1 Tech Lead
- 2 Frontend Developers (React)
- 1 Backend Developer (Node.js/Supabase)
- 1 Mobile Developer (React Native)
- 1 DevOps Engineer
- 1 QA Engineer
- 1 UX/UI Designer

### Cronograma detallado:
Ver sección "Roadmap de Desarrollo" en `README.md`

---

## OPCIÓN 3: ARRANQUE ULTRA-RÁPIDO EN 2 SEMANAS ⚡

### ¿Para quién?
- Necesitas algo AHORA
- Presupuesto muy limitado ($2k - $5k)
- Solo necesitas funcionalidad básica
- Dispuesto a usar herramientas low-code

### ¿Qué obtienes?
✅ Panel de administración básico con:
- Base de datos funcionando
- Interfaz web generada automáticamente
- CRUD de documentos
- Consultas SQL directas
- Reportes básicos

### Stack simplificado:
```
PostgreSQL (Base de datos) ✅ Ya tienes el script
      +
Retool / Appsmith / Budibase (Low-code frontend)
      +
Metabase (Reportes y dashboards)
```

### Pasos para implementar:

#### Día 1-2: Base de datos
1. Contratar PostgreSQL en algún proveedor:
   - **Supabase** (más fácil): https://supabase.com
   - **Railway**: https://railway.app
   - **Render**: https://render.com

2. Ejecutar `database_schema.sql`

#### Día 3-7: Interfaz con Retool
1. Crear cuenta en Retool: https://retool.com
2. Conectar a tu base de datos PostgreSQL
3. Crear aplicaciones:
   - **App 1:** Alta de documentos entrantes
   - **App 2:** Turnado de documentos
   - **App 3:** Consulta de documentos
   - **App 4:** Administración de usuarios

#### Día 8-10: Reportes con Metabase
1. Instalar Metabase: https://www.metabase.com
2. Conectar a PostgreSQL
3. Crear dashboards:
   - Documentos por UA
   - Documentos por estatus
   - Vencimientos (Verde/Amarillo/Rojo)

#### Día 11-14: Testing y ajustes
1. Probar flujos completos
2. Ajustar formularios
3. Configurar permisos

### Presupuesto:
| Item | Costo/mes |
|------|-----------|
| Supabase Starter | $25 |
| Retool Team | $100 |
| Metabase Cloud (opcional) | $85 |
| **TOTAL mensual** | **$210/mes** |

**Costo de setup inicial:** ~$2,000 (configuración + 1 desarrollador por 2 semanas)

---

## 🚦 ¿CUÁL ELEGIR?

### Elige OPCIÓN 1 (MVP 6-8 semanas) si:
- ✅ Necesitas balance entre tiempo y funcionalidad
- ✅ Tienes $15k - $25k disponibles
- ✅ Quieres código personalizado
- ✅ Planeas crecer el sistema después

### Elige OPCIÓN 2 (Sistema completo 7 meses) si:
- ✅ Necesitas TODAS las funcionalidades avanzadas
- ✅ Tienes $100k+ de presupuesto
- ✅ Es un proyecto estratégico de largo plazo
- ✅ Tienes tiempo para esperar

### Elige OPCIÓN 3 (Ultra-rápido 2 semanas) si:
- ✅ Necesitas algo funcionando YA
- ✅ Presupuesto muy limitado
- ✅ Solo necesitas CRUD básico
- ✅ Estás OK con herramientas low-code

---

## 📋 CHECKLIST INDEPENDIENTE DE LA OPCIÓN

Estos pasos aplican para CUALQUIER opción que elijas:

### ✅ Paso 1: Configurar base de datos (URGENTE)

```bash
# 1. Crear cuenta en Supabase (gratis para empezar)
https://supabase.com/dashboard/sign-up

# 2. Crear proyecto nuevo
Nombre: SISGEDI
Contraseña de DB: [TU_CONTRASEÑA_SEGURA]
Región: South America

# 3. Ir a SQL Editor

# 4. Copiar COMPLETO el archivo database_schema.sql

# 5. Pegar en el editor

# 6. Click en "RUN"

# 7. Verificar que se crearon las tablas:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

# Deberías ver:
# - cat_roles
# - cat_unidad_administrativa
# - cat_valores_catalogo
# - tbl_anexos
# - tbl_avance
# - tbl_documento_entrante
# - tbl_documento_saliente
# - tbl_firmas
# - tbl_log_auditoria
# - tbl_notificaciones
# - tbl_relacion_respuesta
# - tbl_sesiones
# - tbl_turnado
# - tbl_usuarios
```

### ✅ Paso 2: Verificar datos iniciales

```sql
-- Verificar que se crearon los roles
SELECT * FROM cat_roles;
-- Debes ver 7 roles: Administrador General, Administrador UA, Recepción, Nivel 1, 2, 3, Visor

-- Verificar catálogos
SELECT * FROM cat_valores_catalogo;
-- Debes ver prioridades y tipos de documento
```

### ✅ Paso 3: Crear primer usuario administrador

```sql
-- IMPORTANTE: Cambia estos valores
INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico)
VALUES ('Dirección General', 'DG001', 1)
RETURNING id_ua;

-- Copia el id_ua que te devolvió (ejemplo: 'a1b2c3d4-e5f6-7890-1234-567890abcdef')
-- Copia el id_rol de Administrador General
SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Administrador General';

-- Ahora crea el usuario (CAMBIA LOS VALORES)
INSERT INTO tbl_usuarios (
    clave_servidor_publico,
    id_ua,
    id_rol,
    nombre_completo,
    correo_institucional,
    password_hash
) VALUES (
    'ADMIN001',  -- TU CLAVE
    'PEGAR_ID_UA_AQUI',  -- Del paso anterior
    'PEGAR_ID_ROL_AQUI',  -- Del paso anterior
    'Administrador Principal',  -- TU NOMBRE
    'admin@tuinstitucion.gob.mx',  -- TU EMAIL
    crypt('TuContraseñaSegura123!', gen_salt('bf'))  -- TU CONTRASEÑA
);
```

### ✅ Paso 4: Aplicar mejoras recomendadas (OPCIONAL pero importante)

```bash
# Si elegiste Opción 1 o 2, aplica las mejoras del archivo:
# MEJORAS_RECOMENDADAS.md

# Prioridad ALTA (hacer antes de producción):
1. Validaciones adicionales (sección 1)
2. Índices compuestos (sección 2)
3. Soft delete (sección Quick Wins #2)
4. Contador de folios mejorado (sección Quick Wins #1)

# Prioridad MEDIA (hacer en las primeras semanas):
5. Rate limiting
6. Función de búsqueda mejorada
7. Dashboard de indicadores
8. Notificaciones automáticas

# Prioridad BAJA (nice to have):
9. Métricas del sistema
10. Plantillas de documentos
11. Sugerencias de turnado
```

---

## 🆘 SI TIENES PROBLEMAS

### Error: "extension uuid-ossp does not exist"
```sql
-- Ejecuta esto primero:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "function auth.uid() does not exist"
```sql
-- Las políticas RLS requieren Supabase Auth
-- Si usas PostgreSQL standalone, comenta las líneas que usan auth.uid()
-- O reemplaza con:
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
    SELECT current_setting('request.jwt.claim.sub', true)::uuid;
$$ LANGUAGE sql STABLE;
```

### Error: "permission denied to create extension"
```sql
-- Necesitas permisos de superusuario
-- En Supabase esto ya está habilitado
-- En otros proveedores, contacta soporte
```

### La búsqueda FTS no funciona con acentos
```sql
-- Verifica que existe la configuración:
SELECT cfgname FROM pg_ts_config WHERE cfgname = 'spanish_unaccent';

-- Si no existe, ejecuta de nuevo la sección de configuración del schema
```

---

## 📞 SIGUIENTE ACCIÓN REQUERIDA

**NECESITO QUE ME DIGAS:**

1. **¿Cuál opción eliges?** (1, 2 o 3)

2. **¿Ya tienes cuenta de Supabase?** (Sí/No)

3. **¿Ya ejecutaste el script database_schema.sql?** (Sí/No)
   - Si la respuesta es NO, hazlo AHORA antes de continuar

4. **¿Qué problemas específicos has tenido al intentar ejecutarlo?**

5. **¿Cuál es tu presupuesto disponible?**

6. **¿Cuál es tu deadline?** (¿Para cuándo necesitas que esté funcionando?)

7. **¿Tienes equipo de desarrollo o necesitas contratar?**

---

## 🎯 RECOMENDACIÓN PERSONAL (siendo 100% honesto)

Si fuera mi proyecto, elegiría **OPCIÓN 1 (MVP en 6-8 semanas)** porque:

1. ✅ Da resultados tangibles rápido (2 meses)
2. ✅ Costo razonable ($15k - $25k)
3. ✅ Permite validar con usuarios reales
4. ✅ Base sólida para crecer después
5. ✅ Evita sobre-ingeniería prematura

Luego, basado en feedback real:
- Si funciona bien → Agregar OCR, firma electrónica, etc.
- Si no se usa → Evitaste gastar $100k+ en algo innecesario

**El sistema perfecto que nadie usa es peor que el sistema simple que todos usan.**

---

## 📂 ARCHIVOS DE REFERENCIA

En este repositorio ahora tienes:

1. **README.md** - Descripción general del proyecto
2. **database_schema.sql** - Script SQL completo ✅
3. **ANALISIS_PROFUNDO_SISGEDI.md** - Análisis detallado
4. **FUNCIONALIDADES_VANGUARDIA_2025.md** - Funcionalidades avanzadas
5. **MEJORAS_RECOMENDADAS.md** - Mejoras técnicas (NUEVO) ✅
6. **PROXIMOS_PASOS.md** - Este archivo (NUEVO) ✅

---

**¿Listo para avanzar? Dime qué opción eliges y continuamos.**
