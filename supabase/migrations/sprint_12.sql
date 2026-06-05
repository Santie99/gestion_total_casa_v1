-- Sprint 12 — Conversión de listas inteligentes a compras reales de Mercado

alter table public.shopping_lists
add column if not exists converted_market_purchase_id uuid references public.market_purchases(id) on delete set null;

alter table public.shopping_lists
add column if not exists converted_at timestamptz;

alter table public.shopping_list_items
add column if not exists actual_purchase_quantity numeric(14,3) check (actual_purchase_quantity is null or actual_purchase_quantity > 0);

alter table public.shopping_list_items
add column if not exists actual_unit text;

alter table public.shopping_list_items
add column if not exists actual_total_price numeric(14,2) check (actual_total_price is null or actual_total_price >= 0);

alter table public.shopping_list_items
add column if not exists converted_to_market_item_id uuid references public.market_purchase_items(id) on delete set null;

create index if not exists shopping_lists_family_converted_idx on public.shopping_lists (family_id, converted_market_purchase_id);
create index if not exists shopping_list_items_family_converted_idx on public.shopping_list_items (family_id, converted_to_market_item_id);
