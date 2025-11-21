# 🔧 CONFIGURACIÓN DE ENTORNO - SISGEDI 2.0

## ✅ Archivos Creados

### 1. `.env.example`
Plantilla completa con todas las variables de entorno necesarias:
- ✅ Configuración de Supabase (URL, keys, storage)
- ✅ Límites de archivos y MIME types
- ✅ Configuración de Google Cloud Vision API
- ✅ Seguridad y autenticación
- ✅ Feature flags
- ✅ Variables de desarrollo y testing

### 2. `google-credentials.json` (LOCAL - NO EN GIT)
Archivo de credenciales de Google Cloud Vision API para OCR:
- ✅ Creado localmente en tu máquina
- ✅ Protegido por `.gitignore`
- ✅ **NUNCA se sube a Git** por seguridad
- ✅ Listo para usar con la variable `GOOGLE_APPLICATION_CREDENTIALS`

### 3. `.gitignore` (ACTUALIZADO)
Reglas de seguridad añadidas para proteger credenciales:
- ✅ `google-credentials.json` excluido del repositorio
- ✅ Todos los archivos `.env*` protegidos

---

## 🚀 PASO A PASO PARA CONFIGURAR TU ENTORNO

### **PASO 1: Crear tu archivo .env local**

```bash
# Copiar la plantilla
cp .env.example .env.local
```

### **PASO 2: Obtener credenciales de Supabase**

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Click en **Settings** > **API**
3. Copia los siguientes valores:

```bash
# Project URL (ejemplo)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co

# Anon/Public Key (ejemplo)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (PRIVADA - solo para backend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Pega estos valores en tu `.env.local`

### **PASO 3: Verificar credenciales de Google Cloud**

El archivo `google-credentials.json` ya está creado localmente con tus credenciales:

```json
{
  "type": "service_account",
  "project_id": "gen-lang-client-0562056452",
  "client_email": "ocr-service-account@gen-lang-client-0562056452.iam.gserviceaccount.com",
  ...
}
```

✅ **NO necesitas hacer nada más** - el archivo ya está listo.

### **PASO 4: Ejecutar el script de Supabase**

Antes de usar la aplicación, necesitas crear la base de datos:

1. Abre Supabase Dashboard > **SQL Editor**
2. Copia el contenido de `supabase_final.sql`
3. O usa el enlace directo de GitHub:

```
https://raw.githubusercontent.com/rrojaszarate-sys/SISGEDI/claude/generate-random-inventory-01DwBW6KUeECkNqSQbgVmAWw/supabase_final.sql
```

4. Pega y ejecuta el script completo
5. Verás mensajes de confirmación:

```
✓ 11 tablas creadas
✓ 7 roles configurados
✓ 11 Unidades Administrativas
✓ ~55 items de inventario
✓ Políticas RLS activas
✓ Full-Text Search configurado
```

### **PASO 5: Crear Storage Buckets**

En Supabase Dashboard > **Storage**, crea estos 5 buckets:

| Bucket | Público | MIME Types | Tamaño Max |
|--------|---------|------------|------------|
| `documentos` | NO | PDF, Word, Imágenes | 50 MB |
| `documentos-salientes` | NO | PDF | 10 MB |
| `acuses` | NO | PDF, Imágenes | 5 MB |
| `inventario` | NO | Imágenes | 10 MB |
| `firmas` | NO | PKCS12, X509 | 1 MB |

Las políticas de acceso ya se crearon automáticamente con el script SQL.

### **PASO 6: Crear primer usuario administrador**

1. En Supabase Dashboard > **Authentication** > **Users**
2. Click en **Add user** > **Create new user**
3. Usa estos datos:

```
Email: admin@sisgedi.gob.mx
Password: [tu password seguro]
Confirm email: Yes
```

4. Copia el **User UID** que se genera
5. Ve a **SQL Editor** y ejecuta:

```sql
-- Reemplaza 'USER_UID_AQUI' con el UID que copiaste
INSERT INTO tbl_usuarios (
    id_usuario,
    clave_servidor_publico,
    id_ua,
    id_rol,
    nombre_completo,
    correo_institucional,
    estatus
) VALUES (
    'USER_UID_AQUI'::uuid,
    'ADMIN001',
    (SELECT id_ua FROM cat_unidad_administrativa WHERE codigo_ua = 'SS-001'),
    (SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Administrador General'),
    'Administrador General del Sistema',
    'admin@sisgedi.gob.mx',
    'Activo'
);
```

### **PASO 7: Verificar que todo funciona**

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Ejecutar las pruebas
npm test

# Iniciar en desarrollo
npm run dev
```

---

## 📋 CHECKLIST DE CONFIGURACIÓN

- [ ] ✅ Archivo `.env.local` creado desde `.env.example`
- [ ] ✅ Variables de Supabase configuradas (URL, ANON_KEY, SERVICE_KEY)
- [ ] ✅ Archivo `google-credentials.json` existe localmente
- [ ] ✅ Script `supabase_final.sql` ejecutado en Supabase
- [ ] ✅ 5 Storage Buckets creados manualmente
- [ ] ✅ Primer usuario administrador creado
- [ ] ✅ Dependencias instaladas (`npm install`)
- [ ] ✅ Pruebas ejecutadas correctamente (`npm test`)

---

## 🔒 SEGURIDAD

### ⚠️ NUNCA subas a Git:
- ❌ `.env.local`
- ❌ `google-credentials.json`
- ❌ Cualquier archivo con credenciales reales

### ✅ SIEMPRE protegido:
- ✅ `.gitignore` configurado correctamente
- ✅ GitHub Push Protection activo
- ✅ Credenciales solo en variables de entorno

### 🔐 En Producción:
- Usa **secrets** de tu plataforma de deployment (Vercel, Railway, etc.)
- Rota las credenciales periódicamente
- Usa diferentes proyectos de Supabase para dev/staging/production

---

## 📖 VARIABLES DE ENTORNO IMPORTANTES

### Supabase (Requeridas)
```bash
NEXT_PUBLIC_SUPABASE_URL=          # URL de tu proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Clave pública
SUPABASE_SERVICE_ROLE_KEY=         # Clave privada (solo backend)
```

### Google Cloud Vision (Requeridas para OCR)
```bash
GOOGLE_CLOUD_PROJECT_ID=gen-lang-client-0562056452
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

### Storage Buckets (Configuradas por defecto)
```bash
STORAGE_BUCKET_DOCUMENTOS=documentos
STORAGE_BUCKET_DOCUMENTOS_SALIENTES=documentos-salientes
STORAGE_BUCKET_ACUSES=acuses
STORAGE_BUCKET_INVENTARIO=inventario
STORAGE_BUCKET_FIRMAS=firmas
```

### Features (Opcionales)
```bash
FEATURE_OCR_ENABLED=true           # Habilitar OCR
FEATURE_DIGITAL_SIGNATURE=true     # Firma digital
FEATURE_NOTIFICATIONS=true         # Notificaciones
FEATURE_EXPORT_EXCEL=true          # Exportar a Excel
FEATURE_EXPORT_PDF=true            # Exportar a PDF
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot find google-credentials.json"
```bash
# Verifica que el archivo existe
ls -la google-credentials.json

# Debe estar en la raíz del proyecto
pwd  # Debes estar en /home/user/SISGEDI
```

### Error: "Invalid Supabase credentials"
```bash
# Verifica que copiaste bien las credenciales
cat .env.local | grep SUPABASE

# Asegúrate de no tener espacios extra
# ✅ CORRECTO: NEXT_PUBLIC_SUPABASE_URL=https://...
# ❌ INCORRECTO: NEXT_PUBLIC_SUPABASE_URL = https://...
```

### Error: "Storage bucket not found"
- Ve a Supabase Dashboard > Storage
- Verifica que los 5 buckets existen
- Los nombres deben ser exactamente: `documentos`, `documentos-salientes`, `acuses`, `inventario`, `firmas`

### Error: "OCR API authentication failed"
```bash
# Verifica que el proyecto tiene habilitado Cloud Vision API
# En Google Cloud Console:
# 1. Ve a APIs & Services > Library
# 2. Busca "Cloud Vision API"
# 3. Click "Enable" si no está habilitado
```

---

## 📚 RECURSOS ADICIONALES

- **Guía de Supabase**: Ver `GUIA_SUPABASE.md`
- **Plan de Validación QA**: Ver `docs/PLAN_VALIDACION_EXTERNA_QA.md`
- **Instrucciones de Seed**: Ver `docs/INSTRUCCIONES_SEED_Y_TESTING.md`
- **Script SQL Final**: `supabase_final.sql`

---

## ✅ LISTO PARA COMENZAR

Una vez completados todos los pasos del checklist, tu entorno está listo para:

1. ✅ Desarrollo local
2. ✅ Pruebas automatizadas
3. ✅ Generación de datos de prueba
4. ✅ OCR de documentos
5. ✅ Gestión de Storage
6. ✅ Autenticación completa

**¡Tu sistema SISGEDI 2.0 está configurado correctamente!** 🎉

---

_Última actualización: 2025-11-19_
