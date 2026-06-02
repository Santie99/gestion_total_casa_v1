-- Gestión Total Casa — Sprint 1 schema
-- Ejecutar en Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(family_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  layer text not null default 'finance' check (layer in ('finance', 'operations')),
  parent_id uuid references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(family_id, name, kind)
);

create table if not exists public.income_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.family_members(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(14,2) not null check (amount >= 0),
  occurred_on date not null,
  monthly_period date generated always as (make_date(extract(year from occurred_on)::int, extract(month from occurred_on)::int, 1)) stored,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.expense_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.family_members(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(14,2) not null check (amount >= 0),
  occurred_on date not null,
  monthly_period date generated always as (make_date(extract(year from occurred_on)::int, extract(month from occurred_on)::int, 1)) stored,
  description text,
  source_module text default 'manual',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.manual_invoices (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  invoice_code text not null,
  invoice_date date,
  vendor text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(family_id, invoice_code)
);

create table if not exists public.market_periods (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open' check (status in ('open', 'closed', 'historical')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public.market_purchases (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  market_period_id uuid not null references public.market_periods(id) on delete cascade,
  invoice_id uuid references public.manual_invoices(id) on delete set null,
  purchased_on date not null,
  vendor text,
  purchase_type text not null default 'main' check (purchase_type in ('main', 'sporadic')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);


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

create table if not exists public.market_purchase_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  market_purchase_id uuid not null references public.market_purchases(id) on delete cascade,
  product_id uuid references public.market_products(id) on delete set null,
  product_name text not null,
  category_name text,
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  total_price numeric(14,2) not null check (total_price >= 0),
  unit_price numeric(14,4) generated always as (case when quantity > 0 then total_price / quantity else null end) stored,
  updates_stock boolean not null default true,
  created_at timestamptz not null default now()
);

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

create index if not exists stock_items_family_product_unit_idx on public.stock_items (family_id, product_id, unit);
create index if not exists stock_items_family_name_unit_idx on public.stock_items (family_id, product_name, unit);
create index if not exists stock_movements_family_created_idx on public.stock_movements (family_id, created_at desc);

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.categories enable row level security;
alter table public.income_entries enable row level security;
alter table public.expense_entries enable row level security;
alter table public.manual_invoices enable row level security;
alter table public.market_periods enable row level security;
alter table public.market_purchases enable row level security;
alter table public.market_products enable row level security;
alter table public.market_purchase_items enable row level security;
alter table public.stock_items enable row level security;
alter table public.stock_movements enable row level security;

create or replace function public.user_family_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select family_id from public.family_members where user_id = auth.uid();
$$;

create or replace function public.create_family_for_current_user(
  family_name text,
  member_full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_family_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.families (name)
  values (family_name)
  returning id into new_family_id;

  insert into public.family_members (family_id, user_id, full_name, role)
  values (new_family_id, auth.uid(), member_full_name, 'admin');

  return new_family_id;
end;
$$;

grant execute on function public.create_family_for_current_user(text, text) to authenticated;


create policy "Users can create families" on public.families
for insert to authenticated
with check (true);

create policy "Members can view their families" on public.families
for select to authenticated
using (id in (select public.user_family_ids()));

create policy "Members can view members in their families" on public.family_members
for select to authenticated
using (family_id in (select public.user_family_ids()));

create policy "Users can create their own member row" on public.family_members
for insert to authenticated
with check (user_id = auth.uid());

create policy "Family members can create internal members" on public.family_members
for insert to authenticated
with check (user_id is null and family_id in (select public.user_family_ids()));

create policy "Family members can update members in their families" on public.family_members
for update to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

create policy "Family members can manage categories" on public.categories
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

create policy "Family members can manage income" on public.income_entries
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

create policy "Family members can manage expenses" on public.expense_entries
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

create policy "Family members can manage invoices" on public.manual_invoices
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

create policy "Family members can manage market periods" on public.market_periods
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

create policy "Family members can manage market purchases" on public.market_purchases
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));


create policy "Family members can manage market products" on public.market_products
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

create policy "Family members can manage market purchase items" on public.market_purchase_items
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));


create policy "Family members can manage stock items" on public.stock_items
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

create policy "Family members can manage stock movements" on public.stock_movements
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

-- Sprint 6 — Carro operativo base
create table if not exists public.car_vehicles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  plate text,
  brand text,
  model_year integer check (model_year is null or (model_year >= 1900 and model_year <= extract(year from now())::int + 1)),
  current_km numeric(14,0) check (current_km is null or current_km >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.car_expenses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  vehicle_id uuid references public.car_vehicles(id) on delete set null,
  category text not null default 'other' check (category in ('gasoline', 'taxes', 'maintenance', 'cleaning', 'inspection', 'insurance', 'soat', 'tecnomecanica', 'parking', 'toll', 'fine', 'parts', 'other')),
  amount numeric(14,2) not null check (amount > 0),
  occurred_on date not null,
  monthly_period date generated always as (make_date(extract(year from occurred_on)::int, extract(month from occurred_on)::int, 1)) stored,
  vendor text,
  odometer_km numeric(14,0) check (odometer_km is null or odometer_km >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.car_reminders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  vehicle_id uuid references public.car_vehicles(id) on delete set null,
  title text not null,
  category text not null default 'maintenance' check (category in ('gasoline', 'taxes', 'maintenance', 'cleaning', 'inspection', 'insurance', 'soat', 'tecnomecanica', 'parking', 'toll', 'fine', 'parts', 'other')),
  due_on date,
  due_km numeric(14,0) check (due_km is null or due_km >= 0),
  status text not null default 'pending' check (status in ('pending', 'done')),
  notes text,
  created_at timestamptz not null default now(),
  check (due_on is not null or due_km is not null)
);

create index if not exists car_vehicles_family_idx on public.car_vehicles (family_id, is_active);
create index if not exists car_expenses_family_month_idx on public.car_expenses (family_id, monthly_period desc);
create index if not exists car_expenses_family_date_idx on public.car_expenses (family_id, occurred_on desc);
create index if not exists car_reminders_family_status_idx on public.car_reminders (family_id, status, due_on);

alter table public.car_vehicles enable row level security;
alter table public.car_expenses enable row level security;
alter table public.car_reminders enable row level security;

drop policy if exists "Family members can manage car vehicles" on public.car_vehicles;
create policy "Family members can manage car vehicles" on public.car_vehicles
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage car expenses" on public.car_expenses;
create policy "Family members can manage car expenses" on public.car_expenses
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage car reminders" on public.car_reminders;
create policy "Family members can manage car reminders" on public.car_reminders
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

-- Sprint 7 — Integración financiera operativa + presupuestos base
create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  budget_month date not null,
  scope text not null check (scope in ('total', 'manual', 'market', 'car')),
  category_name text,
  amount numeric(14,2) not null check (amount > 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(family_id, budget_month, scope, category_name)
);

create index if not exists monthly_budgets_family_month_idx on public.monthly_budgets (family_id, budget_month desc);

alter table public.monthly_budgets enable row level security;

drop policy if exists "Family members can manage monthly budgets" on public.monthly_budgets;
create policy "Family members can manage monthly budgets" on public.monthly_budgets
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));
