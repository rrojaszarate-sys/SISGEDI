# 🏗️ ARQUITECTURA TÉCNICA SISGEDI 2.0
## Diseño de Sistema de Clase Mundial

**Versión:** 2.0
**Fecha:** Enero 2026
**Arquitecto Principal:** [Tu nombre]
**Estado:** Design Phase

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Principios Arquitectónicos](#principios-arquitectónicos)
3. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Arquitectura de Frontend](#arquitectura-de-frontend)
6. [Arquitectura de Backend](#arquitectura-de-backend)
7. [Base de Datos](#base-de-datos)
8. [Seguridad](#seguridad)
9. [Infraestructura](#infraestructura)
10. [Integraciones](#integraciones)
11. [Observabilidad](#observabilidad)
12. [ADRs (Architecture Decision Records)](#adrs)

---

## 🎯 VISIÓN GENERAL

SISGEDI 2.0 es un **Sistema de Gestión Documental y Expedientes Digitales Inteligente** de nivel enterprise que implementa:

- ✅ **Compliance-First:** ISO 15489, NIST, WCAG 2.2, GDPR
- ✅ **AI-Native:** OCR 98%, NLP avanzado, ML predictivo
- ✅ **Zero Trust:** Seguridad post-quantum
- ✅ **API-First:** Ecosistema abierto
- ✅ **Cloud-Native:** Multi-región, auto-scaling

### Características Técnicas Clave
- **Usuarios concurrentes:** 10,000+
- **Documentos:** 10M+ (con crecimiento 20% anual)
- **Throughput:** 1,000 documentos/min
- **Latency p95:** < 500ms
- **Uptime SLA:** 99.9%
- **RPO:** < 1 hora
- **RTO:** < 4 horas

---

## 🧭 PRINCIPIOS ARQUITECTÓNICOS

### 1. **Security by Design**
- Zero Trust Architecture (NIST SP 800-207)
- Encryption everywhere (at rest, in transit, in use)
- Least privilege access
- Defense in depth

### 2. **Compliance First**
- ISO 15489 como base arquitectónica
- Audit trail inmutable (blockchain-anchored)
- WCAG 2.2 AA en todos los componentes
- GDPR/CCPA by design

### 3. **Cloud-Native**
- Microservices (cuando aplique)
- Containerización (Docker)
- Orquestación (Kubernetes future-proof)
- Serverless where possible

### 4. **API-First**
- OpenAPI 3.1 specification
- Versioning semántico
- Rate limiting
- GraphQL para flexibilidad

### 5. **Developer Experience**
- TypeScript everywhere
- Monorepo (Turborepo)
- Hot reload < 200ms
- Type-safe APIs (tRPC)

### 6. **Observability**
- Structured logging
- Distributed tracing
- Real-time metrics
- Alerting proactivo

### 7. **Cost Optimization**
- Serverless para workloads variables
- Spot instances para batch processing
- CDN para assets estáticos
- Caching agresivo

---

## 🏗️ ARQUITECTURA DE ALTO NIVEL

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIOS                                │
│   Web App    │    Mobile App    │   API Clients  │  Integrations│
└────────┬──────────────┬──────────────┬──────────────┬───────────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │    CDN (Cloudflare)         │
         │  - Static assets            │
         │  - DDoS protection          │
         │  - WAF                      │
         └──────────────┬──────────────┘
                        │
         ┌──────────────▼──────────────┐
         │   Load Balancer (Vercel)    │
         │   - Auto-scaling            │
         │   - SSL termination         │
         │   - Health checks           │
         └──────────────┬──────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    ▼                   ▼                   ▼
┌─────────┐       ┌──────────┐       ┌──────────┐
│ Next.js │       │   API    │       │ GraphQL  │
│ App     │       │ Gateway  │       │  API     │
│ (SSR)   │       │ (REST)   │       │          │
└────┬────┘       └────┬─────┘       └────┬─────┘
     │                 │                   │
     └─────────────────┴───────────────────┘
                       │
     ┌─────────────────┴──────────────────────────┐
     │                                             │
     ▼                                             ▼
┌──────────────────────┐               ┌────────────────────┐
│   SUPABASE           │               │  EXTERNAL SERVICES │
│                      │               │                    │
│  ┌────────────────┐  │               │  - Google AI       │
│  │  PostgreSQL 15 │  │               │  - OpenAI GPT-4o   │
│  │  - RLS enabled │  │               │  - SendGrid        │
│  │  - pgvector    │  │               │  - Ethereum        │
│  └────────────────┘  │               │  - Vault (Secrets) │
│                      │               │  - Sentry          │
│  ┌────────────────┐  │               └────────────────────┘
│  │  Auth          │  │
│  │  - JWT tokens  │  │
│  │  - MFA         │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  Storage       │  │
│  │  - S3-compat   │  │
│  │  - CDN         │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  Edge Functions│  │
│  │  - Deno runtime│  │
│  └────────────────┘  │
└──────────────────────┘
```

---

## 🛠️ STACK TECNOLÓGICO

### **Frontend**

| Categoría | Tecnología | Versión | Justificación |
|-----------|-----------|---------|---------------|
| **Framework** | Next.js | 14.2+ | App Router, RSC, mejor DX, SSR para SEO |
| **Language** | TypeScript | 5.4+ | Type safety, mejor refactoring |
| **UI Library** | React | 18.3+ | Ecosistema maduro, Server Components |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first, responsive, dark mode |
| **Components** | shadcn/ui | Latest | Accesible (WCAG), customizable, Radix UI |
| **State** | Zustand | 4.5+ | Simple, performante, no boilerplate |
| **Forms** | React Hook Form | 7.51+ | Performante, validación con Zod |
| **Data Fetching** | TanStack Query | 5.28+ | Caching, optimistic updates, devtools |
| **Routing** | Next.js App Router | Built-in | File-based, layouts, loading states |
| **i18n** | next-intl | 3.11+ | Server Components compatible |
| **Date/Time** | date-fns | 3.6+ | Inmutable, tree-shakeable |
| **Charts** | Recharts | 2.12+ | Declarativo, responsive |
| **PDF Viewer** | react-pdf | 7.7+ | PDF.js wrapper |
| **Rich Text** | Tiptap | 2.3+ | Extensible, accesible |
| **Drag & Drop** | dnd-kit | 6.1+ | Accesible, touch-friendly |

### **Backend**

| Categoría | Tecnología | Versión | Justificación |
|-----------|-----------|---------|---------------|
| **Runtime** | Node.js | 20 LTS | Estable, compatible con Next.js |
| **Framework** | Next.js API Routes | 14.2+ | Colocado con frontend, serverless |
| **Language** | TypeScript | 5.4+ | Shared types con frontend |
| **Database** | PostgreSQL | 15+ | Relacional, ACID, extensible |
| **ORM** | Prisma | 5.13+ | Type-safe, migrations, introspection |
| **Auth** | Supabase Auth | Latest | OAuth, MFA, RLS integration |
| **Storage** | Supabase Storage | Latest | S3-compatible, CDN, RLS |
| **Vector DB** | pgvector | 0.6+ | Embeddings para RAG, in-database |
| **Cache** | Upstash Redis | Latest | Serverless, global replication |
| **Queue** | Inngest | 3.15+ | Durable, retries, observability |
| **Search** | Algolia | Latest | Typo-tolerant, faceted search |
| **Email** | Resend | 3.2+ | Developer-friendly, React emails |
| **File Processing** | Sharp | 0.33+ | Image optimization, WebP/AVIF |

### **AI/ML**

| Categoría | Tecnología | Justificación |
|-----------|-----------|---------------|
| **OCR** | Google Document AI | 98%+ accuracy, multi-language |
| **LLM** | OpenAI GPT-4o | NLP, summarization, RAG |
| **Embeddings** | text-embedding-3-large | 3072 dims, state-of-the-art |
| **ML Framework** | Python + Scikit-learn | Turnado predictivo, XGBoost |
| **ML Platform** | Google Vertex AI | Managed training, deployment |

### **Infrastructure**

| Categoría | Tecnología | Justificación |
|-----------|-----------|---------------|
| **Hosting** | Vercel | Edge network, auto-scaling, preview URLs |
| **Database** | Supabase (AWS) | Managed Postgres, global, backups |
| **CDN** | Cloudflare | DDoS protection, WAF, cache |
| **DNS** | Cloudflare | DNSSEC, fast propagation |
| **Monitoring** | Sentry | Error tracking, performance |
| **Logging** | Axiom | Serverless-friendly, SQL queries |
| **APM** | Vercel Analytics | Real user monitoring, Web Vitals |
| **Secrets** | Vercel Env + Vault | Encrypted, audited |

### **DevOps**

| Categoría | Tecnología | Justificación |
|-----------|-----------|---------------|
| **CI/CD** | GitHub Actions | Native, free for public repos |
| **Testing** | Vitest | Fast, Vite-powered |
| **E2E** | Playwright | Multi-browser, reliable |
| **Linting** | ESLint + Biome | Fast, opinionated |
| **Formatting** | Prettier | Standard, auto-fix |
| **Type Checking** | TypeScript | Compile-time safety |
| **Git Hooks** | Husky | Pre-commit, pre-push |
| **Monorepo** | Turborepo | Caching, parallel execution |

### **Security**

| Categoría | Tecnología | Justificación |
|-----------|-----------|---------------|
| **SAST** | Snyk | Vulnerability scanning |
| **DAST** | OWASP ZAP | Penetration testing |
| **Secrets Scanning** | Gitleaks | Prevent secret leaks |
| **Dependency Scanning** | Renovate | Auto PRs, security updates |
| **WAF** | Cloudflare | Layer 7 protection |
| **DDoS** | Cloudflare | Layer 3/4 protection |

---

## 🎨 ARQUITECTURA DE FRONTEND

### Estructura de Directorios (Monorepo)

```
SISGEDI/
├── apps/
│   ├── web/                    # Next.js app principal
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── registro/
│   │   │   │   └── mfa/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx        # Dashboard principal
│   │   │   │   ├── documentos/
│   │   │   │   ├── tramites/
│   │   │   │   ├── busqueda/
│   │   │   │   ├── reportes/
│   │   │   │   └── configuracion/
│   │   │   ├── api/
│   │   │   │   ├── documentos/
│   │   │   │   ├── turnado/
│   │   │   │   ├── ocr/
│   │   │   │   └── webhooks/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   └── ...
│   │   │   └── features/
│   │   │       ├── document-upload/
│   │   │       ├── document-viewer/
│   │   │       ├── workflow-builder/
│   │   │       └── search-bar/
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts
│   │   │   │   ├── server.ts
│   │   │   │   └── middleware.ts
│   │   │   ├── actions/        # Server Actions
│   │   │   │   ├── documentos.ts
│   │   │   │   └── turnado.ts
│   │   │   ├── utils/
│   │   │   │   ├── cn.ts
│   │   │   │   ├── format.ts
│   │   │   │   └── validators.ts
│   │   │   └── hooks/
│   │   │       ├── use-documentos.ts
│   │   │       └── use-auth.ts
│   │   ├── public/
│   │   │   ├── fonts/
│   │   │   └── icons/
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── middleware.ts
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   ├── mobile/                 # React Native app (Fase 2)
│   └── admin/                  # Admin panel (opcional)
│
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── config/                 # Shared configs (ESLint, TS)
│   ├── database/               # Prisma schema
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── client.ts
│   │       └── seed.ts
│   ├── typescript-config/      # Shared tsconfig.json
│   └── utils/                  # Shared utilities
│
├── services/                   # Backend services
│   ├── ocr-processor/          # Google Document AI
│   ├── ml-predictor/           # ML models (Python)
│   ├── blockchain-notary/      # Ethereum integration
│   └── rpa-bots/               # RPA scripts
│
├── scripts/
│   ├── setup.sh
│   └── seed-db.ts
│
├── docs/
│   ├── ARQUITECTURA_TECNICA_V2.md
│   ├── ROADMAP_DESARROLLO_18_MESES.md
│   └── API_REFERENCE.md
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-staging.yml
│   │   └── deploy-production.yml
│   └── CODEOWNERS
│
├── docker-compose.yml
├── turbo.json
├── package.json
└── README.md
```

### Patrones de Frontend

#### 1. **Server Components por Default**
```tsx
// app/(dashboard)/documentos/page.tsx
import { createClient } from '@/lib/supabase/server'
import { DocumentList } from '@/components/features/document-list'

export default async function DocumentosPage() {
  const supabase = createClient()

  // Data fetching en el servidor (RSC)
  const { data: documentos } = await supabase
    .from('documentos')
    .select('*')
    .order('fecha_creacion', { ascending: false })
    .limit(20)

  return <DocumentList documentos={documentos} />
}
```

#### 2. **Client Components Solo Cuando Necesario**
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)

    // Upload a Supabase Storage
    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(`${Date.now()}-${file.name}`, file)

    if (!error) {
      router.refresh() // Revalidar RSC
    }

    setUploading(false)
  }

  return (
    <div>
      <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Subiendo...' : 'Subir'}
      </button>
    </div>
  )
}
```

#### 3. **Server Actions para Mutations**
```tsx
// app/actions/documentos.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function crearDocumento(formData: FormData) {
  const supabase = createClient()

  const documento = {
    titulo: formData.get('titulo'),
    contenido: formData.get('contenido'),
    tipo: formData.get('tipo'),
  }

  const { data, error } = await supabase
    .from('documentos')
    .insert(documento)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/documentos')
  return { data }
}

// Uso en componente
'use client'

import { crearDocumento } from '@/app/actions/documentos'

export function FormularioDocumento() {
  return (
    <form action={crearDocumento}>
      <input name="titulo" required />
      <textarea name="contenido" required />
      <select name="tipo">
        <option value="oficio">Oficio</option>
        <option value="contrato">Contrato</option>
      </select>
      <button type="submit">Crear</button>
    </form>
  )
}
```

#### 4. **Optimistic Updates con TanStack Query**
```tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export function TurnarDocumento({ documentoId }: { documentoId: string }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (destino: string) => {
      const res = await fetch('/api/turnado', {
        method: 'POST',
        body: JSON.stringify({ documentoId, destino }),
      })
      return res.json()
    },
    onMutate: async (destino) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: ['documento', documentoId] })

      // Snapshot del estado previo
      const previousData = queryClient.getQueryData(['documento', documentoId])

      // Optimistic update
      queryClient.setQueryData(['documento', documentoId], (old: any) => ({
        ...old,
        estado: 'turnado',
        asignado_a: destino,
      }))

      return { previousData }
    },
    onError: (err, destino, context) => {
      // Rollback en caso de error
      queryClient.setQueryData(
        ['documento', documentoId],
        context?.previousData
      )
    },
    onSettled: () => {
      // Refetch para sincronizar con servidor
      queryClient.invalidateQueries({ queryKey: ['documento', documentoId] })
    },
  })

  return (
    <select onChange={e => mutation.mutate(e.target.value)}>
      <option>Seleccionar destino</option>
      <option value="juridico">Jurídico</option>
      <option value="finanzas">Finanzas</option>
    </select>
  )
}
```

#### 5. **Accesibilidad (WCAG 2.2 AA)**
```tsx
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export function DocumentViewer({ documento }: { documento: Documento }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label={`Ver documento ${documento.titulo}`}
        >
          Ver documento
        </button>
      </DialogTrigger>

      <DialogContent aria-describedby="documento-descripcion">
        <VisuallyHidden>
          <h2 id="documento-descripcion">
            Visualización del documento {documento.titulo}
          </h2>
        </VisuallyHidden>

        <iframe
          src={documento.url}
          title={documento.titulo}
          aria-label={`Contenido del documento ${documento.titulo}`}
          className="w-full h-[80vh]"
        />
      </DialogContent>
    </Dialog>
  )
}
```

---

## ⚙️ ARQUITECTURA DE BACKEND

### API Routes (Next.js)

```
app/api/
├── documentos/
│   ├── route.ts              # GET /api/documentos, POST /api/documentos
│   ├── [id]/
│   │   ├── route.ts          # GET, PATCH, DELETE /api/documentos/:id
│   │   ├── versiones/
│   │   │   └── route.ts      # GET /api/documentos/:id/versiones
│   │   └── firmar/
│   │       └── route.ts      # POST /api/documentos/:id/firmar
│   └── ocr/
│       └── route.ts          # POST /api/documentos/ocr
│
├── tramites/
│   ├── route.ts
│   ├── [id]/
│   │   └── route.ts
│   └── turnar/
│       └── route.ts
│
├── workflows/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── ejecutar/
│           └── route.ts
│
├── busqueda/
│   ├── route.ts              # POST /api/busqueda
│   └── facets/
│       └── route.ts          # GET /api/busqueda/facets
│
├── ai/
│   ├── resumen/
│   │   └── route.ts          # POST /api/ai/resumen
│   ├── prediccion-turnado/
│   │   └── route.ts          # POST /api/ai/prediccion-turnado
│   └── rag/
│       └── route.ts          # POST /api/ai/rag
│
├── blockchain/
│   ├── notarize/
│   │   └── route.ts          # POST /api/blockchain/notarize
│   └── verify/
│       └── route.ts          # GET /api/blockchain/verify?hash=xxx
│
├── webhooks/
│   ├── supabase/
│   │   └── route.ts
│   └── stripe/              # Para pagos futuros
│       └── route.ts
│
└── graphql/
    └── route.ts              # GraphQL endpoint
```

### API Route Example (RESTful)

```typescript
// app/api/documentos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CreateDocumentoSchema = z.object({
  titulo: z.string().min(3).max(200),
  tipo: z.enum(['oficio', 'contrato', 'acta', 'memorandum']),
  clasificacion: z.enum(['publico', 'interno', 'confidencial']),
  contenido: z.string().optional(),
  expediente_id: z.string().uuid().optional(),
})

// GET /api/documentos
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const searchParams = request.nextUrl.searchParams

  // Pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  // Filters
  const tipo = searchParams.get('tipo')
  const clasificacion = searchParams.get('clasificacion')

  let query = supabase
    .from('documentos')
    .select('*, dependencia:dependencias(nombre)', { count: 'exact' })

  if (tipo) query = query.eq('tipo', tipo)
  if (clasificacion) query = query.eq('clasificacion', clasificacion)

  const { data, error, count } = await query
    .range(offset, offset + limit - 1)
    .order('fecha_creacion', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

// POST /api/documentos
export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Validación
  const body = await request.json()
  const validation = CreateDocumentoSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation error', details: validation.error.flatten() },
      { status: 400 }
    )
  }

  const documento = validation.data

  // Obtener usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Crear documento (RLS verificará permisos)
  const { data, error } = await supabase
    .from('documentos')
    .insert({
      ...documento,
      autor_id: user.id,
      fecha_creacion: new Date().toISOString(),
      version: 1,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Audit log
  await supabase.from('auditoria').insert({
    usuario_id: user.id,
    accion: 'CREATE',
    recurso_tipo: 'documento',
    recurso_id: data.id,
    detalles: { documento },
  })

  return NextResponse.json({ data }, { status: 201 })
}
```

### GraphQL API (Apollo Server)

```typescript
// app/api/graphql/route.ts
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { ApolloServer } from '@apollo/server'
import { createClient } from '@/lib/supabase/server'

const typeDefs = `#graphql
  type Documento {
    id: ID!
    titulo: String!
    tipo: TipoDocumento!
    clasificacion: Clasificacion!
    contenido: String
    fecha_creacion: DateTime!
    autor: Usuario!
    dependencia: Dependencia!
    expediente: Expediente
    versiones: [DocumentoVersion!]!
    firmas: [Firma!]!
  }

  enum TipoDocumento {
    OFICIO
    CONTRATO
    ACTA
    MEMORANDUM
  }

  enum Clasificacion {
    PUBLICO
    INTERNO
    CONFIDENCIAL
  }

  type Query {
    documentos(
      page: Int = 1
      limit: Int = 20
      tipo: TipoDocumento
      clasificacion: Clasificacion
    ): DocumentoConnection!

    documento(id: ID!): Documento

    buscar(query: String!, limit: Int = 20): [Documento!]!
  }

  type Mutation {
    crearDocumento(input: DocumentoInput!): Documento!
    actualizarDocumento(id: ID!, input: DocumentoInput!): Documento!
    eliminarDocumento(id: ID!): Boolean!
    turnarDocumento(id: ID!, destino: ID!): Tramite!
  }

  type Subscription {
    documentoActualizado(id: ID!): Documento!
    nuevaTarea: Tarea!
  }
`

const resolvers = {
  Query: {
    documentos: async (_, { page, limit, tipo, clasificacion }, context) => {
      const supabase = createClient()
      // ... implementación
    },
    documento: async (_, { id }, context) => {
      // ... implementación
    },
  },
  Mutation: {
    crearDocumento: async (_, { input }, context) => {
      // ... implementación
    },
  },
}

const server = new ApolloServer({ typeDefs, resolvers })

const handler = startServerAndCreateNextHandler(server)

export { handler as GET, handler as POST }
```

---

## 🗄️ BASE DE DATOS

### Modelo de Datos (Prisma Schema)

```prisma
// packages/database/prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector"), pgcrypto]
}

// ============================================
// USUARIOS Y AUTENTICACIÓN
// ============================================

model Usuario {
  id                    String    @id @default(uuid()) @db.Uuid
  email                 String    @unique
  nombre_completo       String
  nivel_seguridad       Int       @default(1) // 1=público, 2=interno, 3=confidencial
  activo                Boolean   @default(true)
  fecha_creacion        DateTime  @default(now())
  fecha_actualizacion   DateTime  @updatedAt

  // Relaciones
  dependencias          UsuarioDependencia[]
  documentos_creados    Documento[]
  tramites_asignados    Tramite[]
  firmas                Firma[]
  auditorias            Auditoria[]

  @@index([email])
  @@map("usuarios")
}

model Dependencia {
  id                    String    @id @default(uuid()) @db.Uuid
  nombre                String
  descripcion           String?
  activa                Boolean   @default(true)
  fecha_creacion        DateTime  @default(now())

  // Relaciones
  usuarios              UsuarioDependencia[]
  documentos            Documento[]
  tramites_origen       Tramite[] @relation("TramiteOrigen")
  tramites_destino      Tramite[] @relation("TramiteDestino")

  @@index([nombre])
  @@map("dependencias")
}

model UsuarioDependencia {
  usuario_id            String    @db.Uuid
  dependencia_id        String    @db.Uuid
  rol                   Rol
  fecha_asignacion      DateTime  @default(now())

  // Relaciones
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

  // Metadatos ISO 15489
  fecha_creacion        DateTime  @default(now())
  fecha_actualizacion   DateTime  @updatedAt
  periodo_retencion     Int       // años
  fecha_disposicion     DateTime?

  // Storage
  storage_path          String?
  thumbnail_url         String?

  // Vector embeddings para RAG
  embedding             Unsupported("vector(3072)")?

  // Relaciones
  autor_id              String    @db.Uuid
  autor                 Usuario   @relation(fields: [autor_id], references: [id])
  dependencia_id        String    @db.Uuid
  dependencia           Dependencia @relation(fields: [dependencia_id], references: [id])
  expediente_id         String?   @db.Uuid
  expediente            Expediente? @relation(fields: [expediente_id], references: [id])

  versiones             DocumentoVersion[]
  tramites              Tramite[]
  firmas                Firma[]
  etiquetas             DocumentoEtiqueta[]
  prueba_blockchain     PruebaBlockchain?

  @@index([titulo])
  @@index([tipo])
  @@index([clasificacion])
  @@index([fecha_creacion])
  @@index([autor_id])
  @@index([dependencia_id])
  @@index([expediente_id])
  @@map("documentos")
}

enum TipoDocumento {
  OFICIO
  CONTRATO
  ACTA
  MEMORANDUM
  FACTURA
  INFORME
  SOLICITUD
  RESPUESTA
  OTRO
}

enum Clasificacion {
  PUBLICO
  INTERNO
  CONFIDENCIAL
  SECRETO
}

model DocumentoVersion {
  id                    String    @id @default(uuid()) @db.Uuid
  documento_id          String    @db.Uuid
  version               Int
  contenido             String?   @db.Text
  hash_sha256           String
  storage_path          String
  cambios_descripcion   String?
  fecha_creacion        DateTime  @default(now())

  // Relaciones
  documento             Documento @relation(fields: [documento_id], references: [id], onDelete: Cascade)

  @@unique([documento_id, version])
  @@index([documento_id])
  @@map("documentos_versiones")
}

model Expediente {
  id                    String    @id @default(uuid()) @db.Uuid
  codigo                String    @unique
  nombre                String
  descripcion           String?   @db.Text
  fecha_apertura        DateTime  @default(now())
  fecha_cierre          DateTime?
  estado                EstadoExpediente @default(ABIERTO)

  // Clasificación documental
  serie_documental      String?
  subserie_documental   String?

  // Relaciones
  documentos            Documento[]

  @@index([codigo])
  @@index([estado])
  @@map("expedientes")
}

enum EstadoExpediente {
  ABIERTO
  CERRADO
  ARCHIVADO
  DISPOSICION_FINAL
}

// ============================================
// TRÁMITES Y WORKFLOWS
// ============================================

model Tramite {
  id                    String    @id @default(uuid()) @db.Uuid
  documento_id          String    @db.Uuid
  workflow_id           String?   @db.Uuid
  estado                EstadoTramite @default(INICIADO)
  prioridad             Prioridad @default(NORMAL)

  // SLA
  fecha_inicio          DateTime  @default(now())
  fecha_limite          DateTime
  fecha_completado      DateTime?
  sla_status            SLAStatus @default(ON_TIME)

  // Asignación
  dependencia_origen_id String    @db.Uuid
  dependencia_destino_id String   @db.Uuid
  usuario_asignado_id   String?   @db.Uuid

  observaciones         String?   @db.Text

  // Relaciones
  documento             Documento @relation(fields: [documento_id], references: [id])
  workflow              Workflow? @relation(fields: [workflow_id], references: [id])
  dependencia_origen    Dependencia @relation("TramiteOrigen", fields: [dependencia_origen_id], references: [id])
  dependencia_destino   Dependencia @relation("TramiteDestino", fields: [dependencia_destino_id], references: [id])
  usuario_asignado      Usuario?  @relation(fields: [usuario_asignado_id], references: [id])

  tareas                Tarea[]

  @@index([documento_id])
  @@index([estado])
  @@index([fecha_limite])
  @@index([sla_status])
  @@index([usuario_asignado_id])
  @@map("tramites")
}

enum EstadoTramite {
  INICIADO
  EN_PROCESO
  PENDIENTE
  COMPLETADO
  CANCELADO
  RECHAZADO
}

enum Prioridad {
  BAJA
  NORMAL
  ALTA
  URGENTE
}

enum SLAStatus {
  ON_TIME
  AT_RISK
  OVERDUE
}

model Workflow {
  id                    String    @id @default(uuid()) @db.Uuid
  nombre                String
  descripcion           String?   @db.Text
  definicion_bpmn       Json      // XML BPMN 2.0 serializado
  activo                Boolean   @default(true)
  fecha_creacion        DateTime  @default(now())

  // Relaciones
  tramites              Tramite[]
  tareas                Tarea[]

  @@map("workflows")
}

model Tarea {
  id                    String    @id @default(uuid()) @db.Uuid
  tramite_id            String    @db.Uuid
  workflow_id           String?   @db.Uuid
  nombre                String
  descripcion           String?   @db.Text
  tipo                  TipoTarea
  estado                EstadoTarea @default(PENDIENTE)
  fecha_creacion        DateTime  @default(now())
  fecha_limite          DateTime?
  fecha_completado      DateTime?

  // Relaciones
  tramite               Tramite   @relation(fields: [tramite_id], references: [id], onDelete: Cascade)
  workflow              Workflow? @relation(fields: [workflow_id], references: [id])

  @@index([tramite_id])
  @@index([estado])
  @@map("tareas")
}

enum TipoTarea {
  REVISION
  APROBACION
  FIRMA
  VALIDACION
  NOTIFICACION
  OTRO
}

enum EstadoTarea {
  PENDIENTE
  EN_PROCESO
  COMPLETADA
  CANCELADA
}

// ============================================
// FIRMAS DIGITALES
// ============================================

model Firma {
  id                    String    @id @default(uuid()) @db.Uuid
  documento_id          String    @db.Uuid
  usuario_id            String    @db.Uuid
  tipo                  TipoFirma
  firma_digital         String    @db.Text
  certificado           String?   @db.Text
  timestamp_tsa         String?   // Timestamp Authority
  fecha_firma           DateTime  @default(now())
  valida                Boolean   @default(true)

  // Relaciones
  documento             Documento @relation(fields: [documento_id], references: [id], onDelete: Cascade)
  usuario               Usuario   @relation(fields: [usuario_id], references: [id])

  @@index([documento_id])
  @@index([usuario_id])
  @@map("firmas")
}

enum TipoFirma {
  FIEL               // Firma Electrónica Avanzada (México)
  SIMPLE
  DIGITAL
  POST_QUANTUM      // ML-DSA
}

// ============================================
// BLOCKCHAIN
// ============================================

model PruebaBlockchain {
  id                    String    @id @default(uuid()) @db.Uuid
  documento_id          String    @unique @db.Uuid
  hash_documento        String
  merkle_root           String
  blockchain            String    // 'ethereum' | 'polygon'
  tx_hash               String    @unique
  block_number          Int
  timestamp_blockchain  DateTime
  gas_cost_usd          Decimal   @db.Decimal(10, 2)
  verificacion_url      String

  // Relaciones
  documento             Documento @relation(fields: [documento_id], references: [id], onDelete: Cascade)

  @@index([tx_hash])
  @@map("pruebas_blockchain")
}

// ============================================
// AUDITORÍA
// ============================================

model Auditoria {
  id                    String    @id @default(uuid()) @db.Uuid
  usuario_id            String    @db.Uuid
  accion                AccionAuditoria
  recurso_tipo          String
  recurso_id            String    @db.Uuid
  ip_address            String?
  user_agent            String?
  resultado             String    @default("success") // 'success' | 'failure'
  detalles              Json?
  timestamp             DateTime  @default(now()) @db.Timestamptz

  // Blockchain anchoring (opcional)
  merkle_root           String?
  blockchain_tx_hash    String?

  // Relaciones
  usuario               Usuario   @relation(fields: [usuario_id], references: [id])

  @@index([usuario_id])
  @@index([accion])
  @@index([recurso_tipo, recurso_id])
  @@index([timestamp])
  @@map("auditoria")
}

enum AccionAuditoria {
  CREATE
  READ
  UPDATE
  DELETE
  SHARE
  DOWNLOAD
  PRINT
  SIGN
  APPROVE
  REJECT
}

// ============================================
// ETIQUETAS Y METADATOS
// ============================================

model Etiqueta {
  id                    String    @id @default(uuid()) @db.Uuid
  nombre                String    @unique
  color                 String?

  // Relaciones
  documentos            DocumentoEtiqueta[]

  @@map("etiquetas")
}

model DocumentoEtiqueta {
  documento_id          String    @db.Uuid
  etiqueta_id           String    @db.Uuid

  // Relaciones
  documento             Documento @relation(fields: [documento_id], references: [id], onDelete: Cascade)
  etiqueta              Etiqueta  @relation(fields: [etiqueta_id], references: [id], onDelete: Cascade)

  @@id([documento_id, etiqueta_id])
  @@map("documentos_etiquetas")
}

// ============================================
// CONFIGURACIÓN
// ============================================

model Configuracion {
  id                    String    @id @default(uuid()) @db.Uuid
  clave                 String    @unique
  valor                 Json
  descripcion           String?
  fecha_actualizacion   DateTime  @updatedAt

  @@map("configuracion")
}
```

### Row Level Security (RLS) Policies

```sql
-- packages/database/prisma/migrations/xxx_rls_policies.sql

-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tramites ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Política: Usuario solo ve documentos de su dependencia
CREATE POLICY "usuarios_solo_su_dependencia"
ON documentos FOR SELECT
USING (
  dependencia_id IN (
    SELECT dependencia_id
    FROM usuarios_dependencias
    WHERE usuario_id = auth.uid()
  )
  AND
  -- Nivel de seguridad del usuario >= clasificación del documento
  clasificacion::int <= (
    SELECT nivel_seguridad
    FROM usuarios
    WHERE id = auth.uid()
  )
);

-- Política: Usuario puede crear documentos en su dependencia
CREATE POLICY "usuarios_crear_en_su_dependencia"
ON documentos FOR INSERT
WITH CHECK (
  dependencia_id IN (
    SELECT dependencia_id
    FROM usuarios_dependencias
    WHERE usuario_id = auth.uid()
  )
  AND
  autor_id = auth.uid()
);

-- Política: Usuario puede actualizar sus propios documentos
CREATE POLICY "usuarios_actualizar_sus_documentos"
ON documentos FOR UPDATE
USING (autor_id = auth.uid())
WITH CHECK (autor_id = auth.uid());

-- Política: Solo ADMINISTRADOR puede eliminar
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

-- Política: Auditoría es solo inserción (inmutable)
CREATE POLICY "auditoria_solo_insercion"
ON auditoria FOR INSERT
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "auditoria_solo_lectura"
ON auditoria FOR SELECT
USING (
  usuario_id = auth.uid()
  OR
  EXISTS (
    SELECT 1
    FROM usuarios_dependencias
    WHERE usuario_id = auth.uid()
    AND rol IN ('ADMINISTRADOR', 'SUPER_ADMIN')
  )
);

-- Política: Trámites visibles para origen y destino
CREATE POLICY "tramites_origen_destino"
ON tramites FOR SELECT
USING (
  dependencia_origen_id IN (
    SELECT dependencia_id
    FROM usuarios_dependencias
    WHERE usuario_id = auth.uid()
  )
  OR
  dependencia_destino_id IN (
    SELECT dependencia_id
    FROM usuarios_dependencias
    WHERE usuario_id = auth.uid()
  )
  OR
  usuario_asignado_id = auth.uid()
);
```

### Índices para Performance

```sql
-- Full-text search en español
CREATE INDEX idx_documentos_titulo_fts
ON documentos USING gin(to_tsvector('spanish', titulo));

CREATE INDEX idx_documentos_contenido_fts
ON documentos USING gin(to_tsvector('spanish', contenido));

-- Vector similarity search (pgvector)
CREATE INDEX idx_documentos_embedding_ivfflat
ON documentos USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Composite index para queries comunes
CREATE INDEX idx_documentos_dependencia_fecha
ON documentos(dependencia_id, fecha_creacion DESC);

CREATE INDEX idx_tramites_asignado_estado
ON tramites(usuario_asignado_id, estado)
WHERE estado IN ('INICIADO', 'EN_PROCESO');

-- Partial index para SLA at risk
CREATE INDEX idx_tramites_sla_at_risk
ON tramites(fecha_limite)
WHERE sla_status = 'AT_RISK' OR sla_status = 'OVERDUE';
```

---

## 🔐 SEGURIDAD

### 1. Authentication Flow (Supabase Auth)

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
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

  // Refrescar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas protegidas
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar MFA
  const { data: factors } = await supabase.auth.mfa.listFactors()
  if (user && factors?.all.length === 0 && !request.nextUrl.pathname.startsWith('/mfa/setup')) {
    return NextResponse.redirect(new URL('/mfa/setup', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 2. API Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// 100 requests por minuto por IP
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
})

// Uso en API route
import { ratelimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // ... resto del handler
}
```

### 3. Input Validation (Zod)

```typescript
// lib/validators.ts
import { z } from 'zod'

export const DocumentoSchema = z.object({
  titulo: z.string().min(3, 'Título mínimo 3 caracteres').max(200),
  tipo: z.enum(['oficio', 'contrato', 'acta', 'memorandum']),
  clasificacion: z.enum(['publico', 'interno', 'confidencial']),
  contenido: z.string().max(1000000, 'Contenido máximo 1MB').optional(),
  expediente_id: z.string().uuid().optional(),
})

export const TramiteSchema = z.object({
  documento_id: z.string().uuid(),
  dependencia_destino_id: z.string().uuid(),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).default('normal'),
  fecha_limite: z.string().datetime(),
  observaciones: z.string().max(1000).optional(),
})

// XSS protection: sanitizar HTML
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  })
}

// SQL Injection protection: usar Prisma (prepared statements)
// Nunca hacer:
// const query = `SELECT * FROM documentos WHERE titulo = '${userInput}'`

// Siempre hacer:
// await prisma.documento.findMany({
//   where: { titulo: userInput }
// })
```

### 4. Content Security Policy

```typescript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

### 5. Encryption

```typescript
// lib/crypto.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Retornar: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// Hash de documentos (SHA-256)
export function hashDocument(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}
```

---

## ☁️ INFRAESTRUCTURA

### Diagrama de Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare (CDN + WAF)                   │
│  - DDoS protection                                          │
│  - SSL/TLS termination                                      │
│  - Static asset caching                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
      ┌──────────────┴──────────────┐
      │                             │
      ▼                             ▼
┌───────────────┐           ┌──────────────────┐
│   Vercel      │           │  Google Cloud    │
│   (Frontend)  │           │  (ML Services)   │
│               │           │                  │
│  - Next.js    │           │  - Document AI   │
│  - Edge Fns   │           │  - Vertex AI     │
│  - Auto-scale │           │  - Vision API    │
└───────┬───────┘           └──────────────────┘
        │
        │
        ▼
┌───────────────────────────────────────┐
│         Supabase (AWS)                │
│   Region: us-east-1 (primary)         │
│   Replica: us-west-2 (read replica)   │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  PostgreSQL 15                  │ │
│  │  - PITR backups (7 days)        │ │
│  │  - Encryption at rest           │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  Storage (S3-compatible)        │ │
│  │  - Multi-region replication     │ │
│  │  - CDN integration              │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  Edge Functions (Deno)          │ │
│  │  - Webhooks processing          │ │
│  │  - Background jobs              │ │
│  └─────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### Environment Variables

```bash
# .env.local (desarrollo)
# .env.production (producción)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GOOGLE_CLOUD_PROJECT_ID=sisgedi-prod
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=xxxxx

# OpenAI
OPENAI_API_KEY=sk-...

# Email (Resend)
RESEND_API_KEY=re_...

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Sentry
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Encryption
ENCRYPTION_KEY=64_hex_characters

# Blockchain
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/xxxxx
ETHEREUM_PRIVATE_KEY=xxxxx # Wallet para smart contracts

# Feature Flags
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
NEXT_PUBLIC_ENABLE_POST_QUANTUM=false
```

### Docker Compose (Desarrollo Local)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: sisgedi_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - '1025:1025' # SMTP
      - '8025:8025' # Web UI

volumes:
  postgres_data:
```

### CI/CD Pipeline

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
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2

  deploy-staging:
    needs: [lint, test, e2e, security]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

---

## 📊 OBSERVABILIDAD

### 1. Logging (Axiom)

```typescript
// lib/logger.ts
import { Axiom } from '@axiomhq/js'

const axiom = new Axiom({
  token: process.env.AXIOM_TOKEN!,
  orgId: process.env.AXIOM_ORG_ID!,
})

export const logger = {
  info: (message: string, metadata?: object) => {
    axiom.ingest('sisgedi-logs', [{
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    }])
  },
  error: (message: string, error: Error, metadata?: object) => {
    axiom.ingest('sisgedi-logs', [{
      level: 'error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
      ...metadata,
    }])
  },
  // ... warn, debug, etc.
}

// Uso
import { logger } from '@/lib/logger'

export async function crearDocumento(data: DocumentoInput) {
  try {
    const documento = await prisma.documento.create({ data })

    logger.info('Documento creado', {
      documento_id: documento.id,
      tipo: documento.tipo,
      usuario_id: data.autor_id,
    })

    return documento
  } catch (error) {
    logger.error('Error al crear documento', error as Error, {
      data,
    })
    throw error
  }
}
```

### 2. Error Tracking (Sentry)

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% de transacciones
  beforeSend(event, hint) {
    // No enviar errores de rate limiting
    if (event.exception?.values?.[0]?.value?.includes('Too many requests')) {
      return null
    }
    return event
  },
})

// Uso en API route
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
    // ... lógica
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/documentos',
      },
      user: {
        id: user.id,
        email: user.email,
      },
    })
    throw error
  }
}
```

### 3. Performance Monitoring

```typescript
// lib/metrics.ts
import { Axiom } from '@axiomhq/js'

const axiom = new Axiom({ token: process.env.AXIOM_TOKEN! })

export async function trackPerformance(
  operation: string,
  fn: () => Promise<any>
) {
  const start = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - start

    axiom.ingest('sisgedi-metrics', [{
      operation,
      duration_ms: duration,
      status: 'success',
      timestamp: new Date().toISOString(),
    }])

    return result
  } catch (error) {
    const duration = Date.now() - start

    axiom.ingest('sisgedi-metrics', [{
      operation,
      duration_ms: duration,
      status: 'error',
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    }])

    throw error
  }
}

// Uso
import { trackPerformance } from '@/lib/metrics'

export async function buscarDocumentos(query: string) {
  return trackPerformance('buscar_documentos', async () => {
    return await prisma.documento.findMany({
      where: {
        OR: [
          { titulo: { contains: query } },
          { contenido: { contains: query } },
        ],
      },
    })
  })
}
```

### 4. Dashboards (Grafana)

```yaml
# Métricas clave a monitorear:
- Request rate (rpm)
- Error rate (%)
- Latency p50, p95, p99 (ms)
- Database connections (count)
- Queue depth (count)
- CPU/Memory usage (%)
- Storage usage (GB)
- Active users (count)

# Alertas:
- Error rate > 1% por 5 min → PagerDuty
- Latency p95 > 1s por 5 min → Slack
- Database CPU > 80% por 10 min → Email
- Storage > 80% capacity → Email
```

---

## 🎯 DECISIONES ARQUITECTÓNICAS (ADRs)

### ADR-001: Usar Next.js 14 App Router

**Estado:** Aceptado

**Contexto:**
Necesitamos un framework full-stack que soporte:
- Server-side rendering para SEO
- Server Components para mejor performance
- API routes colocadas con frontend
- TypeScript de primera clase

**Decisión:**
Usar Next.js 14 con App Router.

**Consecuencias:**
- ✅ Mejor DX (developer experience)
- ✅ Server Components reducen bundle size
- ✅ Layout system simplifica estructura
- ❌ Curva de aprendizaje para el equipo
- ❌ Dependencia en Vercel (mitigado con self-hosting)

---

### ADR-002: Supabase como Backend

**Estado:** Aceptado

**Contexto:**
Necesitamos base de datos, auth, storage en una solución integrada.

**Decisión:**
Usar Supabase (PostgreSQL + Auth + Storage).

**Alternativas consideradas:**
- Firebase: No relacional, vendor lock-in
- AWS Amplify: Más complejo, peor DX
- Self-hosted: Mayor overhead operacional

**Consecuencias:**
- ✅ PostgreSQL (ACID, extensible con pgvector)
- ✅ RLS nativo (seguridad a nivel de BD)
- ✅ Auth con MFA incluido
- ✅ Storage S3-compatible
- ✅ Pricing predecible
- ❌ Vendor lock-in (mitigado: open source, self-hosting posible)

---

### ADR-003: Monorepo con Turborepo

**Estado:** Aceptado

**Contexto:**
Múltiples apps (web, mobile, admin) compartiendo código.

**Decisión:**
Usar monorepo con Turborepo.

**Consecuencias:**
- ✅ Shared packages (UI, utils, database)
- ✅ Atomic commits across apps
- ✅ Caching inteligente (builds más rápidos)
- ❌ Repo más grande
- ❌ CI/CD más complejo

---

### ADR-004: Google Document AI para OCR

**Estado:** Aceptado

**Contexto:**
OCR con 98%+ accuracy es requisito crítico.

**Decisión:**
Usar Google Document AI (vs. Textract, Azure Form Recognizer).

**Justificación:**
- Google Vision: 98.7% accuracy (benchmark independiente)
- AWS Textract: 96.2% accuracy
- Azure: 97.1% accuracy

**Consecuencias:**
- ✅ Mejor accuracy del mercado
- ✅ Soporte para español
- ✅ Handwriting recognition
- ✅ Pricing competitivo ($1.50/1000 pages)
- ❌ Vendor lock-in (mitigado: abstracción en capa de servicio)

---

### ADR-005: Blockchain Pública (Ethereum) para Notarización

**Estado:** Aceptado

**Contexto:**
Prueba de existencia inmutable y verificable públicamente.

**Decisión:**
Usar Ethereum Mainnet (con fallback a Polygon para costos).

**Alternativas:**
- Blockchain privada: No verificable públicamente
- Base de datos: Mutable
- IPFS: No garantiza persistencia

**Consecuencias:**
- ✅ Inmutabilidad garantizada
- ✅ Verificación pública
- ✅ Diferenciador único
- ❌ Costo de gas ($5-20 por tx en Ethereum)
- ⚠️ Mitigación: Usar Polygon (< $0.01 por tx) para docs no críticos

---

### ADR-006: OpenAI GPT-4o para NLP

**Estado:** Aceptado

**Contexto:**
NLP avanzado (resumen, extracción, RAG).

**Decisión:**
Usar OpenAI GPT-4o (vs. Anthropic Claude, open-source).

**Justificación:**
- GPT-4o: Mejor multimodal, 128K context, $5/$15 por 1M tokens
- Claude 3.5: Similar calidad, más caro ($3/$15 por 1M tokens)
- Open-source (Llama 3): Requiere infrastructure, peor calidad

**Consecuencias:**
- ✅ Mejor calidad de NLP
- ✅ Multimodal (futuro: procesar imágenes)
- ✅ Function calling para RAG
- ❌ Vendor lock-in (mitigado: abstracción con Vercel AI SDK)
- ❌ Latencia ~2-3s (aceptable para casos de uso)

---

## 📚 PRÓXIMOS PASOS

1. **Validar arquitectura con equipo**
   - Review de 2 horas con Tech Lead, DevOps, Security
   - Aprobar ADRs
   - Identificar riesgos técnicos

2. **Crear proyecto en Supabase**
   - Setup de proyecto production + staging
   - Configurar RLS policies
   - Habilitar pgvector extension

3. **Inicializar monorepo**
   ```bash
   npx create-turbo@latest
   cd sisgedi
   npm install
   ```

4. **Setup CI/CD**
   - Configurar GitHub Actions
   - Conectar con Vercel
   - Setup Sentry, Axiom

5. **Comenzar Sprint 0** (próxima semana)

---

*Última actualización: Enero 2026*
*Versión: 2.0*
*Arquitecto: [Tu nombre]*
