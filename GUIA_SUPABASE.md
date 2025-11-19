# 🚀 GUÍA COMPLETA DE CONFIGURACIÓN SUPABASE - SISGEDI 2.0

Esta guía te llevará paso a paso para configurar SISGEDI 2.0 en Supabase.

---

## 📋 TABLA DE CONTENIDOS

1. [Requisitos Previos](#requisitos-previos)
2. [Crear Proyecto en Supabase](#crear-proyecto-en-supabase)
3. [Configurar Base de Datos](#configurar-base-de-datos)
4. [Configurar Storage Buckets](#configurar-storage-buckets)
5. [Configurar Autenticación](#configurar-autenticación)
6. [Verificar Instalación](#verificar-instalación)
7. [Conectar con Frontend](#conectar-con-frontend)

---

## 1. REQUISITOS PREVIOS

- ✅ Cuenta de Supabase (gratuita en [supabase.com](https://supabase.com))
- ✅ Los scripts SQL proporcionados:
  - `supabase_schema_complete.sql`
  - `supabase_storage_setup.sql`

---

## 2. CREAR PROYECTO EN SUPABASE

### Paso 1: Crear Nuevo Proyecto

1. Ir a https://supabase.com/dashboard
2. Click en **"New project"**
3. Configurar:
   ```
   Name: SISGEDI-2.0
   Database Password: [Generar contraseña fuerte]
   Region: South America (São Paulo) - sa-east-1
   Pricing Plan: Free (o Pro si se requiere)
   ```
4. Click en **"Create new project"**
5. **Esperar 2-3 minutos** mientras se aprovisiona

---

## 3. CONFIGURAR BASE DE DATOS

### Paso 1: Ejecutar Script de Esquema

1. En el Dashboard de Supabase, ir a **SQL Editor** (icono de base de datos en el menú izquierdo)
2. Click en **"New query"**
3. Copiar TODO el contenido de `supabase_schema_complete.sql`
4. Pegar en el editor
5. Click en **"Run"** (o presionar Ctrl+Enter)
6. Esperar 30-60 segundos
7. Verificar que aparezca el mensaje: **"Success. No rows returned"**

**Resultado esperado:**
```
✓ 15 tablas creadas
✓ 7 roles insertados
✓ Catálogos base insertados
✓ Funciones creadas
✓ Triggers configurados
✓ RLS habilitado
```

### Paso 2: Verificar Tablas Creadas

1. Ir a **Table Editor** en el menú izquierdo
2. Deberías ver todas estas tablas:

```
📁 Tablas Principales:
   ├── cat_unidad_administrativa
   ├── cat_roles
   ├── cat_valores_catalogo
   ├── tbl_usuarios
   ├── tbl_documento_entrante
   ├── tbl_anexos
   ├── tbl_turnado
   ├── tbl_avance
   ├── tbl_documento_saliente
   ├── tbl_relacion_respuesta
   ├── tbl_firmas
   ├── tbl_log_auditoria
   ├── tbl_notificaciones
   └── tbl_inventario
```

### Paso 3: Verificar Roles y Catálogos

En **SQL Editor**, ejecutar:

```sql
-- Ver roles creados
SELECT nombre_rol, descripcion FROM cat_roles ORDER BY nombre_rol;

-- Ver catálogos
SELECT tipo_catalogo, COUNT(*) as cantidad
FROM cat_valores_catalogo
GROUP BY tipo_catalogo;
```

**Resultado esperado:**
- 7 roles (Administrador General, Admin UA, Recepción, Nivel 1, 2, 3, Visor)
- Catálogos: Prioridad, Tipo_Documento, Area_Remitente

---

## 4. CONFIGURAR STORAGE BUCKETS

### Paso 1: Crear Buckets

1. Ir a **Storage** en el menú izquierdo
2. Click en **"Create a new bucket"**
3. Crear los siguientes buckets **UNO POR UNO**:

#### Bucket 1: documentos
```
Name: documentos
Public bucket: ❌ NO (dejar desmarcado)
File size limit: 52428800 (50 MB)
Allowed MIME types: application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.*
```

#### Bucket 2: documentos-salientes
```
Name: documentos-salientes
Public bucket: ❌ NO
File size limit: 10485760 (10 MB)
Allowed MIME types: application/pdf
```

#### Bucket 3: acuses
```
Name: acuses
Public bucket: ❌ NO
File size limit: 5242880 (5 MB)
Allowed MIME types: application/pdf,image/*
```

#### Bucket 4: inventario
```
Name: inventario
Public bucket: ❌ NO
File size limit: 10485760 (10 MB)
Allowed MIME types: image/*
```

#### Bucket 5: firmas
```
Name: firmas
Public bucket: ❌ NO
File size limit: 1048576 (1 MB)
Allowed MIME types: application/x-pkcs12,application/x-x509-ca-cert
```

### Paso 2: Configurar Políticas de Storage

1. Volver a **SQL Editor**
2. Crear nueva query
3. Copiar TODO el contenido de `supabase_storage_setup.sql`
4. Pegar y ejecutar (**Run**)
5. Verificar mensaje de éxito

### Paso 3: Verificar Políticas

1. Ir a **Storage** > Click en cualquier bucket (ej: "documentos")
2. Click en **"Policies"**
3. Deberías ver las políticas creadas:
   - ✓ Usuarios pueden subir documentos de su UA
   - ✓ Usuarios pueden ver documentos de su UA
   - ✓ Usuarios pueden actualizar documentos de su UA
   - ✓ Usuarios pueden eliminar documentos de su UA

---

## 5. CONFIGURAR AUTENTICACIÓN

### Paso 1: Configurar Proveedores

1. Ir a **Authentication** > **Providers**
2. Habilitar:
   - ✅ **Email** (dejar por defecto)
   - ✅ **Email confirmations** (opcional, para producción)

### Paso 2: Configurar Email Templates

1. Ir a **Authentication** > **Email Templates**
2. Personalizar plantillas (opcional):
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### Paso 3: Crear Usuario de Prueba (Administrador)

**Opción A: Desde Dashboard**

1. Ir a **Authentication** > **Users**
2. Click en **"Add user"**
3. Crear usuario administrador:
   ```
   Email: admin@sisgedi.gob.mx
   Password: [Contraseña segura]
   Auto Confirm User: ✅ Sí
   ```
4. Click en **"Create user"**
5. Copiar el **User UID** que aparece

**Opción B: Desde SQL Editor**

```sql
-- Nota: Esto solo funciona si desactivas email confirmation
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@sisgedi.gob.mx',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);
```

### Paso 4: Vincular Usuario con Datos de SISGEDI

1. Obtener el **User UID** del paso anterior
2. Ejecutar en SQL Editor:

```sql
-- Primero, crear una Unidad Administrativa de prueba
INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico, direccion, telefono)
VALUES (
    'Dirección General de Sistemas',
    'DGS-001',
    2,
    'Av. Insurgentes Sur 1234, CDMX',
    '55-1234-5678'
)
RETURNING id_ua;

-- Copiar el id_ua retornado y usarlo abajo

-- Obtener ID del rol de Administrador General
SELECT id_rol FROM cat_roles WHERE nombre_rol = 'Administrador General';

-- Insertar en tbl_usuarios (reemplazar los UUIDs con los valores reales)
INSERT INTO tbl_usuarios (
    id_usuario,
    clave_servidor_publico,
    id_ua,
    id_rol,
    nombre_completo,
    correo_institucional,
    estatus
) VALUES (
    '[PEGAR USER UID AQUÍ]'::uuid,
    'ADMIN001',
    '[PEGAR ID_UA AQUÍ]'::uuid,
    '[PEGAR ID_ROL AQUÍ]'::uuid,
    'Administrador General del Sistema',
    'admin@sisgedi.gob.mx',
    'Activo'
);
```

---

## 6. VERIFICAR INSTALACIÓN

### Checklist de Verificación

Ejecutar cada query en **SQL Editor**:

#### 1. Verificar Tablas
```sql
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'tbl_%' OR tablename LIKE 'cat_%'
ORDER BY tablename;
```
**Esperado:** 15 tablas

#### 2. Verificar Roles
```sql
SELECT COUNT(*) as total_roles FROM cat_roles;
```
**Esperado:** 7

#### 3. Verificar Catálogos
```sql
SELECT COUNT(*) as total_catalogos FROM cat_valores_catalogo;
```
**Esperado:** ≥ 10

#### 4. Verificar Funciones
```sql
SELECT proname as nombre_funcion
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('search_documentos', 'generar_folio_interno', 'get_current_user_id');
```
**Esperado:** 3+ funciones

#### 5. Verificar RLS Activo
```sql
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = TRUE;
```
**Esperado:** Todas las tablas con RLS = TRUE

#### 6. Verificar Storage Buckets
```sql
SELECT name, public FROM storage.buckets ORDER BY name;
```
**Esperado:** 5 buckets (todos con public = FALSE)

---

## 7. CONECTAR CON FRONTEND

### Paso 1: Obtener Credenciales

1. Ir a **Settings** > **API**
2. Copiar:
   ```
   Project URL: https://[tu-proyecto].supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (¡SECRETO!)
   ```

### Paso 2: Configurar Variables de Entorno

Crear archivo `.env.local` en tu proyecto frontend:

```env
# Supabase
VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opcional para desarrollo
VITE_SUPABASE_SERVICE_ROLE_KEY=[solo para desarrollo local]
```

### Paso 3: Instalar Cliente de Supabase

```bash
npm install @supabase/supabase-js
```

### Paso 4: Inicializar Cliente

Crear `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos generados automáticamente (opcional)
export type Database = {
  public: {
    Tables: {
      tbl_usuarios: {
        Row: {
          id_usuario: string;
          clave_servidor_publico: string;
          nombre_completo: string;
          // ... más campos
        };
        Insert: {
          // ...
        };
        Update: {
          // ...
        };
      };
      // ... más tablas
    };
  };
};
```

### Paso 5: Ejemplo de Uso - Login

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@sisgedi.gob.mx',
  password: 'tu-password'
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('Usuario:', data.user);
}
```

### Paso 6: Ejemplo de Uso - Consultar Documentos

```typescript
// Obtener documentos entrantes
const { data: documentos, error } = await supabase
  .from('tbl_documento_entrante')
  .select(`
    *,
    cat_unidad_administrativa!id_ua_registro (nombre_ua, codigo_ua),
    tbl_usuarios!id_usuario_registro (nombre_completo)
  `)
  .order('fecha_registro', { ascending: false })
  .limit(50);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Documentos:', documentos);
}
```

### Paso 7: Ejemplo de Uso - Subir Archivo a Storage

```typescript
// Subir documento a Storage
const file = event.target.files[0];
const filePath = `DGS-001/2025/01/${crypto.randomUUID()}/${file.name}`;

const { data, error } = await supabase.storage
  .from('documentos')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

if (error) {
  console.error('Error:', error);
} else {
  console.log('Archivo subido:', data.path);

  // Obtener URL pública (si el bucket es público)
  const { data: { publicUrl } } = supabase.storage
    .from('documentos')
    .getPublicUrl(filePath);

  console.log('URL:', publicUrl);
}
```

---

## 8. POBLAR CON DATOS DE PRUEBA (OPCIONAL)

Si quieres datos de prueba para desarrollo, puedes usar el generador:

### Opción A: Usar Scripts TypeScript (Recomendado)

```bash
# Instalar dependencias
npm install

# Configurar .env
SUPABASE_URL=https://[tu-proyecto].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[tu-service-key]

# Generar datos
npm run seed:supabase
```

### Opción B: Insertar Manualmente via SQL

Ver el archivo `supabase_test_data.sql` (crear UAs, usuarios, documentos, etc.)

---

## 9. TROUBLESHOOTING

### Error: "relation does not exist"

**Solución:**
```sql
-- Verificar que las tablas existen
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Error: "new row violates row-level security policy"

**Solución:**
```sql
-- Verificar que el usuario está en tbl_usuarios
SELECT * FROM tbl_usuarios WHERE id_usuario = auth.uid();

-- Si no existe, insertarlo
```

### Error: "bucket not found"

**Solución:**
1. Ir a Storage en Dashboard
2. Verificar que todos los buckets existan
3. Verificar que los nombres sean exactos (minúsculas, sin espacios)

### Error al subir archivo: "new row violates policy"

**Solución:**
1. Verificar que el usuario tenga UA asignada
2. Verificar que el path del archivo comience con el código de su UA
3. Revisar las políticas del bucket

### No puedo hacer login

**Solución:**
1. Verificar que el usuario existe en `auth.users`
2. Verificar que esté confirmado (`email_confirmed_at` no sea NULL)
3. Verificar credenciales correctas
4. Revisar logs en Authentication > Logs

---

## 10. RECURSOS ADICIONALES

### Documentación Oficial

- **Supabase Docs:** https://supabase.com/docs
- **Auth:** https://supabase.com/docs/guides/auth
- **Database:** https://supabase.com/docs/guides/database
- **Storage:** https://supabase.com/docs/guides/storage
- **RLS:** https://supabase.com/docs/guides/auth/row-level-security

### Herramientas Útiles

- **Supabase CLI:** Para desarrollo local
  ```bash
  npm install -g supabase
  supabase init
  supabase start
  ```

- **Supabase Studio:** Interfaz local (viene con CLI)
  ```
  http://localhost:54323
  ```

### Comandos Útiles

```bash
# Ver logs en tiempo real
supabase logs --tail

# Generar tipos TypeScript
supabase gen types typescript --project-id [tu-proyecto] > types/supabase.ts

# Hacer backup de BD
pg_dump -h db.[tu-proyecto].supabase.co -U postgres -d postgres > backup.sql
```

---

## 11. CHECKLIST FINAL

Antes de ir a producción, verifica:

- [ ] ✅ Todas las tablas creadas (15 tablas)
- [ ] ✅ Roles configurados (7 roles)
- [ ] ✅ Catálogos base insertados
- [ ] ✅ RLS habilitado en todas las tablas
- [ ] ✅ Storage buckets creados (5 buckets)
- [ ] ✅ Políticas de Storage configuradas
- [ ] ✅ Usuario administrador creado y probado
- [ ] ✅ Funciones de búsqueda funcionando
- [ ] ✅ Triggers activos
- [ ] ✅ Frontend conectado correctamente
- [ ] ✅ Subida de archivos funcionando
- [ ] ✅ Autenticación funcionando
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Email templates personalizados (producción)
- [ ] ✅ Backup configurado

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisar logs en Supabase Dashboard > Logs
2. Consultar documentación oficial
3. Revisar esta guía completa
4. Contactar al equipo de desarrollo

---

**¡Listo!** Tu instancia de SISGEDI 2.0 en Supabase está configurada y lista para usar. 🎉
