# Sprint 2 — Finanzas base + Dashboard MVP

## Alcance

Este sprint cubre la Fase 2 completa y una primera versión funcional de la Fase 3:

- Registro real de ingresos.
- Registro real de gastos manuales.
- Creación de categorías de ingresos y gastos.
- Asociación de movimientos a familia, miembro, fecha real y corte mensual.
- Dashboard ejecutivo con datos reales del mes.
- Configuración base mostrando familia, miembros y categorías creadas.

## No incluido todavía

- Filtros semanales, quincenales y anuales.
- Edición de movimientos.
- Presupuestos.
- Deudas, activos y patrimonio.
- Mercado operativo.
- Carro operativo.
- Gráficas avanzadas.

## Pruebas sugeridas

1. Entrar con una familia existente.
2. Crear al menos una categoría de ingreso.
3. Registrar un ingreso del mes actual.
4. Crear al menos una categoría de gasto.
5. Registrar varios gastos del mes actual.
6. Validar que Dashboard muestre ingresos, gastos, flujo neto y tasa de ahorro.
7. Eliminar un ingreso o gasto y validar que Dashboard se actualice.
8. Revisar Configuración y validar que aparezcan familia, miembros y categorías.

## Notas técnicas

Los movimientos siguen usando las tablas creadas en Sprint 1:

- `income_entries`
- `expense_entries`
- `categories`

No es necesario ejecutar una nueva migración SQL para este sprint.
