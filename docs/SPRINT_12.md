# Sprint 12 — Automatización lista inteligente → Mercado → Stock

## Objetivo

Cerrar el flujo operativo entre lista inteligente, compra real de mercado e inventario.

Hasta Sprint 11, una lista podía marcarse como completada, pero eso no agregaba productos al stock. En Sprint 12 se implementa un flujo más correcto:

1. Generar lista inteligente desde menús y stock.
2. Marcar productos como comprados.
3. Registrar cantidades y precios reales.
4. Convertir la lista en una compra real dentro de Mercado.
5. Crear los productos comprados en `market_purchase_items`.
6. Actualizar `stock_items` y `stock_movements` automáticamente.

## Cambios principales

- Nuevos campos en `shopping_lists` para saber si una lista ya fue convertida a una compra real.
- Nuevos campos en `shopping_list_items` para guardar cantidad real, unidad real, precio real y vínculo con el item de Mercado creado.
- Conversión desde `/compras` hacia `market_purchases` y `market_purchase_items`.
- Actualización automática de stock al convertir.
- Prevención de doble conversión de una misma lista.
- UI responsive para registrar datos reales por producto comprado.

## Limitaciones

- Todavía no hay conversión de unidades entre kg/g/litro/ml/unidad/paquete.
- El usuario debe ingresar precio total real antes de convertir.
- Solo se convierten productos marcados como comprados.
- Si se compra una cantidad diferente a la sugerida, se debe ajustar manualmente en el formulario de conversión.

## Migración

Ejecutar:

```sql
supabase/migrations/sprint_12.sql
```

## Pruebas recomendadas

1. Crear una lista inteligente en `/compras`.
2. Marcar algunos productos como comprados.
3. Elegir quincena de Mercado.
4. Registrar fecha, proveedor y precios reales.
5. Convertir a Mercado.
6. Verificar que la lista quede como completada/convertida.
7. Entrar a `/mercado` y revisar que se haya creado la compra.
8. Revisar que el stock aumentó.
9. Revisar movimientos de stock.
