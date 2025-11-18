# 🚀 SPRINT 0: Setup del Proyecto SISGEDI 2.0
## Guía Paso a Paso para Iniciar el Desarrollo

**Duración:** 4 semanas
**Objetivo:** Tener ambiente de desarrollo completo y base técnica sólida
**Team:** Tech Lead, 2 Full-Stack Developers, 1 DevOps, 1 QA
**Budget:** $35,300 USD

---

## 📅 CRONOGRAMA

```
Semana 1: Infraestructura base
├─ Día 1-2: Supabase + GitHub setup
├─ Día 3-4: Monorepo + Next.js inicial
└─ Día 5: CI/CD básico

Semana 2: Database + Auth
├─ Día 1-2: Schema de base de datos
├─ Día 3: RLS Policies
└─ Día 4-5: Authentication flow

Semana 3: Frontend base
├─ Día 1-2: UI components (shadcn/ui)
├─ Día 3-4: Dashboard layout
└─ Día 5: Navegación + routing

Semana 4: Testing + Docs
├─ Día 1-2: Testing setup (Vitest + Playwright)
├─ Día 3: Documentación técnica
└─ Día 4-5: Sprint review + retrospectiva
```

---

## ✅ CHECKLIST COMPLETO

### **SEMANA 1: INFRAESTRUCTURA BASE**

#### Día 1: Supabase Setup (2 horas)

**1.1 Crear Proyecto Supabase**

- [ ] Ir a https://supabase.com
- [ ] Crear cuenta / login
- [ ] Crear nuevo proyecto:
  ```
  Nombre: sisgedi-prod
  Database password: [generar seguro, guardar en 1Password]
  Región: South America (São Paulo) o US East (N. Virginia)
  Plan: Pro ($25/mes)
  ```

- [ ] Esperar ~2 minutos mientras se provisiona

**1.2 Configurar Proyecto**

- [ ] **Database > Settings**
  - Habilitar Connection Pooling (PgBouncer) ✅
  - Statement timeout: 60000ms
  - Idle timeout: 600000ms

- [ ] **Database > Extensions**
  - Habilitar `pgvector` (para embeddings de IA) ✅
  - Habilitar `pg_trgm` (para búsqueda difusa) ✅
  - Habilitar `pgcrypto` (para encryption) ✅
  - Habilitar `uuid-ossp` (para UUIDs) ✅

- [ ] **Storage**
  - Crear bucket `documentos` (privado)
  - Crear bucket `thumbnails` (público)
  - Configurar límites:
    ```
    Max file size: 100 MB
    Allowed MIME types: application/pdf, image/*, application/vnd.*
    ```

- [ ] **Authentication > Providers**
  - Email habilitado ✅
  - Google OAuth (configurar después)
  - Microsoft OAuth (configurar después)

- [ ] **Authentication > Settings**
  - Enable MFA: ✅
  - JWT expiry: 3600 (1 hora)
  - Refresh token expiry: 2592000 (30 días)
  - Enable Email Confirmations: ✅

**1.3 Guardar Credenciales**

- [ ] Copiar de **Settings > API**:
  ```bash
  # Guardar en 1Password / Vault
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

- [ ] Copiar de **Settings > Database**:
  ```bash
  DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
  DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
  ```

---

#### Día 1-2: GitHub Repository (3 horas)

**2.1 Crear Repositorio**

- [ ] Ir a https://github.com/new
- [ ] Configuración:
  ```
  Nombre: sisgedi-v2
  Descripción: Sistema de Gestión Documental y Expedientes Digitales Inteligente 2.0
  Visibilidad: Private (por ahora)
  Initialize:
    - ✅ Add README
    - ✅ Add .gitignore (Node)
    - ✅ License: MIT o Propietaria
  ```

- [ ] Clonar localmente:
  ```bash
  git clone https://github.com/tu-org/sisgedi-v2.git
  cd sisgedi-v2
  ```

**2.2 Branch Protection**

- [ ] Settings > Branches > Add branch protection rule
  - Branch name pattern: `main`
  - ✅ Require pull request before merging
  - ✅ Require status checks to pass
  - ✅ Require branches to be up to date
  - ✅ Require signed commits (opcional, recomendado)

**2.3 GitHub Actions Secrets**

- [ ] Settings > Secrets and variables > Actions
- [ ] Agregar secrets:
  ```
  SUPABASE_SERVICE_ROLE_KEY
  VERCEL_TOKEN (después)
  SENTRY_DSN (después)
  ```

---

#### Día 2-3: Monorepo Setup (6 horas)

**3.1 Inicializar Turborepo**

```bash
# Desde la raíz del repo
npx create-turbo@latest

# Opciones:
# Where would you like to create your turborepo? → .
# Which package manager do you want to use? → npm
```

**3.2 Estructura de Directorios**

```bash
# Crear estructura
mkdir -p apps/web
mkdir -p packages/{ui,database,config,utils}
mkdir -p services/{ocr-processor,ml-predictor}
mkdir -p docs
```

**3.3 Instalar Next.js en apps/web**

```bash
cd apps/web
npx create-next-app@latest .

# Opciones:
# TypeScript? → Yes
# ESLint? → Yes
# Tailwind CSS? → Yes
# src/ directory? → No
# App Router? → Yes
# Import alias? → @/*
```

**3.4 Instalar Dependencias Base**

```bash
# En la raíz del monorepo
npm install -D turbo @turbo/gen
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D eslint prettier
npm install -D husky lint-staged

# En apps/web
cd apps/web
npm install @supabase/ssr @supabase/supabase-js
npm install @tanstack/react-query
npm install zod react-hook-form @hookform/resolvers
npm install date-fns clsx tailwind-merge
npm install lucide-react
npm install next-themes
```

**3.5 Configurar Turborepo**

```json
// turbo.json (raíz)
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    }
  }
}
```

**3.6 Scripts en package.json raíz**

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules"
  }
}
```

**3.7 Configurar Prettier**

```json
// .prettierrc (raíz)
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

```
# .prettierignore
node_modules
.next
.turbo
dist
build
```

**3.8 Configurar ESLint**

```json
// .eslintrc.json (raíz)
{
  "extends": ["next/core-web-vitals", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**3.9 Git Hooks (Husky)**

```bash
# Inicializar Husky
npx husky init

# Pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
EOF

chmod +x .husky/pre-commit
```

```json
// package.json (agregar)
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

---

#### Día 4: CI/CD Básico (4 horas)

**4.1 GitHub Actions - CI**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

**4.2 Vercel Deployment**

- [ ] Ir a https://vercel.com
- [ ] Conectar con GitHub
- [ ] Import project `sisgedi-v2`
- [ ] Configuración:
  ```
  Framework Preset: Next.js
  Root Directory: apps/web
  Build Command: cd ../.. && npx turbo run build --filter=web
  Output Directory: .next
  Install Command: npm install
  ```

- [ ] Environment Variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  DATABASE_URL
  ```

- [ ] Deploy

**4.3 Guardar URLs**

- [ ] Production: https://sisgedi-v2.vercel.app
- [ ] Preview: https://sisgedi-v2-git-[branch].vercel.app

---

### **SEMANA 2: DATABASE + AUTH**

#### Día 1-2: Database Schema (8 horas)

**5.1 Setup Prisma**

```bash
cd packages/database
npm init -y
npm install prisma @prisma/client
npx prisma init
```

**5.2 Configurar Prisma**

```prisma
// packages/database/prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [pgvector(map: "vector")]
}

// ============================================
// USUARIOS Y AUTENTICACIÓN
// ============================================

model Usuario {
  id                    String    @id @default(uuid()) @db.Uuid
  email                 String    @unique
  nombre_completo       String
  nivel_seguridad       Int       @default(1)
  activo                Boolean   @default(true)
  fecha_creacion        DateTime  @default(now())
  fecha_actualizacion   DateTime  @updatedAt

  dependencias          UsuarioDependencia[]
  documentos_creados    Documento[]

  @@index([email])
  @@map("usuarios")
}

model Dependencia {
  id                    String    @id @default(uuid()) @db.Uuid
  nombre                String
  descripcion           String?
  activa                Boolean   @default(true)
  fecha_creacion        DateTime  @default(now())

  usuarios              UsuarioDependencia[]
  documentos            Documento[]

  @@map("dependencias")
}

model UsuarioDependencia {
  usuario_id            String    @db.Uuid
  dependencia_id        String    @db.Uuid
  rol                   Rol
  fecha_asignacion      DateTime  @default(now())

  usuario               Usuario   @relation(fields: [usuario_id], references: [id], onDelete: Cascade)
  dependencia           Dependencia @relation(fields: [dependencia_id], references: [id], onDelete: Cascade)

  @@id([usuario_id, dependencia_id])
  @@map("usuarios_dependencias")
}

enum Rol {
  USUARIO
  JEFE_DEPARTAMENTO
  ADMINISTRADOR
  SUPER_ADMIN
}

// ============================================
// DOCUMENTOS
// ============================================

model Documento {
  id                    String    @id @default(uuid()) @db.Uuid
  titulo                String
  tipo                  TipoDocumento
  clasificacion         Clasificacion
  contenido             String?   @db.Text
  hash_sha256           String    @unique
  formato_archivo       String
  tamano_bytes          Int
  version               Int       @default(1)

  fecha_creacion        DateTime  @default(now())
  fecha_actualizacion   DateTime  @updatedAt
  periodo_retencion     Int
  fecha_disposicion     DateTime?

  storage_path          String?
  thumbnail_url         String?

  autor_id              String    @db.Uuid
  autor                 Usuario   @relation(fields: [autor_id], references: [id])
  dependencia_id        String    @db.Uuid
  dependencia           Dependencia @relation(fields: [dependencia_id], references: [id])

  @@index([titulo])
  @@index([tipo])
  @@index([fecha_creacion])
  @@map("documentos")
}

enum TipoDocumento {
  OFICIO
  CONTRATO
  ACTA
  MEMORANDUM
  FACTURA
  INFORME
  OTRO
}

enum Clasificacion {
  PUBLICO
  INTERNO
  CONFIDENCIAL
}
```

**5.3 Crear Migration Inicial**

```bash
npx prisma migrate dev --name init
```

**5.4 Generar Prisma Client**

```bash
npx prisma generate
```

**5.5 Crear Cliente de Prisma**

```typescript
// packages/database/src/client.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

```typescript
// packages/database/src/index.ts
export * from '@prisma/client'
export { prisma } from './client'
```

---

#### Día 3: RLS Policies (4 horas)

**6.1 Crear SQL para RLS**

```sql
-- packages/database/prisma/migrations/xxx_rls_policies/migration.sql

-- Habilitar RLS
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Política: Ver documentos de su dependencia
CREATE POLICY "usuarios_solo_su_dependencia"
ON documentos FOR SELECT
USING (
  dependencia_id IN (
    SELECT dependencia_id
    FROM usuarios_dependencias
    WHERE usuario_id = auth.uid()
  )
  AND
  clasificacion::text = ANY(
    CASE
      WHEN (SELECT nivel_seguridad FROM usuarios WHERE id = auth.uid()) >= 3 THEN ARRAY['PUBLICO', 'INTERNO', 'CONFIDENCIAL']
      WHEN (SELECT nivel_seguridad FROM usuarios WHERE id = auth.uid()) >= 2 THEN ARRAY['PUBLICO', 'INTERNO']
      ELSE ARRAY['PUBLICO']
    END
  )
);

-- Política: Crear documentos
CREATE POLICY "usuarios_crear_documentos"
ON documentos FOR INSERT
WITH CHECK (
  dependencia_id IN (
    SELECT dependencia_id
    FROM usuarios_dependencias
    WHERE usuario_id = auth.uid()
  )
  AND autor_id = auth.uid()
);

-- Política: Actualizar propios documentos
CREATE POLICY "usuarios_actualizar_propios"
ON documentos FOR UPDATE
USING (autor_id = auth.uid())
WITH CHECK (autor_id = auth.uid());

-- Política: Solo admin puede eliminar
CREATE POLICY "solo_admin_eliminar"
ON documentos FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM usuarios_dependencias
    WHERE usuario_id = auth.uid()
    AND rol IN ('ADMINISTRADOR', 'SUPER_ADMIN')
  )
);
```

**6.2 Aplicar Migration**

```bash
npx prisma migrate dev --name rls_policies
```

---

#### Día 4-5: Authentication (8 horas)

**7.1 Crear Utilidades de Supabase**

```typescript
// apps/web/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// apps/web/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Component error, ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server Component error, ignore
          }
        },
      },
    }
  )
}
```

**7.2 Middleware de Auth**

```typescript
// apps/web/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas protegidas
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirigir a dashboard si ya está logueado
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

**7.3 Páginas de Login**

```tsx
// apps/web/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-bold">SISGEDI 2.0</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Iniciar sesión en tu cuenta
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

### **SEMANA 3: FRONTEND BASE**

#### Día 1-2: UI Components (8 horas)

**8.1 Instalar shadcn/ui**

```bash
cd apps/web
npx shadcn-ui@latest init

# Opciones:
# Style: Default
# Base color: Slate
# CSS variables: Yes
```

**8.2 Agregar Componentes Base**

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
```

**8.3 Configurar Tailwind**

```typescript
// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... resto de colores
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

#### Día 3-4: Dashboard Layout (8 horas)

**9.1 Layout Principal**

```tsx
// apps/web/app/(dashboard)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.Node
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

**9.2 Sidebar Component**

```tsx
// apps/web/components/layout/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Inbox, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Documentos', href: '/dashboard/documentos', icon: FileText },
  { name: 'Tramites', href: '/dashboard/tramites', icon: Inbox },
  { name: 'Búsqueda', href: '/dashboard/busqueda', icon: Search },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()

  return (
    <div className="flex w-64 flex-col border-r bg-gray-50">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">SISGEDI 2.0</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600" />
          <div className="flex-1 text-sm">
            <p className="font-medium">{user.email}</p>
            <p className="text-xs text-gray-500">Usuario</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**9.3 Dashboard Principal**

```tsx
// apps/web/app/(dashboard)/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Inbox, CheckCircle, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()

  // Métricas básicas (placeholder)
  const stats = [
    {
      name: 'Total Documentos',
      value: '0',
      icon: FileText,
      change: '+0%',
    },
    {
      name: 'Trámites Pendientes',
      value: '0',
      icon: Inbox,
      change: '0',
    },
    {
      name: 'Completados Hoy',
      value: '0',
      icon: CheckCircle,
      change: '+0',
    },
    {
      name: 'Promedio Respuesta',
      value: '0h',
      icon: Clock,
      change: '-0%',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bienvenido a SISGEDI 2.0 - Sistema de Gestión Documental
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change} vs. mes anterior</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay actividad reciente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trámites Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No hay trámites urgentes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

### **SEMANA 4: TESTING + DOCS**

#### Día 1-2: Testing Setup (8 horas)

**10.1 Instalar Vitest**

```bash
cd apps/web
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**10.2 Configurar Vitest**

```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

```typescript
// apps/web/vitest.setup.ts
import '@testing-library/jest-dom'
```

**10.3 Test de Ejemplo**

```typescript
// apps/web/__tests__/login.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoginPage from '@/app/(auth)/login/page'

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('shows error on invalid credentials', async () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    // Assert error message appears
  })
})
```

**10.4 Instalar Playwright**

```bash
npm install -D @playwright/test
npx playwright install
```

**10.5 Configurar Playwright**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**10.6 E2E Test de Ejemplo**

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByText('Dashboard')).toBeVisible()
})
```

---

#### Día 3: Documentación (4 horas)

**11.1 README Principal**

```markdown
# SISGEDI 2.0

Sistema de Gestión Documental y Expedientes Digitales Inteligente

## Tecnologías

- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** Supabase (PostgreSQL 15)
- **UI:** Tailwind CSS, shadcn/ui
- **AI:** Google Document AI, OpenAI GPT-4o
- **Deployment:** Vercel, Supabase Cloud

## Estructura del Proyecto

\`\`\`
sisgedi-v2/
├── apps/
│   └── web/              # Next.js app principal
├── packages/
│   ├── ui/               # Componentes compartidos
│   ├── database/         # Prisma schema
│   └── config/           # Configs compartidas
└── services/             # Backend services
\`\`\`

## Inicio Rápido

1. Clonar el repositorio:
\`\`\`bash
git clone https://github.com/tu-org/sisgedi-v2.git
cd sisgedi-v2
\`\`\`

2. Instalar dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configurar variables de entorno:
\`\`\`bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
\`\`\`

4. Ejecutar migraciones:
\`\`\`bash
cd packages/database
npx prisma migrate dev
\`\`\`

5. Iniciar desarrollo:
\`\`\`bash
npm run dev
\`\`\`

6. Abrir http://localhost:3000

## Testing

\`\`\`bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
\`\`\`

## Deployment

El proyecto se despliega automáticamente en Vercel cuando se hace push a \`main\`.

## Documentación

- [Arquitectura Técnica](./docs/ARQUITECTURA_TECNICA_V2.md)
- [Roadmap de Desarrollo](./docs/ROADMAP_DESARROLLO_18_MESES.md)
- [Sprint 0 Guide](./docs/SPRINT_0_SETUP_GUIDE.md)

## Licencia

Propietaria - [Tu Organización]
```

---

#### Día 4-5: Sprint Review + Retrospectiva (8 horas)

**12.1 Sprint Review Checklist**

- [ ] **Demo funcional:**
  - Login funciona ✅
  - Dashboard carga ✅
  - Navegación funciona ✅
  - CI/CD desplegando a Vercel ✅

- [ ] **Cobertura de tests:**
  - Unit tests: 5+ tests básicos
  - E2E tests: 3 flujos críticos
  - Coverage: 60%+ (objetivo inicial)

- [ ] **Performance:**
  - Lighthouse score: 80+ (baseline)
  - First load < 2s
  - No errores de consola

- [ ] **Documentación:**
  - README completo
  - ADRs escritos (3+)
  - Onboarding doc para nuevos devs

**12.2 Sprint Retrospective**

```markdown
# Sprint 0 Retrospective

## ¿Qué salió bien? ✅
- Supabase setup fue rápido
- Next.js 14 App Router funciona bien
- Turborepo simpifica el monorepo
- shadcn/ui aceleró el UI

## ¿Qué puede mejorar? ⚠️
- Curva de aprendizaje de Server Components
- Prisma migrations podrían ser más claras
- CI tarda 5 min (optimizar?)

## Acciones para Sprint 1
- [ ] Capacitación en RSC para el equipo
- [ ] Documentar patrones de Prisma
- [ ] Optimizar cache de npm en CI
```

---

## 🎉 ENTREGABLES SPRINT 0

Al final de las 4 semanas, tendrás:

### ✅ Infraestructura
- [x] Proyecto Supabase configurado
- [x] Repositorio GitHub con branch protection
- [x] CI/CD desplegando a Vercel automáticamente
- [x] Monorepo con Turborepo funcionando

### ✅ Backend
- [x] Database schema con 5 tablas core
- [x] RLS policies implementadas
- [x] Prisma Client generado
- [x] Migraciones aplicadas

### ✅ Frontend
- [x] Next.js 14 con App Router
- [x] Sistema de auth (login/logout)
- [x] Dashboard básico con navegación
- [x] 12+ componentes UI de shadcn/ui
- [x] Responsive design

### ✅ Testing
- [x] Vitest configurado con 5+ unit tests
- [x] Playwright configurado con 3+ E2E tests
- [x] Coverage report

### ✅ Documentación
- [x] README completo
- [x] Arquitectura técnica documentada
- [x] Onboarding guide para nuevos devs
- [x] 3+ ADRs escritos

---

## 💰 PRESUPUESTO SPRINT 0

| Recurso | Costo |
|---------|-------|
| **Team** (5 personas x 4 semanas) | $32,000 |
| **Infraestructura:** | |
| - Supabase Pro | $25/mes → $25 |
| - Vercel Pro | $20/mes → $20 |
| - GitHub Team | $4/user/mes → $20 |
| **Herramientas:** | |
| - 1Password Team | $20/mes |
| **Total** | **$32,085** |

---

## 🚀 PRÓXIMOS PASOS

Una vez completado Sprint 0, estarás listo para:

1. **Sprint 1:** Captura de documentos (upload, metadatos, storage)
2. **Sprint 2:** Visualización y búsqueda
3. **Sprint 3:** Workflows básicos
4. **Sprint 4:** Sistema de turnado

---

**¿Listo para comenzar? 🚀**

Avísame cuando tengas las credenciales de Supabase y empezamos con el setup!

---

*Última actualización: Enero 2026*
*Versión: 1.0*
*Sprint 0 - Setup Phase*
