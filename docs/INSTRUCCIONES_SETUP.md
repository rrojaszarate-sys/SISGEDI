# SISGEDI 2.0 - Instrucciones de Setup

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **npm** 9+ (viene con Node.js)
- **Git** ([Descargar](https://git-scm.com/))
- **Supabase CLI** ([Docs](https://supabase.com/docs/guides/cli))

## 1. Configuración del Proyecto

### 1.1 Clonar el Repositorio

```bash
git clone [URL_DEL_REPO]
cd SISGEDI
```

### 1.2 Instalar Dependencias del Frontend

```bash
cd frontend
npm install
```

## 2. Configuración de Supabase

### 2.1 Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - **Name:** SISGEDI 2.0
   - **Database Password:** [Crea una contraseña segura]
   - **Region:** Selecciona la más cercana a tus usuarios
   - **Pricing Plan:** Free (para desarrollo) o Pro (para producción)

### 2.2 Obtener Credenciales

Una vez creado el proyecto, obtén las siguientes credenciales desde el panel de Supabase:

1. Ve a **Settings** > **API**
2. Copia:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon/public key** (ej: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 2.3 Configurar Variables de Entorno

Crea un archivo `.env.local` en la carpeta `frontend/`:

```bash
cd frontend
cp .env.example .env.local
```

Edita `.env.local` y agrega tus credenciales:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
VITE_APP_ENV=development
VITE_APP_NAME=SISGEDI 2.0
```

### 2.4 Ejecutar Migraciones de Base de Datos

**Opción A: Desde el panel de Supabase (Recomendado para inicio rápido)**

1. Ve a **SQL Editor** en el panel de Supabase
2. Crea una nueva query
3. Copia y pega el contenido de `database_schema.sql`
4. Ejecuta la query

**Opción B: Usando Supabase CLI**

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular con el proyecto
supabase link --project-ref tu-project-ref

# Ejecutar migraciones
cd backend/supabase
supabase db push
```

### 2.5 Crear Datos de Prueba

Ejecuta el siguiente SQL en el **SQL Editor** de Supabase:

```sql
-- Crear Unidad Administrativa de prueba
INSERT INTO cat_unidad_administrativa (nombre_ua, codigo_ua, nivel_jerarquico)
VALUES ('Dirección de Prueba', 'DIR-PRUEBA', 3)
RETURNING id_ua;

-- Copiar el id_ua que se retorna

-- Crear Rol de prueba
INSERT INTO cat_roles (nombre_rol, descripcion, elementos_menu)
VALUES ('Administrador General', 'Administrador con acceso total', '{
  "modulos": ["admin", "doc_entrante", "seguimiento", "doc_saliente", "dashboard", "consultas"],
  "acciones": ["crear", "editar", "eliminar", "turnar", "firmar"]
}'::jsonb)
RETURNING id_rol;

-- Copiar el id_rol que se retorna

-- IMPORTANTE: Primero crear usuario en Supabase Auth
-- Ve a Authentication > Users > Add User
-- Email: admin@sisgedi.gob.mx
-- Password: Admin123!
-- Copia el User UID que se genera

-- Luego crear el registro en tbl_usuarios
INSERT INTO tbl_usuarios (
  id_usuario,  -- User UID de Supabase Auth
  clave_servidor_publico,
  id_ua,  -- id_ua que copiaste arriba
  id_rol,  -- id_rol que copiaste arriba
  nombre_completo,
  correo_institucional,
  password_hash,
  estatus
)
VALUES (
  'PEGAR-USER-UID-AQUI',
  'ADMIN001',
  'PEGAR-ID-UA-AQUI',
  'PEGAR-ID-ROL-AQUI',
  'Administrador del Sistema',
  'admin@sisgedi.gob.mx',
  crypt('Admin123!', gen_salt('bf')),
  'Activo'
);
```

## 3. Ejecutar la Aplicación

### 3.1 Modo Desarrollo

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en: [http://localhost:5173](http://localhost:5173)

### 3.2 Credenciales de Prueba

- **Clave de Servidor:** `ADMIN001`
- **Contraseña:** `Admin123!`

## 4. Verificación

### 4.1 Verificar Conexión a Supabase

1. Abre la consola del navegador (F12)
2. Deberías ver logs de conexión a Supabase
3. No deberías ver errores relacionados con variables de entorno

### 4.2 Verificar Autenticación

1. Ve a [http://localhost:5173/login](http://localhost:5173/login)
2. Ingresa las credenciales de prueba
3. Deberías ser redirigido al dashboard

### 4.3 Verificar RLS

Para verificar que las políticas RLS funcionan:

```sql
-- En el SQL Editor de Supabase, ejecutar:
SELECT * FROM tbl_documento_entrante;

-- Debería retornar solo documentos de la UA del usuario autenticado
-- Si no hay sesión activa, debería retornar 0 resultados
```

## 5. Configuración de Google Vision API (Opcional)

Para habilitar OCR con Google Vision:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita la **Vision API**
4. Crea credenciales (API Key)
5. Agrega la API key a `.env.local`:

```env
VITE_GOOGLE_VISION_API_KEY=tu-google-vision-api-key
```

## 6. Despliegue a Producción

### 6.1 Build de Producción

```bash
cd frontend
npm run build
```

Los archivos de producción estarán en `frontend/dist/`

### 6.2 Opciones de Hosting

#### Opción A: Vercel (Recomendado)

```bash
npm install -g vercel
vercel --prod
```

#### Opción B: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Opción C: Supabase Hosting (Próximamente)

## 7. Solución de Problemas Comunes

### Error: "Supabase URL is not defined"

- Verifica que el archivo `.env.local` existe en `frontend/`
- Verifica que las variables empiezan con `VITE_`
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "Authentication failed"

- Verifica que el usuario existe en **Authentication > Users**
- Verifica que el registro en `tbl_usuarios` tiene el mismo `id_usuario` que el User UID de Supabase Auth
- Verifica que el `estatus` del usuario es 'Activo'

### Error: "Row Level Security policy violation"

- Verifica que ejecutaste las migraciones RLS
- Verifica que el usuario tiene un `id_ua` válido
- Consulta la sección de **RLS** en el panel de Supabase

## 8. Recursos Adicionales

- **Documentación de Supabase:** https://supabase.com/docs
- **Documentación de React:** https://react.dev/
- **Documentación de NextUI:** https://nextui.org/
- **Documentación de TanStack Query:** https://tanstack.com/query/latest

## 9. Soporte

Para preguntas o problemas:

1. Revisa la documentación en `docs/`
2. Consulta el `README.md`
3. Revisa los issues en GitHub
4. Contacta al equipo de desarrollo

---

**¡Listo!** Ahora tienes SISGEDI 2.0 funcionando en tu entorno local. 🚀
