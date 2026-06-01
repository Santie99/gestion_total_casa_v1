-- Sprint 4 — Productos maestros e histórico básico de precios
-- Ejecutar después de sprint_3.sql.

create table if not exists public.market_products (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  default_category text,
  default_unit text,
  is_active boolean not null default true,
  is_stockable boolean not null default true,
  created_at timestamptz not null default now(),
  unique(family_id, name)
);

alter table public.market_purchase_items
add column if not exists product_id uuid references public.market_products(id) on delete set null;

alter table public.market_products enable row level security;

drop policy if exists "Family members can manage market products" on public.market_products;

create policy "Family members can manage market products" on public.market_products
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

-- Reasegura RLS para instalaciones donde el Sprint 3 se haya ejecutado parcialmente.
alter table public.market_purchase_items enable row level security;

drop policy if exists "Family members can manage market purchase items" on public.market_purchase_items;

create policy "Family members can manage market purchase items" on public.market_purchase_items
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));
