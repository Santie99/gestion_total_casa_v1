-- Sprint 11 — Lista inteligente de compras

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  product_id uuid references public.market_products(id) on delete set null,
  product_name text not null,
  category_name text,
  needed_quantity numeric(14,3) check (needed_quantity is null or needed_quantity >= 0),
  current_stock_quantity numeric(14,3) check (current_stock_quantity is null or current_stock_quantity >= 0),
  suggested_purchase_quantity numeric(14,3) not null check (suggested_purchase_quantity > 0),
  unit text not null,
  source text not null default 'manual' check (source in ('menu', 'low_stock', 'manual')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  is_purchased boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists shopping_lists_family_period_idx on public.shopping_lists (family_id, period_start desc, period_end desc);
create index if not exists shopping_list_items_family_list_idx on public.shopping_list_items (family_id, shopping_list_id);
create index if not exists shopping_list_items_family_product_idx on public.shopping_list_items (family_id, product_id, unit);

alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;

drop policy if exists "Family members can manage shopping lists" on public.shopping_lists;
create policy "Family members can manage shopping lists" on public.shopping_lists
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage shopping list items" on public.shopping_list_items;
create policy "Family members can manage shopping list items" on public.shopping_list_items
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));
