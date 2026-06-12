# Sprint 18 — Seguridad, performance y hardening

## Objetivo

Endurecer la app sin cambiar la experiencia visual principal ni romper la lógica existente. Este sprint refuerza la seguridad en Supabase, protege la integridad entre tablas por familia, agrega índices para pantallas pesadas y centraliza validaciones defensivas en formularios críticos.

## Resultado

La app mantiene los módulos actuales, pero queda más preparada para uso real continuo:

- Dashboard
- Mercado
- Compras
- Menús
- Carro
- Presupuestos
- Proyecciones
- Insights
- Reportes
- Configuración

## SQL obligatorio

Ejecutar en Supabase:

```sql
supabase/migrations/sprint_18.sql
```

La migración es idempotente: puede ejecutarse una vez y usa `if not exists` / `drop trigger if exists` donde aplica.

## Cambios de seguridad

### 1. Función `is_family_member`

Se agregó una función segura para verificar si el usuario autenticado pertenece a una familia activa.

Uso esperado futuro:

```sql
public.is_family_member(target_family_id uuid)
```

### 2. Triggers anti cruce de familias

Se agregó un mecanismo genérico para impedir relaciones inconsistentes entre familias.

Ejemplo del problema que bloquea:

```txt
Un item de mercado con family_id de Familia A apuntando a una compra de Familia B.
```

Aunque la app no genera ese caso en uso normal, este hardening protege la base frente a bugs futuros, malas escrituras manuales o código nuevo.

### 3. RLS reafirmado

La migración vuelve a habilitar Row Level Security en todas las tablas actuales. Es idempotente y no borra políticas existentes.

## Cambios de performance

Se agregaron índices para acelerar consultas por:

- `family_id`
- fechas reales
- mes contable
- estado
- proveedor
- producto
- categoría
- relación padre/hijo

Pantallas beneficiadas:

- `/dashboard`
- `/mercado`
- `/compras`
- `/proyecciones`
- `/insights`
- `/reportes`

## Checks defensivos

Se agregaron constraints `NOT VALID` para proteger datos nuevos sin bloquear datos históricos existentes.

Protegen contra nombres/unidades vacías en entidades clave como:

- familias
- miembros
- categorías
- productos maestros
- items de mercado
- stock
- listas de compras
- items de compras
- menús
- objetivos

## Validaciones en formularios

Se agregó:

```txt
src/lib/validation.ts
```

Y se aplicó inicialmente a formularios críticos:

- movimientos de ingresos/gastos
- productos de mercado
- productos manuales de compras

Esto reduce duplicación y evita guardar datos con espacios vacíos, números inválidos o selectores fuera de rango.

## Configuración

Se agregó una tarjeta de resumen en:

```txt
/configuracion
```

No cambia la lógica de configuración. Solo muestra un resumen del estado de hardening técnico.

## Archivos modificados

```txt
src/app/(app)/configuracion/page.tsx
src/lib/validation.ts
src/modules/finance/components/entry-form.tsx
src/modules/market/components/market-item-form.tsx
src/modules/shopping/components/shopping-manual-item-form.tsx
src/modules/system/components/hardening-summary-card.tsx
supabase/migrations/sprint_18.sql
supabase/schema.sql
README.md
docs/SPRINT_18.md
```

## Pruebas sugeridas

1. Ejecutar `supabase/migrations/sprint_18.sql`.
2. Correr `npm run dev`.
3. Crear un ingreso.
4. Crear un gasto.
5. Agregar producto a una compra de mercado.
6. Agregar producto manual a una lista de compras.
7. Revisar `/configuracion`.
8. Correr `npm run build`.

## Notas

- No hay cambios visuales fuertes.
- No se eliminaron módulos.
- No se cambió el flujo de Compras/Mercado.
- No se agregó IA ni dependencia externa.
- La protección principal vive en Supabase.
