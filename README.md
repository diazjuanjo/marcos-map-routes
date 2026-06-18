# RutaApp — Map Route Manager

Visualizador y gestor de rutas sobre mapa para equipos de distribución. Permite asignar clientes a vendedores, reordenar rutas por día, y que un fletero vea rutas combinadas de varios vendedores con orden propio.

## Stack

- **React 18 + TypeScript**
- **Vite** (build tool)
- **Leaflet + react-leaflet** (mapa)
- **Supabase** (backend/REST)
- **Tailwind CSS** (estilos)
- **@dnd-kit** (drag & drop)

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- (Opcional) Cuenta en [Vercel](https://vercel.com) para deploy

## Setup local

```bash
npm install
```

Crear `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
```

Ejecutar `src/utils/seed.sql` en el SQL Editor de Supabase para crear tablas y datos demo.

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy en Vercel

1. Pushear el repo a GitHub
2. Importar en Vercel (detecta Vite automáticamente)
3. Agregar Environment Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Funcionalidades

- **Catálogo de clientes** con orden personalizado (drag & drop)
- **Asignación de rutas** por vendedor y día de la semana
- **Orden de ruta** independiente para cada vendedor
- **Vista de fletero** que combina rutas de múltiples vendedores con orden propio
- **Split view** para comparar rutas lado a lado
- Estados: pendiente, completado, cancelado

## Estructura

```
src/
  components/   -- UI: Sidebar, MapView, RouteTab, ViewerTab, CatalogTab, etc.
  utils/        -- storage.ts (Supabase CRUD), seed.sql, migration.sql
  types.ts      -- interfaces compartidas
  App.tsx       -- estado global y handlers
```
