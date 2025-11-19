# 🚀 GUÍA DE DEPLOYMENT EN VERCEL - SISGEDI 2.0

Esta guía te llevará paso a paso por el proceso de deployment de SISGEDI 2.0 en Vercel.

---

## 📋 PRERREQUISITOS

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta en [Vercel](https://vercel.com) (gratis)
- ✅ Proyecto SISGEDI 2.0 en GitHub
- ✅ Proyecto Supabase configurado
- ✅ Credenciales de Google Cloud Vision API
- ✅ Scripts SQL ejecutados en Supabase

---

## 🔧 PASO 1: PREPARAR SUPABASE

### 1.1 Ejecutar Scripts SQL

Entra a tu proyecto Supabase → **SQL Editor** y ejecuta en orden:

```sql
-- 1. Schema y catálogos base
Ejecutar: supabase_final.sql

-- 2. Documentos salientes
Ejecutar: supabase_documento_saliente.sql

-- 3. Row Level Security (RLS)
Ejecutar: supabase_rls_completo.sql
```

### 1.2 Crear Storage Buckets

Ve a **Storage** en Supabase y crea estos 5 buckets como **PÚBLICOS**:

| Bucket Name | Public | File Size Limit |
|-------------|--------|-----------------|
| `documentos` | ✅ Yes | 50 MB |
| `documentos-salientes` | ✅ Yes | 10 MB |
| `acuses` | ✅ Yes | 5 MB |
| `inventario` | ✅ Yes | 10 MB |
| `firmas` | ✅ Yes | 1 MB |

### 1.3 Activar Row Level Security

En **SQL Editor**, ejecuta:

```sql
-- Verificar que RLS está activado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'tbl_%';

-- Si alguna tabla tiene rowsecurity = false, activarlo:
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
```

### 1.4 Crear Usuario Administrador

Ve a **Authentication** → **Users** → **Add user**:

- Email: `admin@sisgedi.gob.mx` (o el que prefieras)
- Password: (crear una contraseña segura)
- Guardar el **User UID**

Luego, en **SQL Editor**:

```sql
-- Insertar el admin en la tabla usuarios
INSERT INTO tbl_usuarios (
    id_usuario,
    nombre,
    apellido_paterno,
    apellido_materno,
    email,
    id_rol,
    id_ua,
    activo
) VALUES (
    'UUID-DEL-USUARIO-CREADO',  -- Reemplazar con el UID de Authentication
    'Administrador',
    'Sistema',
    '',
    'admin@sisgedi.gob.mx',
    (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Administrador' LIMIT 1),
    (SELECT id_ua FROM cat_unidades_administrativas LIMIT 1),
    true
);
```

### 1.5 Obtener Credenciales de Supabase

Ve a **Settings** → **API**:

- Copia la **Project URL**: `https://xxxxx.supabase.co`
- Copia la **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Copia la **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **IMPORTANTE**: La `service_role` key es PRIVADA, nunca la expongas públicamente.

---

## 🔐 PASO 2: PREPARAR GOOGLE CLOUD VISION API

### 2.1 Obtener Credenciales JSON

Si aún no las tienes:

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto o crea uno nuevo
3. Habilita **Cloud Vision API**
4. Ve a **IAM & Admin** → **Service Accounts**
5. Crea una cuenta de servicio con rol **Cloud Vision API User**
6. Descarga el JSON de credenciales

### 2.2 Convertir JSON a formato de una línea

El JSON debe estar en **una sola línea** para usarlo en Vercel:

**Opción A - Manual:**
```bash
# En terminal, desde la carpeta donde está el JSON
cat google-credentials.json | jq -c '.'
```

**Opción B - Online:**
- Copia el contenido del JSON
- Ve a [jsonformatter.org](https://jsonformatter.org/json-minifier)
- Pega el JSON y haz clic en "Minify"
- Copia el resultado (todo en una línea)

Guarda este JSON minificado, lo usarás en Vercel.

---

## 🚀 PASO 3: DEPLOYMENT EN VERCEL

### 3.1 Conectar Repositorio

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Clic en **"Add New"** → **"Project"**
3. Importa tu repositorio de GitHub (`rrojaszarate-sys/SISGEDI`)
4. Selecciona la rama: `claude/generate-random-inventory-01DwBW6KUeECkNqSQbgVmAWw`

### 3.2 Configurar Variables de Entorno

En la sección **Environment Variables**, agrega las siguientes:

#### Variables CRÍTICAS (obligatorias):

```bash
# Supabase - URL y Keys
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Cloud Vision - Project ID
GOOGLE_CLOUD_PROJECT_ID=tu-proyecto-id

# Google Cloud Vision - Credenciales JSON (EN UNA SOLA LÍNEA)
GOOGLE_CLOUD_CREDENTIALS_JSON={"type":"service_account","project_id":"tu-proyecto",...}
```

#### Variables de Storage (obligatorias):

```bash
STORAGE_BUCKET_DOCUMENTOS=documentos
STORAGE_BUCKET_DOCUMENTOS_SALIENTES=documentos-salientes
STORAGE_BUCKET_ACUSES=acuses
STORAGE_BUCKET_INVENTARIO=inventario
STORAGE_BUCKET_FIRMAS=firmas
```

#### Variables de Configuración de App (obligatorias):

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=SISGEDI 2.0
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_LOCALE=es-MX
NEXT_PUBLIC_TIMEZONE=America/Mexico_City
```

#### Variables de Seguridad (obligatorias):

```bash
SESSION_TIMEOUT=3600
SESSION_REFRESH_THRESHOLD=300
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
```

#### Variables de Features (opcionales pero recomendadas):

```bash
FEATURE_OCR_ENABLED=true
FEATURE_DIGITAL_SIGNATURE=true
FEATURE_NOTIFICATIONS=false
FEATURE_ANALYTICS=false
FEATURE_EXPORT_EXCEL=true
FEATURE_EXPORT_PDF=true
```

#### Variables de Límites de Archivos (opcionales):

```bash
MAX_FILE_SIZE_DOCUMENTOS=52428800
MAX_FILE_SIZE_DOCUMENTOS_SALIENTES=10485760
MAX_FILE_SIZE_ACUSES=5242880
MAX_FILE_SIZE_INVENTARIO=10485760
MAX_FILE_SIZE_FIRMAS=1048576
```

#### Variables de OCR (opcionales):

```bash
OCR_LANGUAGE_HINTS=es,en
OCR_MIN_CONFIDENCE=0.7
OCR_ENABLE_TEXT_DETECTION=true
OCR_ENABLE_DOCUMENT_TEXT_DETECTION=true
```

### 3.3 Configurar Build Settings

Vercel debería detectar automáticamente Next.js, pero verifica:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x o superior

### 3.4 Iniciar Deployment

1. Haz clic en **"Deploy"**
2. Espera a que el build termine (3-5 minutos)
3. Si hay errores, revisa los logs

---

## ✅ PASO 4: VERIFICAR DEPLOYMENT

### 4.1 Verificar que la App Funciona

1. Una vez deployado, Vercel te dará una URL: `https://sisgedi-xxxxx.vercel.app`
2. Abre la URL en tu navegador
3. Deberías ver la página de login

### 4.2 Probar Login

1. Usa las credenciales del usuario admin que creaste:
   - Email: `admin@sisgedi.gob.mx`
   - Password: (la que configuraste)
2. Si el login funciona, ¡estás listo!

### 4.3 Verificar Módulos

Navega por los diferentes módulos para verificar:

- ✅ Dashboard carga correctamente
- ✅ Catálogos se pueden ver y editar
- ✅ Documentos entrantes funcionan
- ✅ Sistema de turnado funciona
- ✅ Inventario funciona
- ✅ Documentos salientes funcionan
- ✅ Búsqueda global funciona
- ✅ Reportes y gráficas cargan

### 4.4 Probar OCR (Opcional)

1. Ve a **Documentos Entrantes** → **Nuevo**
2. Sube un documento PDF con texto
3. Espera a que se procese
4. Verifica que el campo "Texto OCR" tenga contenido

---

## 🔧 PASO 5: CONFIGURACIÓN POST-DEPLOYMENT

### 5.1 Configurar Dominio Personalizado (Opcional)

En Vercel:

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones de Vercel

### 5.2 Configurar NEXT_PUBLIC_APP_URL

Si configuraste un dominio personalizado, actualiza la variable:

```bash
NEXT_PUBLIC_APP_URL=https://sisgedi.tu-dominio.gob.mx
```

### 5.3 Habilitar Protección de Password (Opcional)

En Vercel, puedes proteger el sitio con contraseña durante desarrollo:

1. Ve a **Settings** → **General**
2. Scroll a **Deployment Protection**
3. Habilita **Password Protection**

### 5.4 Configurar Notificaciones de Build

En **Settings** → **Git**:

- Habilita **Auto-deploy on push**
- Selecciona la rama principal
- Configura notificaciones por email o Slack

---

## 🐛 TROUBLESHOOTING

### Error: "Missing environment variable"

**Solución**: Verifica que todas las variables obligatorias estén configuradas en Vercel → Settings → Environment Variables.

### Error: "Invalid Google credentials"

**Solución**:
1. Verifica que `GOOGLE_CLOUD_CREDENTIALS_JSON` esté en una sola línea (sin saltos de línea)
2. Verifica que el JSON sea válido
3. Verifica que la Service Account tenga permisos de Cloud Vision API

### Error: "Supabase connection failed"

**Solución**:
1. Verifica que `NEXT_PUBLIC_SUPABASE_URL` sea correcta
2. Verifica que `NEXT_PUBLIC_SUPABASE_ANON_KEY` sea correcta
3. Verifica que el proyecto Supabase esté activo

### Error: "Failed to fetch storage"

**Solución**:
1. Verifica que los 5 buckets estén creados en Supabase Storage
2. Verifica que los buckets sean **públicos**
3. Verifica los nombres de los buckets en las variables de entorno

### Error: "RLS policy violation"

**Solución**:
1. Verifica que RLS esté activado correctamente
2. Ejecuta el script `supabase_rls_completo.sql` nuevamente
3. Verifica que exista el usuario admin en `tbl_usuarios`

### Build falla con "Type error"

**Solución**:
1. Verifica que todas las dependencias estén instaladas
2. Ejecuta `npm install` localmente para verificar
3. Verifica que no haya errores de TypeScript localmente

### OCR no funciona

**Solución**:
1. Verifica que `FEATURE_OCR_ENABLED=true`
2. Verifica las credenciales de Google Cloud
3. Verifica que Cloud Vision API esté habilitada en Google Cloud
4. Verifica que la Service Account tenga permisos correctos

---

## 📊 MONITOREO Y LOGS

### Ver Logs en Vercel

1. Ve a tu proyecto en Vercel
2. Clic en **"Deployments"**
3. Selecciona un deployment
4. Clic en **"Logs"** para ver logs de runtime
5. Clic en **"Build Logs"** para ver logs de build

### Logs de Runtime

Vercel te permite ver logs en tiempo real:

```bash
# Instalar Vercel CLI (opcional)
npm install -g vercel

# Ver logs en tiempo real
vercel logs [deployment-url] --follow
```

---

## 🔒 SEGURIDAD EN PRODUCCIÓN

### Checklist de Seguridad

- ✅ `SUPABASE_SERVICE_ROLE_KEY` está configurada como secreta
- ✅ `GOOGLE_CLOUD_CREDENTIALS_JSON` está configurada como secreta
- ✅ RLS está activado en todas las tablas
- ✅ Storage buckets tienen las políticas correctas
- ✅ Credenciales de Google Cloud tienen permisos mínimos necesarios
- ✅ `COOKIE_SECURE=true` en producción
- ✅ Headers de seguridad configurados en `vercel.json`

### Rotar Credenciales (Recomendado cada 90 días)

1. **Supabase**: Regenerar `service_role` key en Settings → API
2. **Google Cloud**: Crear nueva Service Account y eliminar la anterior
3. Actualizar variables en Vercel
4. Hacer un nuevo deployment

---

## 📚 RECURSOS ADICIONALES

- [Documentación de Vercel](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)

---

## 🎉 ¡LISTO!

Si seguiste todos los pasos, tu aplicación SISGEDI 2.0 debería estar funcionando en producción en Vercel.

**URL de tu aplicación**: https://sisgedi-xxxxx.vercel.app

---

## 📞 SOPORTE

Si encuentras problemas:

1. Revisa los logs en Vercel
2. Verifica las variables de entorno
3. Consulta la sección de Troubleshooting
4. Revisa el README_COMPLETO.md del proyecto

---

**Última actualización**: 2025-11-19
**Versión**: 2.0.0
**Autor**: SISGEDI Team
