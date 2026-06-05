# Sprint 11 — Lista inteligente de compras

## Alcance

Este sprint implementa la primera versión de la lista inteligente de compras, conectando:

- Menús planeados.
- Productos usados en menús.
- Stock actual.
- Productos con stock bajo o agotado.
- Compras prioritarias esporádicas agregadas manualmente.

## Funcionalidades

### Nueva ruta `/compras`

Permite generar listas de compras con un rango de fechas.

La lista se calcula con:

1. Productos requeridos por los menús del rango.
2. Stock disponible por producto y unidad.
3. Productos por debajo del stock mínimo.

### Generación de lista

La app calcula:

- Cantidad necesaria por producto.
- Stock actual comparable.
- Cantidad sugerida a comprar.
- Prioridad.
- Fuente: menú, stock bajo o manual.

### Productos manuales

Se pueden agregar productos manualmente a una lista activa para compras esporádicas o prioritarias no cubiertas por menús.

### Seguimiento

Cada producto puede marcarse como comprado o reabrirse.

Cada lista puede marcarse como completada.

## Límites actuales

- No convierte unidades entre sí.
- Compara productos por `product_id + unidad` o por `nombre + unidad`.
- No crea automáticamente una compra real en Mercado al completar la lista.
- No descuenta stock desde menús automáticamente.

## Migración

Ejecutar:

```sql
supabase/migrations/sprint_11.sql
```

Crea:

- `shopping_lists`
- `shopping_list_items`

con índices y políticas RLS.
