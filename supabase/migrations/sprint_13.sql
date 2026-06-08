-- Sprint 13 — Compras/Mercado v2 para uso real
-- Permite una sola lista general con lugar/proveedor por producto y conversión parcial por grupo.

alter table public.shopping_list_items
add column if not exists preferred_vendor text;

create index if not exists shopping_list_items_family_vendor_idx
on public.shopping_list_items (family_id, preferred_vendor);
