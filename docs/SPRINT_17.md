# Sprint 17 — Reportes, exportaciones y auditoría

## Objetivo

Agregar una capa de revisión y salida de información para que el hogar pueda analizar, exportar y auditar datos ya registrados sin alterar los módulos operativos existentes.

## Nueva ruta

```txt
/reportes
```

## Qué incluye

- Reporte mensual consolidado.
- Selector de periodo mensual.
- Resumen de ingresos, gastos consolidados, flujo neto y tasa de ahorro.
- Desglose de gastos manuales, Mercado y Carro.
- Control presupuestal del periodo.
- Reporte de Mercado por proveedor y por producto.
- Reporte de Carro por categoría.
- Histórico reciente de 6 meses.
- Foto rápida de stock, compras, patrimonio y objetivos.
- Auditoría visual de registros.
- Exportación CSV desde el navegador.

## Exportaciones CSV

La sección permite descargar:

- Resumen mensual.
- Histórico de 6 meses.
- Auditoría completa.
- Presupuestos.
- Gastos por categoría.
- Mercado.
- Carro.
- Movimientos financieros manuales.

Los CSV se generan en el navegador. No se crean archivos en Supabase ni se modifica la base de datos.

## Auditoría

La auditoría no crea una tabla nueva. Usa campos existentes como:

- `created_at`
- fechas operativas del registro
- estado
- valor
- módulo de origen

Módulos incluidos:

- Ingresos.
- Gastos.
- Mercado.
- Items de Mercado.
- Carro.
- Presupuestos.
- Stock.
- Compras.
- Items de compra.
- Deudas.
- Patrimonio.
- Objetivos.
- Aportes a objetivos.

## SQL

No requiere migración nueva.

## Archivos principales

```txt
src/app/(app)/reportes/page.tsx
src/modules/reporting/types.ts
src/modules/reporting/calculations.ts
src/modules/reporting/components/csv-download-button.tsx
src/modules/reporting/components/report-summary-card.tsx
src/modules/reporting/components/monthly-history-list.tsx
src/modules/reporting/components/audit-timeline.tsx
src/modules/reporting/components/report-table.tsx
src/components/layout/app-shell.tsx
src/app/(app)/dashboard/page.tsx
README.md
docs/SPRINT_17.md
```

## Pruebas sugeridas

1. Entrar a `/reportes`.
2. Cambiar el selector de mes.
3. Validar resumen financiero mensual.
4. Validar presupuesto contra ejecución.
5. Validar Mercado por proveedor y producto.
6. Validar Carro por categoría.
7. Descargar CSV de resumen, histórico y auditoría.
8. Verificar que el dashboard tenga entrada a Reportes.
9. Verificar que navegación desktop y móvil incluyan Reportes.
10. Confirmar que no hay SQL nuevo para ejecutar.

## Nota sobre PDF

La exportación CSV queda activa en Sprint 17. PDF simple queda como mejora posterior si se necesita una salida imprimible o formal para compartir.
