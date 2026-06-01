# Sprint 5 — Stock en casa e histórico completo de precios

## Alcance

Sprint 5 consolida Mercado antes de pasar a menús/lista inteligente:

- Stock en casa.
- Stock inicial manual.
- Entradas automáticas desde productos comprados.
- Consumos/salidas manuales.
- Ajustes positivos manuales.
- Movimientos recientes de stock.
- Alertas simples: stock bajo, agotado, sano.
- Histórico de precios por producto con detalle completo de todos los periodos comparables.

## Fases cubiertas

| Fase | Estado |
|---|---:|
| Fase 5 — Catálogo de productos | Consolidada |
| Fase 6 — Histórico de precios | Ampliada |
| Fase 7 — Stock en casa | Implementada MVP |
| Mobile/PWA responsive | Mejoras continuas en cards y formularios |

## Migración obligatoria

Ejecutar en Supabase SQL Editor:

```sql
supabase/migrations/sprint_5.sql
```

Crea:

- `stock_items`
- `stock_movements`

También agrega índices y políticas RLS.

## Cómo probar

1. Ejecutar `sprint_5.sql` en Supabase.
2. Ir a `/mercado`.
3. Crear o seleccionar un producto maestro.
4. Crear stock inicial para ese producto.
5. Registrar un consumo/salida.
6. Crear una compra de mercado con `actualizará stock` marcado.
7. Verificar que el stock aumente automáticamente.
8. Revisar movimientos recientes de stock.
9. Revisar histórico de precios por producto.
10. Probar en vista móvil.

## Notas

- Stock todavía no descuenta automáticamente por menús. Eso vendrá después de implementar menús.
- Las compras marcadas para actualizar stock crean o actualizan inventario.
- El histórico de precios todavía no convierte unidades entre sí. Compara producto + unidad.
