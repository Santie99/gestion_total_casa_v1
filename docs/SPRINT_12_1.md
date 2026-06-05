# Sprint 12.1 — Lista manual desde cero

Este hotfix permite usar `/compras` en perfiles nuevos o familias sin menús/stock cargado.

## Cambios

- El formulario de lista ya no bloquea la creación cuando no hay sugerencias automáticas.
- Si existen sugerencias, el flujo sigue creando una lista inteligente con productos sugeridos.
- Si no existen sugerencias, el botón cambia a `Crear lista manual vacía`.
- La lista manual vacía queda en estado `draft`.
- Después de crearla, se pueden agregar productos desde `Agregar producto manual`.
- El flujo posterior se mantiene:
  - marcar productos comprados,
  - registrar cantidad/precio real,
  - convertir a compra real de Mercado,
  - actualizar stock.

## Migración

No requiere migración SQL.

## Pruebas

1. Entrar a `/compras` en una familia sin menús ni stock.
2. Crear una lista con cualquier rango.
3. Confirmar que se crea una lista vacía.
4. Agregar productos manuales.
5. Marcar productos como comprados.
6. Convertir la lista a Mercado.
7. Confirmar que se actualiza stock.
