# Sprint 8 — Deudas, activos y patrimonio familiar

## Incluido

- Nueva ruta `/deudas`.
- Nueva ruta `/patrimonio`.
- Registro de deudas por tipo, entidad, saldo, cuota, tasa, día de pago y responsable.
- Estados de deuda: activa, pagada, pausada.
- Registro de activos por tipo, valor estimado, fecha de valoración y titular.
- Estados de activo: activo, vendido, inactivo.
- Cálculo de activos, deuda, patrimonio neto, deuda/activos y Debt-to-Income.
- Dashboard ampliado con balance familiar.
- Navegación responsive ajustada para más secciones.

## Migración

Ejecutar en Supabase SQL Editor:

```txt
supabase/migrations/sprint_8.sql
```

## Pruebas sugeridas

1. Crear una deuda activa.
2. Crear un activo.
3. Ver `/patrimonio` y confirmar patrimonio neto.
4. Ver `/deudas` y confirmar Debt-to-Income.
5. Ver `/dashboard` y confirmar tarjetas de balance.
