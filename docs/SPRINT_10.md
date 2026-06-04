# Sprint 10 — Menús nutricionales base

## Objetivo

Crear la primera versión funcional del módulo de menús, conectando miembros familiares, productos maestros de Mercado y una base nutricional básica.

## Incluido

- Nueva ruta `/menus`.
- Perfiles nutricionales por miembro.
- Base nutricional por producto maestro.
- Creación de menús familiares por fecha y tipo de comida.
- Asociación de varios miembros a una misma preparación.
- Instrucciones para quien cocina.
- Productos dentro de cada menú.
- Estimación automática de calorías y proteína cuando la unidad del producto coincide con la unidad nutricional.
- Resumen diario de menús próximos.
- Menús visibles para todos los miembros de la familia.
- Navegación actualizada con Menús.
- Dashboard con conteo de menús del mes.

## No incluido todavía

- Descuento automático de stock desde menús.
- Lista inteligente de compras basada en menús y stock.
- Conversión automática entre unidades distintas.
- Reemplazos automáticos de ítems manteniendo macros.
- Motor IA para proponer menús.

## Migración

Ejecutar en Supabase SQL Editor:

```txt
supabase/migrations/sprint_10.sql
```

Crea:

- `nutrition_profiles`
- `product_nutrition`
- `meal_plans`
- `meal_plan_members`
- `meal_plan_items`

## Pruebas sugeridas

1. Entrar a `/menus`.
2. Crear perfil nutricional para un miembro.
3. Agregar datos nutricionales a un producto maestro.
4. Crear un menú familiar para una fecha próxima.
5. Seleccionar varios miembros para la misma preparación.
6. Agregar un producto al menú usando el producto maestro.
7. Confirmar que se estimen calorías/proteína si la unidad coincide.
8. Revisar el resumen diario.
9. Revisar la vista móvil.
