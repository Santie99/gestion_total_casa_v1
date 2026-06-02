# Sprint 7 — Integración financiera operativa + presupuestos base

## Objetivo

Conectar las capas financieras y operativas sin duplicar gastos:

- Gastos manuales desde `/gastos`.
- Mercado desde compras y productos registrados en `/mercado`.
- Carro desde gastos registrados en `/carro`.

Además, se agregó la primera versión de presupuestos mensuales.

## Incluido

- Dashboard consolidado.
- Gasto total consolidado: manual + mercado + carro.
- Flujo neto consolidado.
- Tasa de ahorro real.
- Separación visual por capa para evitar doble conteo.
- Nueva ruta `/presupuestos`.
- Tabla `monthly_budgets`.
- Formulario de presupuesto mensual.
- Ejecución presupuestal: presupuesto vs real, diferencia, % de uso y estado.
- Lectura CFO inicial con Free Cash Flow Familiar y Burn Rate familiar.

## Migración requerida

Ejecutar en Supabase SQL Editor:

```sql
supabase/migrations/sprint_7.sql
```

## Pruebas sugeridas

1. Crear gastos manuales en `/gastos`.
2. Crear compras de Mercado en `/mercado`.
3. Crear gastos del carro en `/carro`.
4. Entrar a `/dashboard` y validar:
   - ingresos,
   - gasto consolidado,
   - flujo neto consolidado,
   - capas manual / mercado / carro.
5. Entrar a `/presupuestos`.
6. Crear presupuesto de gasto total consolidado.
7. Crear presupuesto de Mercado.
8. Crear presupuesto de Carro.
9. Validar ejecución presupuestal.
10. Probar responsive móvil.

## Nota de arquitectura

Sprint 7 no copia Mercado ni Carro a `expense_entries`. Los consolida en dashboard y presupuestos desde sus tablas originales. Esto evita doble conteo.
