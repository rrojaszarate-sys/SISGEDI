# SISGEDI 2.0

**Sistema de Gestión Documental y Expedientes Digitales Inteligente**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

---

## 🎯 Descripción

SISGEDI 2.0 es un sistema de vanguardia para la gestión documental con capacidades de IA que cumple con los más altos estándares internacionales:

- ✅ **Compliance:** ISO 15489, NIST SP 800-207, WCAG 2.2 AA, GDPR/CCPA
- 🤖 **IA Avanzada:** OCR 98%+, NLP, ML predictivo, RAG
- 🔒 **Seguridad:** Zero Trust, Post-Quantum Crypto, Blockchain notarization
- 🌍 **Accesibilidad:** WCAG 2.2 AA completo
- 🚀 **Performance:** <500ms p95, 99.9% uptime SLA

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│         Next.js 14 (App Router)         │
│    React Server Components + Actions    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Supabase Cloud                │
│  - PostgreSQL 15 + pgvector             │
│  - Row Level Security (RLS)             │
│  - Auth (MFA, OAuth)                    │
│  - Storage (S3-compatible)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         AI/ML Services                  │
│  - Google Document AI (OCR)             │
│  - OpenAI GPT-4o (NLP, RAG)             │
│  - Vertex AI (ML models)                │
└─────────────────────────────────────────┘
```

Ver más: [docs/ARQUITECTURA_TECNICA_V2.md](docs/ARQUITECTURA_TECNICA_V2.md)

---

## 🚀 Inicio Rápido

### Prerequisitos

- **Node.js:** 20 LTS o superior
- **npm:** 10 o superior
- **PostgreSQL:** 15+ (vía Supabase)

### Instalación

1. **Clonar el repositorio:**

```bash
git clone https://github.com/your-org/sisgedi-v2.git
cd sisgedi-v2
```

2. **Instalar dependencias:**

```bash
npm install
```

3. **Configurar variables de entorno:**

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase (ver sección [Configuración](#-configuración)).

4. **Ejecutar migraciones de base de datos:**

```bash
npm run db:migrate
```

5. **Iniciar servidor de desarrollo:**

```bash
npm run dev
```

6. **Abrir navegador:**

```
http://localhost:3000
```

---

## ⚙️ Configuración

### Supabase Setup

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings > API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

3. Ir a **Settings > Database** y copiar:
   - Connection string (pooler) → `DATABASE_URL`
   - Connection string (direct) → `DIRECT_URL`

4. Habilitar extensiones en **Database > Extensions:**
   - ✅ `pgvector` (para embeddings de IA)
   - ✅ `pg_trgm` (para búsqueda difusa)
   - ✅ `pgcrypto` (para encriptación)

Ver guía completa: [docs/SPRINT_0_SETUP_GUIDE.md](docs/SPRINT_0_SETUP_GUIDE.md)

---

## 📦 Estructura del Proyecto

```
sisgedi-v2/
├── apps/
│   └── web/                    # Next.js app principal
│       ├── app/
│       │   ├── (auth)/         # Rutas de autenticación
│       │   ├── (dashboard)/    # Dashboard principal
│       │   └── api/            # API routes
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   └── features/       # Feature components
│       └── lib/
│           ├── supabase/       # Supabase clients
│           └── actions/        # Server Actions
│
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── database/               # Prisma schema & migrations
│   ├── config/                 # Shared configs (ESLint, TS)
│   └── utils/                  # Shared utilities
│
├── services/
│   ├── ocr-processor/          # Google Document AI service
│   ├── ml-predictor/           # ML models (Python)
│   └── blockchain-notary/      # Ethereum integration
│
├── docs/                       # Documentation
│   ├── ARQUITECTURA_TECNICA_V2.md
│   ├── ROADMAP_DESARROLLO_18_MESES.md
│   └── SPRINT_0_SETUP_GUIDE.md
│
└── .github/
    └── workflows/              # CI/CD pipelines
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.4
- **UI Library:** React 18
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand + TanStack Query
- **Forms:** React Hook Form + Zod

### Backend
- **Database:** PostgreSQL 15 (Supabase)
- **ORM:** Prisma 5
- **Auth:** Supabase Auth (MFA, OAuth)
- **Storage:** Supabase Storage (S3-compatible)
- **Cache:** Upstash Redis

### AI/ML
- **OCR:** Google Document AI
- **LLM:** OpenAI GPT-4o
- **Embeddings:** text-embedding-3-large
- **Vector DB:** pgvector

### Infrastructure
- **Hosting:** Vercel (Edge Network)
- **Database:** Supabase Cloud (AWS)
- **CDN:** Cloudflare
- **Monitoring:** Sentry + Axiom
- **CI/CD:** GitHub Actions

---

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar dev server
npm run build            # Build para producción
npm run start            # Iniciar producción

# Testing
npm run test             # Unit tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
npm run test:watch       # Watch mode

# Base de Datos
npm run db:migrate       # Ejecutar migraciones
npm run db:push          # Push schema (dev)
npm run db:studio        # Abrir Prisma Studio
npm run db:generate      # Generar Prisma Client

# Code Quality
npm run lint             # Linting (ESLint)
npm run type-check       # Type checking (TSC)
npm run format           # Format code (Prettier)

# Limpieza
npm run clean            # Limpiar build artifacts
```

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
npm run test
```

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

### Coverage

```bash
npm run test -- --coverage
```

Objetivo: **>80% code coverage**

---

## 🚢 Deployment

### Vercel (Recomendado)

1. Conectar repositorio en [vercel.com](https://vercel.com)
2. Configurar variables de entorno (ver `.env.example`)
3. Deploy automático en cada push a `main`

### Self-Hosted

```bash
npm run build
npm run start
```

Ver guía: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (próximamente)

---

## 📚 Documentación

- [Arquitectura Técnica](docs/ARQUITECTURA_TECNICA_V2.md) - Diseño detallado del sistema
- [Roadmap 18 Meses](docs/ROADMAP_DESARROLLO_18_MESES.md) - Plan de desarrollo completo
- [Sprint 0 Guide](docs/SPRINT_0_SETUP_GUIDE.md) - Guía de configuración inicial
- [Funcionalidades Vanguardia](docs/FUNCIONALIDADES_VANGUARDIA_2025.md) - Features planificadas
- [API Reference](docs/API_REFERENCE.md) - Documentación de API (próximamente)

---

## 🤝 Contribución

Este es un proyecto propietario. Por favor contactar a los maintainers para contribuir.

### Workflow de Desarrollo

1. Crear feature branch: `git checkout -b feature/nombre-feature`
2. Hacer commits: `git commit -m "feat: descripción"`
3. Push: `git push origin feature/nombre-feature`
4. Crear Pull Request
5. Code review + tests pasan → Merge

### Commit Convention

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Bug fix
- `docs:` Cambios en documentación
- `style:` Formatting, missing semi colons, etc
- `refactor:` Refactorización de código
- `test:` Agregar tests
- `chore:` Mantenimiento

---

## 📊 Roadmap

### ✅ Sprint 0 (Mes 1) - Setup
- [x] Infraestructura base
- [x] Database schema
- [x] Authentication
- [x] Dashboard básico

### 🚧 Sprint 1-2 (Meses 2-3) - Gestión Documental Core
- [ ] Upload de documentos
- [ ] Metadatos automáticos
- [ ] Búsqueda full-text
- [ ] Viewer de PDF

### 📅 Sprint 3-4 (Meses 3-4) - Workflows
- [ ] Motor BPMN 2.0
- [ ] Sistema de turnado
- [ ] SLA tracking
- [ ] Firmas digitales

Ver roadmap completo: [docs/ROADMAP_DESARROLLO_18_MESES.md](docs/ROADMAP_DESARROLLO_18_MESES.md)

---

## 🏆 Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| **Uptime SLA** | 99.9% |
| **Latency p95** | <500ms |
| **OCR Accuracy** | 98%+ |
| **Test Coverage** | >80% |
| **Lighthouse Score** | 95+ |
| **WCAG Compliance** | AA (100%) |

---

## 📄 Licencia

Propietario - Todos los derechos reservados.

---

## 👥 Equipo

- **Tech Lead:** [Nombre]
- **Full-Stack Developers:** [Nombres]
- **DevOps Engineer:** [Nombre]
- **ML Engineers:** [Nombres]
- **QA Engineer:** [Nombre]

---

## 📞 Contacto

- **Email:** dev@sisgedi.com
- **Documentación:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/your-org/sisgedi-v2/issues)

---

**SISGEDI 2.0** - Sistema de Gestión Documental de Clase Mundial 🚀
