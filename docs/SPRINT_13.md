# Sprint 13 — Mercado/Compras v2 para uso real

## Objetivo

Mejorar el flujo real de ir a hacer mercado desde el celular, especialmente cuando una sola lista contiene productos que se compran en distintos lugares.

## Cambios principales

### 1. Lugar/proveedor por producto

Cada producto de una lista puede tener un `preferred_vendor` o lugar sugerido.

Ejemplos:

- Leche → D1
- Bananos → Plaza
- Carne → Carnicería
- Papel higiénico → Éxito

### 2. Lista agrupada por lugar

La vista de `/compras` agrupa los productos por lugar sugerido. Si un producto no tiene lugar, aparece en `Sin lugar definido`.

### 3. Conversión parcial por grupo

Ya no necesitas convertir toda la lista en una sola compra. Puedes convertir únicamente los productos comprados de un grupo/lugar.

Ejemplo:

1. Compras productos de D1.
2. Marcas solo esos productos como comprados.
3. Conviertes el grupo D1 a Mercado.
4. Luego compras en Plaza.
5. Conviertes el grupo Plaza a Mercado.

Cada conversión crea una compra real en Mercado y actualiza stock solo para esos productos.

### 4. Asociación de producto manual a producto maestro

Cada ítem puede asociarse a un producto maestro existente. Esto mejora histórico de precios, stock y consistencia de nombres.

### 5. Crear producto maestro desde item

Si un producto de la lista no tiene producto maestro, puedes crearlo directamente desde el ítem.

## Migración Supabase

Ejecutar:

```sql
supabase/migrations/sprint_13.sql
```

## Flujo recomendado

1. Crear lista general.
2. Agregar productos manuales y asignar lugar sugerido.
3. Comprar por lugar.
4. Marcar productos comprados del lugar.
5. Registrar cantidad real, unidad y precio.
6. Convertir ese grupo a Mercado.
7. Repetir con el siguiente lugar.

## Limitaciones pendientes

- No hay edición inline completa de nombre/categoría/cantidad sugerida.
- No hay fusión automática de productos duplicados.
- No hay conversión entre unidades.
