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


## Sprint 10 — Menús nutricionales base

Agrega la ruta `/menus` con perfiles nutricionales por miembro, base nutricional por producto maestro, planificación de comidas familiares, productos dentro de menús, estimación básica de calorías/proteína y resumen diario.

Migración requerida: `supabase/migrations/sprint_10.sql`.

Nota: los menús todavía no descuentan stock automáticamente ni generan lista inteligente de compras.


## Sprint 11 — Lista inteligente de compras

Agrega la ruta `/compras` para generar listas de compra desde menús planeados y stock actual. Incluye productos sugeridos por menús, productos con stock bajo y productos manuales.

Migración requerida:

```txt
supabase/migrations/sprint_11.sql
```

Flujo de prueba:

1. Crear menús con productos en `/menus`.
2. Tener stock registrado en `/mercado`.
3. Ir a `/compras`.
4. Generar lista inteligente para el rango deseado.
5. Agregar productos manuales si hace falta.
6. Marcar productos como comprados y cerrar la lista.


## Sprint 12

Sprint 12 conecta la lista inteligente de compras con Mercado y Stock.

Nuevo flujo:

1. Generar lista en `/compras`.
2. Marcar productos comprados.
3. Registrar cantidades y precios reales.
4. Convertir la lista en compra real de Mercado.
5. Actualizar stock automáticamente.

Migración obligatoria:

```txt
supabase/migrations/sprint_12.sql
```


## Sprint 12.1

Sprint 12.1 permite crear listas manuales desde cero cuando no hay menús, stock bajo o productos agotados que generen sugerencias automáticas.

- Si hay sugerencias, el formulario crea una lista inteligente.
- Si no hay sugerencias, crea una lista manual vacía.
- No requiere migración SQL.
- Mantiene el flujo: lista manual → productos manuales → convertir a Mercado → actualizar stock.

## Sprint 13 — Compras/Mercado v2 para uso real

Este sprint mejora el flujo de compras reales:

- Lugar/proveedor sugerido por producto de lista.
- Agrupación visual de la lista por lugar.
- Conversión parcial por grupo/lugar a Mercado.
- Actualización automática de stock para cada grupo convertido.
- Asociación de ítems manuales a productos maestros.
- Creación rápida de producto maestro desde un ítem de lista.

Ejecutar en Supabase:

```sql
supabase/migrations/sprint_13.sql
```


## Sprint 14 — PWA + experiencia móvil

Este sprint mejora la experiencia tipo app:

- Manifest PWA completo con íconos y shortcuts.
- Service worker básico para shell/cache.
- Instalación desde dashboard.
- Banner offline.
- Navegación móvil inferior con estado activo.
- Header móvil sticky.
- Acciones rápidas en dashboard.
- Sidebar desktop agrupado por áreas.
- Ajustes globales para safe-area, tap y formularios móviles.

No requiere migración SQL nueva.

Para probar PWA real, desplegar en Vercel y abrir desde el celular. En iPhone se instala desde Safari → Compartir → Agregar a pantalla de inicio.

## Sprint 14.1

Sprint 14.1 corrige la experiencia móvil/PWA: elimina el menú hamburguesa inservible, remueve acciones rápidas y tarjeta de app instalada del dashboard, agrega Presupuestos al menú inferior y mejora `/compras` con carruseles horizontales para listas y grupos por proveedor. No requiere SQL.


## Sprint 15 — Forecasting y simulaciones

Sprint 15 agrega la ruta `/proyecciones` para proyectar los próximos 6 meses con escenarios base, optimista y pesimista.

Incluye:

- Promedios recientes de ingresos y gastos consolidados.
- Compromisos mensuales de deuda.
- Aportes requeridos a objetivos.
- Caja líquida actual.
- Forecast de caja por mes.
- Stress testing doméstico.
- Tendencia histórica reciente.
- Acceso desde dashboard y navegación.

No requiere migración SQL nueva.


## Sprint 16

Sprint 16 agrega insights y recomendaciones determinísticas:

- Nueva ruta `/insights`.
- Alertas por finanzas, mercado, stock, carro, objetivos, riesgo y operación.
- Reglas internas sin IA externa.
- Acción recomendada por insight.
- Endpoint interno preparado para futura IA en `/api/insights/draft`.

No requiere migración SQL.

Consulta `docs/SPRINT_16.md` para detalles y pruebas.
