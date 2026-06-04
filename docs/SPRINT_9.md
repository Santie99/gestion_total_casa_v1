# Sprint 9 — Objetivos financieros + métricas CFO

## Alcance

Este sprint convierte la app en una herramienta más estratégica: agrega objetivos financieros, aportes a objetivos, lectura de progreso y un bloque CFO en el dashboard.

## Incluido

- Nueva ruta `/objetivos`.
- Tabla `financial_goals`.
- Tabla `goal_contributions`.
- Creación de objetivos financieros.
- Registro de aportes a objetivos.
- Progreso por objetivo.
- Aporte mensual requerido según fecha objetivo.
- Estado de objetivo: en curso, en riesgo, atrasado, completado o pausado.
- Tarjetas resumen de objetivos.
- Dashboard con métricas CFO ampliadas:
  - Free Cash Flow Familiar.
  - Burn Rate familiar.
  - Runway doméstico.
  - Savings Efficiency Ratio.
  - Liquidity Ratio.
  - Financial Health Score v1.

## No incluido todavía

- Edición de objetivos.
- Eliminación de objetivos.
- Automatización de aportes desde flujo libre.
- Forecasting avanzado.
- Simulaciones Monte Carlo.
- Insights IA.

## Migración obligatoria

Ejecutar en Supabase SQL Editor:

```sql
supabase/migrations/sprint_9.sql
```

## Pruebas sugeridas

1. Entrar a `/objetivos`.
2. Crear objetivo `Fondo de emergencia`.
3. Crear objetivo `Viaje familiar`.
4. Registrar un aporte.
5. Revisar avance y aporte mensual requerido.
6. Entrar a `/dashboard`.
7. Revisar bloque CFO y tarjetas de objetivos.
8. Probar responsive móvil.
