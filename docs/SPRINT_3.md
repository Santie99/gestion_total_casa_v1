# Sprint 3 — Miembros familiares + Mercado operativo base

## Alcance

Este sprint implementa dos bloques:

1. Gestión básica de miembros internos de la familia.
2. Primera versión operativa del módulo Mercado.

## Fases cubiertas

- Fase 1: Auth/familia/usuarios, ampliada con miembros internos.
- Fase 4: Mercado base, iniciada con quincenas, facturas, compras y productos.

## Base de datos

Antes de probar este sprint sobre una base existente, ejecuta en Supabase:

```sql
supabase/migrations/sprint_3.sql
```

Esta migración:

- Permite miembros internos sin login propio (`family_members.user_id` nullable).
- Agrega `family_members.is_active`.
- Agrega políticas RLS para crear y actualizar miembros internos de la familia.

El archivo `supabase/schema.sql` también quedó actualizado para instalaciones nuevas.

## Configuración

En `/configuracion` ahora se puede:

- Crear miembros internos.
- Asignar rol `admin` o `member`.
- Ver si un miembro tiene login o es interno.
- Desactivar/reactivar miembros sin borrarlos.

La desactivación evita borrar históricos ya asociados a ingresos, gastos o futuras operaciones.

## Mercado

En `/mercado` ahora se puede:

- Crear quincenas flexibles con fecha inicial y final.
- Seleccionar quincena desde la lista lateral.
- Crear facturas manuales opcionales.
- Registrar compras principales o esporádicas.
- Asociar una factura a una compra.
- Agregar productos a una compra.
- Calcular precio unitario automáticamente desde Supabase.
- Ver total automático por compra.
- Ver total automático por quincena.
- Ver resumen de compras principales, esporádicas, productos y promedio por compra.

## Qué no incluye todavía

- Stock real.
- Movimientos de inventario.
- Catálogo maestro de productos.
- Histórico de precios avanzado.
- Menús.
- Lista de compras inteligente.
- Carro operativo.

## Prueba local recomendada

1. Ejecutar la migración `supabase/migrations/sprint_3.sql`.
2. Correr el proyecto:

```bash
npm install
npm run dev
```

3. Probar `/configuracion`:
   - Crear dos miembros internos.
   - Desactivar uno.
   - Reactivarlo.

4. Probar `/mercado`:
   - Crear una quincena.
   - Crear una factura manual.
   - Crear una compra dentro de la quincena.
   - Agregar productos a esa compra.
   - Revisar totales automáticos.

## Commit sugerido

```bash
git add .
git commit -m "Sprint 3 miembros familiares y mercado base"
git push
```
