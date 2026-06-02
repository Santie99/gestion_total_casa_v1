# Sprint 6 — Carro operativo base + PWA foundation

## Alcance

Sprint 6 convierte `/carro` de placeholder a módulo operativo inicial.

Cubre:

- Vehículos familiares.
- Gastos del carro por categoría.
- Vencimientos y mantenimientos pendientes.
- Resumen mensual del carro.
- Integración ligera con Dashboard.
- Base PWA mediante manifest y metadata.

## Migración

Antes de probar, ejecutar en Supabase SQL Editor:

```sql
supabase/migrations/sprint_6.sql
```

Crea:

- `car_vehicles`
- `car_expenses`
- `car_reminders`

Y sus políticas RLS.

## Pruebas sugeridas

1. Entrar a `/carro`.
2. Crear un vehículo.
3. Registrar gasto de gasolina.
4. Registrar gasto de mantenimiento.
5. Crear recordatorio de SOAT o tecnomecánica.
6. Ver resumen mensual.
7. Ver distribución por categoría.
8. Entrar a `/dashboard` y validar tarjeta de Carro actual.
9. Probar vista móvil.

## Pendientes deliberados

- No se sincronizan todavía los gastos del carro con `expense_entries` para evitar duplicidad contable sin una estrategia de conciliación.
- No hay cierre de recordatorios como completados desde la interfaz.
- No hay edición/eliminación de vehículos o gastos.
- No hay costo por kilómetro porque todavía falta modelar kilometraje periódico y consumo.
