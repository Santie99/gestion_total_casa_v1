# Sprint 19 — Versión estable y guía inicial

## Objetivo

Cerrar una primera versión estable de Gestión Total Casa con una guía operativa integrada, mapa de módulos, checklist de producción y documentación final, sin alterar los flujos ya probados en sprints anteriores.

El punto de datos de ejemplo opcionales fue excluido explícitamente.

## Alcance implementado

- Nueva ruta `/guia`.
- Onboarding operativo con avance dinámico según datos reales de la familia.
- Checklist de configuración mínima para uso estable.
- Mapa completo de módulos.
- Flujos recomendados de uso:
  - financiero mensual;
  - mercado real y stock.
- Checklist de versión estable antes de producción.
- Acceso desde:
  - Dashboard;
  - Configuración;
  - sidebar desktop;
  - menú inferior móvil.

## Sin cambios de base de datos

Sprint 19 no requiere migración SQL.

No se agrega archivo `sprint_19.sql` porque no se crean tablas, columnas, índices ni políticas nuevas.

## Sin datos demo

No se agregaron:

- datos de ejemplo;
- semillas demo;
- botones para poblar datos falsos;
- scripts de prueba con registros automáticos.

El flujo queda preparado para datos reales de la familia.

## Ruta nueva

```txt
/guia
```

## Checklist de onboarding

La guía evalúa con datos reales:

- familia y miembros activos;
- categorías financieras;
- productos maestros;
- periodos/quincenas de mercado;
- presupuestos;
- listas de compras;
- objetivos financieros;
- patrimonio/deudas;
- datos suficientes para reportes.

## Flujos recomendados

### Flujo financiero mensual

```txt
Ingresos → Gastos → Presupuestos → Proyecciones → Insights
```

### Flujo real de mercado

```txt
Compras → Mercado → Reportes
```

El flujo de compras mantiene lo implementado en Sprint 13:

- lista por proveedor/lugar;
- conversión parcial;
- actualización de stock;
- histórico de precios.

## Archivos modificados

```txt
README.md
src/app/(app)/dashboard/page.tsx
src/app/(app)/configuracion/page.tsx
src/components/layout/app-shell.tsx
```

## Archivos nuevos

```txt
docs/SPRINT_19.md
src/app/(app)/guia/page.tsx
src/modules/system/components/app-flow-guide.tsx
src/modules/system/components/module-map-card.tsx
src/modules/system/components/onboarding-progress-card.tsx
src/modules/system/components/stable-release-checklist.tsx
```

## Pruebas sugeridas

1. Entrar a `/guia`.
2. Confirmar que carga la familia activa.
3. Confirmar que el checklist refleja datos reales.
4. Probar links del mapa de módulos.
5. Probar los flujos recomendados.
6. Entrar a `/dashboard` y verificar la tarjeta de Guía.
7. Entrar a `/configuracion` y verificar la tarjeta de Guía.
8. En móvil, confirmar que aparece `Guía` en el menú inferior.
9. Ejecutar `npm run build` antes de hacer commit.

## Checklist final de producción

Antes de considerar la versión estable:

```bash
npm install
npm run build
```

Luego validar en Vercel:

- login;
- dashboard;
- guía;
- compras;
- mercado;
- reportes;
- insights;
- proyecciones;
- menú inferior móvil;
- instalación PWA desde celular.

## Commit sugerido

```bash
git add .
git commit -m "Sprint 19 version estable y guia inicial"
git push
```
