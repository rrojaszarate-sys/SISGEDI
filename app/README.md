# SISGEDI 2.0 - Sistema de Gestión Documental Inteligente

## Descripción

Sistema completo de gestión documental para instituciones gubernamentales.

## Módulos

- **Documentos Entrantes**: Registro, OCR, búsqueda full-text
- **Turnado**: Asignación, recepción, avances, semáforo
- **Documentos Salientes**: Oficios, circulares, memorándums
- **Inventario**: Gestión de bienes y activos
- **Dashboard**: Indicadores en tiempo real

## Tecnologías

- React 18 + TypeScript + Vite
- NextUI + Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)
- TanStack Query

## Instalación

```bash
npm install
cp .env.example .env
# Configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

## Estructura

```
src/
├── components/layout/    # Layout principal
├── contexts/             # AuthContext
├── hooks/                # Custom hooks
├── lib/                  # Supabase client
├── pages/                # Páginas por módulo
└── types/                # TypeScript types
```

## Base de Datos

1. Ejecutar `SCRIPT_DEFINITIVO_SIN_RLS.sql` (desarrollo)
2. Ejecutar `SCRIPT_ACTIVAR_RLS.sql` (producción)

## Roles

| Rol | Descripción |
|-----|-------------|
| Administrador General | Acceso total |
| Administrador UA | Gestión de su unidad |
| Recepción | Captura documentos |
| Nivel 1-3 | Turnado y avances |
| Visor | Solo consulta |
