# Gestión Total Casa — Sprint 1

Base inicial del aplicativo PWA de Gestión Total del Hogar.

## Qué incluye este sprint

Este sprint cubre:

- Fase 0: setup técnico base.
- Inicio de Fase 1: Supabase Auth, familias y miembros.
- Preparación mínima para Fase 2: rutas de ingresos, gastos, mercado y carro, todavía sin lógica financiera completa.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- Vercel

## Instalación local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Luego abre `http://localhost:3000`.

## Variables necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Base de datos

Ejecuta `supabase/schema.sql` en el SQL Editor de Supabase antes de crear usuarios.


## Sprint 2

Finanzas base implementadas: registro de ingresos, registro de gastos, categorías y dashboard MVP con datos reales del mes. Ver `docs/SPRINT_2.md`.


## Sprint 3

Sprint 3 agrega gestión de miembros familiares internos y el primer módulo operativo de Mercado.

Antes de usarlo sobre una base Supabase ya creada, ejecuta:

```sql
supabase/migrations/sprint_3.sql
```

Nuevas capacidades:

- Crear miembros internos desde `/configuracion`.
- Desactivar o reactivar miembros sin borrar históricos.
- Crear quincenas flexibles de mercado.
- Crear facturas manuales.
- Registrar compras principales o esporádicas.
- Agregar productos comprados.
- Ver totales automáticos por compra y por quincena.

Consulta `docs/SPRINT_3.md` para pruebas detalladas.
