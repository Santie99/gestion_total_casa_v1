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


## Sprint 4

Sprint 4 estabiliza Mercado y lo prepara para Stock:

- Validaciones de fechas, cantidades y precios.
- Errores más claros.
- Mejor responsive para uso móvil/PWA.
- Productos maestros iniciales.
- Asociación opcional de productos comprados con producto maestro.
- Histórico básico de precios por producto y unidad.
- Tarjeta de Mercado actual en Dashboard.

Antes de probar, ejecutar:

```txt
supabase/migrations/sprint_4.sql
```

Ver `docs/SPRINT_4.md`.


## Sprint 5

Sprint 5 agrega Stock en casa y mejora el Histórico de precios:

- Stock inicial manual.
- Entradas automáticas desde compras de Mercado.
- Consumos y ajustes manuales.
- Movimientos recientes de stock.
- Alertas simples de stock bajo/ag completamente agotado.
- Histórico de precios completo por producto y unidad.

Antes de probar, ejecutar:

```txt
supabase/migrations/sprint_5.sql
```

Consulta `docs/SPRINT_5.md` para pruebas detalladas.


## Sprint 6

Sprint 6 activa el módulo operativo de Carro y agrega base PWA:

- Vehículos familiares.
- Gastos del carro por categoría.
- Vencimientos y mantenimientos pendientes.
- Resumen mensual del carro.
- Tarjeta de Carro actual en Dashboard.
- Manifest PWA inicial.

Antes de probar, ejecutar:

```txt
supabase/migrations/sprint_6.sql
```

Consulta `docs/SPRINT_6.md` para pruebas detalladas.

## Sprint 7

Sprint 7 integra financieramente las operaciones del hogar:

- Dashboard consolidado: gastos manuales + Mercado + Carro.
- Flujo neto consolidado.
- Tasa de ahorro real.
- Nueva sección `/presupuestos`.
- Presupuestos mensuales por capa: total, manual, mercado y carro.
- Ejecución presupuestal con estado sano, alerta o excedido.

Antes de probar, ejecutar:

```txt
supabase/migrations/sprint_7.sql
```


## Sprint 8

Agrega gestión de deudas, activos y patrimonio familiar.

Rutas nuevas:

- `/deudas`
- `/patrimonio`

Migración requerida:

```txt
supabase/migrations/sprint_8.sql
```

Pruebas principales:

- Crear deuda.
- Crear activo.
- Revisar patrimonio neto.
- Revisar Debt-to-Income.
- Revisar nuevas tarjetas en dashboard.


## Sprint 9

Sprint 9 agrega objetivos financieros y métricas CFO ampliadas.

Nueva ruta:

```txt
/objetivos
```

Nueva migración obligatoria:

```txt
supabase/migrations/sprint_9.sql
```

Incluye:

- Objetivos financieros.
- Aportes a objetivos.
- Progreso y aporte mensual requerido.
- Financial Health Score v1.
- Free Cash Flow Familiar.
- Burn Rate familiar.
- Runway doméstico.
- Savings Efficiency Ratio.
- Liquidity Ratio.
