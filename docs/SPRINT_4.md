# Sprint 4 — Estabilización responsive + productos maestros + histórico básico de precios

## Alcance

Este sprint consolida Sprint 3.1 y avanza Mercado hacia las fases de catálogo e histórico de precios.

Incluye:

- Validaciones más claras en Mercado.
- Mensajes de error menos genéricos.
- Botones bloqueados durante guardado.
- Mejora responsive en formularios y listas.
- Productos maestros iniciales.
- Asociación opcional de productos comprados con productos maestros.
- Histórico básico de precios por producto y unidad comparable.
- Tarjeta de Mercado actual en el dashboard.

## Migración obligatoria

Ejecutar en Supabase SQL Editor:

```sql
supabase/migrations/sprint_4.sql
```

La migración crea:

- `market_products`
- `product_id` opcional en `market_purchase_items`
- RLS para `market_products`
- Reasegura RLS para `market_purchase_items`

## Cómo probar

1. Ejecutar migración `sprint_4.sql`.
2. Abrir `/mercado`.
3. Crear producto maestro: Leche, categoría Lácteos, unidad bolsa.
4. Crear una compra con fecha de hoy o anterior.
5. Agregar producto comprado seleccionando producto maestro.
6. Registrar una segunda compra con el mismo producto y unidad.
7. Ver histórico básico de precios.
8. Probar desde vista móvil o responsive tools.
9. Abrir `/dashboard` y validar tarjeta de Mercado actual.

## Validaciones nuevas

- Quincena: fecha final no puede ser anterior a fecha inicial.
- Compra: fecha no puede ser futura.
- Factura: fecha no puede ser futura.
- Producto comprado: producto, categoría, cantidad, unidad y precio total son obligatorios.
- Cantidad y precio deben ser mayores que cero.

## Pendiente para Sprint 5

- Stock en casa.
- Movimientos de stock.
- Entradas automáticas desde compras.
- Salidas manuales.
- Alertas de productos bajos.
