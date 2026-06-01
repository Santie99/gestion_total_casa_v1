-- Sprint 5 — Stock en casa e histórico completo de precios
-- Ejecutar después de sprint_4.sql.

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  product_id uuid references public.market_products(id) on delete set null,
  product_name text not null,
  category_name text,
  unit text not null,
  quantity numeric(14,3) not null default 0 check (quantity >= 0),
  min_quantity numeric(14,3) not null default 0 check (min_quantity >= 0),
  is_active boolean not null default true,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  stock_item_id uuid not null references public.stock_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('initial', 'purchase_in', 'consume', 'adjustment')),
  quantity_delta numeric(14,3) not null check (quantity_delta <> 0),
  quantity_after numeric(14,3) not null check (quantity_after >= 0),
  source_purchase_item_id uuid references public.market_purchase_items(id) on delete set null,
  notes text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists stock_items_family_product_unit_idx
on public.stock_items (family_id, product_id, unit);

create index if not exists stock_items_family_name_unit_idx
on public.stock_items (family_id, product_name, unit);

create index if not exists stock_movements_family_created_idx
on public.stock_movements (family_id, created_at desc);

alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "Family members can manage stock items" on public.stock_items;
create policy "Family members can manage stock items"
on public.stock_items
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage stock movements" on public.stock_movements;
create policy "Family members can manage stock movements"
on public.stock_movements
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));
