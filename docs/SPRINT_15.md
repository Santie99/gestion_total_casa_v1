# Sprint 15 — Forecasting y simulaciones

## Objetivo

Agregar una primera capa de planeación hacia adelante: forecast de caja, escenarios de 6 meses y stress testing doméstico.

## Alcance implementado

- Nueva ruta `/proyecciones`.
- Navegación desktop y móvil hacia Proyecciones.
- Forecast de 6 meses con tres escenarios:
  - Base.
  - Optimista.
  - Pesimista.
- Stress testing:
  - Ingreso -20%.
  - Gastos +15%.
  - Imprevisto de $1.000.000.
- Tendencia reciente de 6 meses.
- Lectura CFO de la proyección.
- Tarjeta de acceso desde `/dashboard`.

## Fuente de datos

La proyección usa datos ya existentes:

- `income_entries`
- `expense_entries`
- `market_purchases`
- `market_purchase_items`
- `car_expenses`
- `debts`
- `assets`
- `financial_goals`
- `goal_contributions`

## Lógica

La app calcula promedios recientes de ingresos y gastos consolidados. Luego agrega compromisos mensuales de deuda y aportes requeridos a objetivos.

La proyección no modifica datos ni crea registros nuevos.

## SQL

No requiere migración nueva en Supabase.

## Pruebas sugeridas

1. Abrir `/proyecciones`.
2. Revisar proyección base, optimista y pesimista.
3. Revisar stress testing.
4. Confirmar que el dashboard tenga acceso a Proyecciones.
5. Probar navegación móvil.
6. Validar que la página funcione aunque haya pocos datos históricos.
