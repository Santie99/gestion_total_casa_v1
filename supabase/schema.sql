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
