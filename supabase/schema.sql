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
-- Sprint 8 — Deudas, activos y patrimonio familiar

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  debt_type text not null default 'other' check (debt_type in ('credit_card', 'personal_loan', 'vehicle_loan', 'mortgage', 'family_loan', 'other')),
  entity text,
  current_balance numeric(14,2) not null default 0 check (current_balance >= 0),
  monthly_payment numeric(14,2) check (monthly_payment is null or monthly_payment >= 0),
  interest_rate numeric(8,4) check (interest_rate is null or interest_rate >= 0),
  due_day integer check (due_day is null or (due_day >= 1 and due_day <= 31)),
  responsible_member_id uuid references public.family_members(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'paid', 'paused')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  debt_id uuid not null references public.debts(id) on delete cascade,
  paid_on date not null,
  amount numeric(14,2) not null check (amount > 0),
  principal_amount numeric(14,2) check (principal_amount is null or principal_amount >= 0),
  interest_amount numeric(14,2) check (interest_amount is null or interest_amount >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  asset_type text not null default 'other' check (asset_type in ('cash', 'bank_account', 'investment', 'vehicle', 'real_estate', 'home_item', 'other')),
  estimated_value numeric(14,2) not null default 0 check (estimated_value >= 0),
  valuation_date date not null default current_date,
  owner_member_id uuid references public.family_members(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'sold', 'inactive')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists debts_family_status_idx on public.debts (family_id, status);
create index if not exists debt_payments_family_date_idx on public.debt_payments (family_id, paid_on desc);
create index if not exists assets_family_status_idx on public.assets (family_id, status);
create index if not exists assets_family_type_idx on public.assets (family_id, asset_type);

alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.assets enable row level security;

drop policy if exists "Family members can manage debts" on public.debts;
create policy "Family members can manage debts" on public.debts
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage debt payments" on public.debt_payments;
create policy "Family members can manage debt payments" on public.debt_payments
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage assets" on public.assets;
create policy "Family members can manage assets" on public.assets
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));
-- Sprint 9 — Objetivos financieros + métricas CFO

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  category text not null default 'other' check (category in ('emergency_fund', 'travel', 'debt_payment', 'purchase', 'home_improvement', 'education', 'investment', 'other')),
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  target_date date,
  responsible_member_id uuid references public.family_members(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  goal_id uuid not null references public.financial_goals(id) on delete cascade,
  contributed_on date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (contributed_on <= current_date)
);

create index if not exists financial_goals_family_status_idx on public.financial_goals (family_id, status, target_date);
create index if not exists financial_goals_family_priority_idx on public.financial_goals (family_id, priority);
create index if not exists goal_contributions_family_date_idx on public.goal_contributions (family_id, contributed_on desc);
create index if not exists goal_contributions_goal_idx on public.goal_contributions (goal_id, contributed_on desc);

alter table public.financial_goals enable row level security;
alter table public.goal_contributions enable row level security;

drop policy if exists "Family members can manage financial goals" on public.financial_goals;
create policy "Family members can manage financial goals" on public.financial_goals
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage goal contributions" on public.goal_contributions;
create policy "Family members can manage goal contributions" on public.goal_contributions
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));
-- Sprint 10 — Menús nutricionales base

create table if not exists public.nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  daily_calories numeric(10,2) not null check (daily_calories > 0),
  daily_protein numeric(10,2) not null check (daily_protein > 0),
  goal text not null default 'maintenance' check (goal in ('deficit', 'maintenance', 'surplus', 'recomposition')),
  meals_per_day integer not null default 3 check (meals_per_day > 0 and meals_per_day <= 10),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(member_id)
);

create table if not exists public.product_nutrition (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  product_id uuid not null references public.market_products(id) on delete cascade,
  serving_quantity numeric(14,3) not null check (serving_quantity > 0),
  serving_unit text not null,
  calories numeric(10,2) not null default 0 check (calories >= 0),
  protein numeric(10,2) not null default 0 check (protein >= 0),
  carbs numeric(10,2) check (carbs is null or carbs >= 0),
  fat numeric(10,2) check (fat is null or fat >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(product_id)
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  planned_on date not null,
  meal_type text not null default 'lunch' check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  title text not null,
  preparation_notes text,
  cook_member_id uuid references public.family_members(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_plan_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  member_id uuid not null references public.family_members(id) on delete cascade,
  target_calories numeric(10,2) check (target_calories is null or target_calories >= 0),
  target_protein numeric(10,2) check (target_protein is null or target_protein >= 0),
  created_at timestamptz not null default now(),
  unique(meal_plan_id, member_id)
);

create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  product_id uuid references public.market_products(id) on delete set null,
  product_name text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  estimated_calories numeric(10,2) check (estimated_calories is null or estimated_calories >= 0),
  estimated_protein numeric(10,2) check (estimated_protein is null or estimated_protein >= 0),
  estimated_carbs numeric(10,2) check (estimated_carbs is null or estimated_carbs >= 0),
  estimated_fat numeric(10,2) check (estimated_fat is null or estimated_fat >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists nutrition_profiles_family_idx on public.nutrition_profiles (family_id, member_id);
create index if not exists product_nutrition_family_idx on public.product_nutrition (family_id, product_id);
create index if not exists meal_plans_family_date_idx on public.meal_plans (family_id, planned_on desc, meal_type);
create index if not exists meal_plan_members_family_plan_idx on public.meal_plan_members (family_id, meal_plan_id);
create index if not exists meal_plan_items_family_plan_idx on public.meal_plan_items (family_id, meal_plan_id);

alter table public.nutrition_profiles enable row level security;
alter table public.product_nutrition enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_members enable row level security;
alter table public.meal_plan_items enable row level security;

drop policy if exists "Family members can manage nutrition profiles" on public.nutrition_profiles;
create policy "Family members can manage nutrition profiles" on public.nutrition_profiles
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage product nutrition" on public.product_nutrition;
create policy "Family members can manage product nutrition" on public.product_nutrition
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage meal plans" on public.meal_plans;
create policy "Family members can manage meal plans" on public.meal_plans
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage meal plan members" on public.meal_plan_members;
create policy "Family members can manage meal plan members" on public.meal_plan_members
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

drop policy if exists "Family members can manage meal plan items" on public.meal_plan_items;
create policy "Family members can manage meal plan items" on public.meal_plan_items
for all to authenticated
using (family_id in (select public.user_family_ids()))
with check (family_id in (select public.user_family_ids()));

-- Sprint 11 — Lista inteligente de compras

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  notes text,
  converted_market_purchase_id uuid references public.market_purchases(id) on delete set null,
  converted_at timestamptz,
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
  actual_purchase_quantity numeric(14,3) check (actual_purchase_quantity is null or actual_purchase_quantity > 0),
  actual_unit text,
  actual_total_price numeric(14,2) check (actual_total_price is null or actual_total_price >= 0),
  converted_to_market_item_id uuid references public.market_purchase_items(id) on delete set null,
  unit text not null,
  source text not null default 'manual' check (source in ('menu', 'low_stock', 'manual')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  is_purchased boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists shopping_lists_family_period_idx on public.shopping_lists (family_id, period_start desc, period_end desc);
create index if not exists shopping_lists_family_converted_idx on public.shopping_lists (family_id, converted_market_purchase_id);
create index if not exists shopping_list_items_family_list_idx on public.shopping_list_items (family_id, shopping_list_id);
create index if not exists shopping_list_items_family_product_idx on public.shopping_list_items (family_id, product_id, unit);
create index if not exists shopping_list_items_family_converted_idx on public.shopping_list_items (family_id, converted_to_market_item_id);

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

-- Sprint 13 — Compras/Mercado v2 para uso real
alter table public.shopping_list_items
add column if not exists preferred_vendor text;

create index if not exists shopping_list_items_family_vendor_idx
on public.shopping_list_items (family_id, preferred_vendor);


-- Sprint 18 — Seguridad, performance y hardening
-- Ejecutar después de sprint_13.sql. No borra datos existentes.

-- 1) Funciones de seguridad reutilizables
create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members fm
    where fm.family_id = target_family_id
      and fm.user_id = auth.uid()
      and fm.is_active = true
  );
$$;

grant execute on function public.is_family_member(uuid) to authenticated;

create or replace function public.enforce_child_family_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer := 0;
  child_column text;
  parent_table regclass;
  parent_id uuid;
  parent_family_id uuid;
begin
  if new.family_id is null then
    raise exception 'family_id is required for %', TG_TABLE_NAME;
  end if;

  while i < TG_NARGS loop
    child_column := TG_ARGV[i];
    parent_table := TG_ARGV[i + 1]::regclass;
    parent_id := nullif(to_jsonb(new) ->> child_column, '')::uuid;

    if parent_id is not null then
      execute format('select family_id from %s where id = $1', parent_table)
      into parent_family_id
      using parent_id;

      -- La FK se encarga de impedir IDs inexistentes. Aquí solo bloqueamos cruces de familia.
      if parent_family_id is not null and parent_family_id <> new.family_id then
        raise exception 'Cross-family relation blocked on %.% referencing %', TG_TABLE_NAME, child_column, parent_table;
      end if;
    end if;

    i := i + 2;
  end loop;

  return new;
end;
$$;

-- 2) Triggers anti cruce de familias en relaciones críticas

drop trigger if exists trg_categories_family_integrity on public.categories;
create trigger trg_categories_family_integrity
before insert or update of family_id, parent_id on public.categories
for each row execute function public.enforce_child_family_integrity('parent_id', 'public.categories');

drop trigger if exists trg_income_entries_family_integrity on public.income_entries;
create trigger trg_income_entries_family_integrity
before insert or update of family_id, member_id, category_id on public.income_entries
for each row execute function public.enforce_child_family_integrity('member_id', 'public.family_members', 'category_id', 'public.categories');

drop trigger if exists trg_expense_entries_family_integrity on public.expense_entries;
create trigger trg_expense_entries_family_integrity
before insert or update of family_id, member_id, category_id on public.expense_entries
for each row execute function public.enforce_child_family_integrity('member_id', 'public.family_members', 'category_id', 'public.categories');

drop trigger if exists trg_market_purchases_family_integrity on public.market_purchases;
create trigger trg_market_purchases_family_integrity
before insert or update of family_id, market_period_id, invoice_id on public.market_purchases
for each row execute function public.enforce_child_family_integrity('market_period_id', 'public.market_periods', 'invoice_id', 'public.manual_invoices');

drop trigger if exists trg_market_purchase_items_family_integrity on public.market_purchase_items;
create trigger trg_market_purchase_items_family_integrity
before insert or update of family_id, market_purchase_id, product_id on public.market_purchase_items
for each row execute function public.enforce_child_family_integrity('market_purchase_id', 'public.market_purchases', 'product_id', 'public.market_products');

drop trigger if exists trg_stock_movements_family_integrity on public.stock_movements;
create trigger trg_stock_movements_family_integrity
before insert or update of family_id, stock_item_id, source_purchase_item_id on public.stock_movements
for each row execute function public.enforce_child_family_integrity('stock_item_id', 'public.stock_items', 'source_purchase_item_id', 'public.market_purchase_items');

drop trigger if exists trg_car_expenses_family_integrity on public.car_expenses;
create trigger trg_car_expenses_family_integrity
before insert or update of family_id, vehicle_id on public.car_expenses
for each row execute function public.enforce_child_family_integrity('vehicle_id', 'public.car_vehicles');

drop trigger if exists trg_car_reminders_family_integrity on public.car_reminders;
create trigger trg_car_reminders_family_integrity
before insert or update of family_id, vehicle_id on public.car_reminders
for each row execute function public.enforce_child_family_integrity('vehicle_id', 'public.car_vehicles');

drop trigger if exists trg_debts_family_integrity on public.debts;
create trigger trg_debts_family_integrity
before insert or update of family_id, responsible_member_id on public.debts
for each row execute function public.enforce_child_family_integrity('responsible_member_id', 'public.family_members');

drop trigger if exists trg_debt_payments_family_integrity on public.debt_payments;
create trigger trg_debt_payments_family_integrity
before insert or update of family_id, debt_id on public.debt_payments
for each row execute function public.enforce_child_family_integrity('debt_id', 'public.debts');

drop trigger if exists trg_assets_family_integrity on public.assets;
create trigger trg_assets_family_integrity
before insert or update of family_id, owner_member_id on public.assets
for each row execute function public.enforce_child_family_integrity('owner_member_id', 'public.family_members');

drop trigger if exists trg_financial_goals_family_integrity on public.financial_goals;
create trigger trg_financial_goals_family_integrity
before insert or update of family_id, responsible_member_id on public.financial_goals
for each row execute function public.enforce_child_family_integrity('responsible_member_id', 'public.family_members');

drop trigger if exists trg_goal_contributions_family_integrity on public.goal_contributions;
create trigger trg_goal_contributions_family_integrity
before insert or update of family_id, goal_id on public.goal_contributions
for each row execute function public.enforce_child_family_integrity('goal_id', 'public.financial_goals');

drop trigger if exists trg_nutrition_profiles_family_integrity on public.nutrition_profiles;
create trigger trg_nutrition_profiles_family_integrity
before insert or update of family_id, member_id on public.nutrition_profiles
for each row execute function public.enforce_child_family_integrity('member_id', 'public.family_members');

drop trigger if exists trg_product_nutrition_family_integrity on public.product_nutrition;
create trigger trg_product_nutrition_family_integrity
before insert or update of family_id, product_id on public.product_nutrition
for each row execute function public.enforce_child_family_integrity('product_id', 'public.market_products');

drop trigger if exists trg_meal_plans_family_integrity on public.meal_plans;
create trigger trg_meal_plans_family_integrity
before insert or update of family_id, cook_member_id on public.meal_plans
for each row execute function public.enforce_child_family_integrity('cook_member_id', 'public.family_members');

drop trigger if exists trg_meal_plan_members_family_integrity on public.meal_plan_members;
create trigger trg_meal_plan_members_family_integrity
before insert or update of family_id, meal_plan_id, member_id on public.meal_plan_members
for each row execute function public.enforce_child_family_integrity('meal_plan_id', 'public.meal_plans', 'member_id', 'public.family_members');

drop trigger if exists trg_meal_plan_items_family_integrity on public.meal_plan_items;
create trigger trg_meal_plan_items_family_integrity
before insert or update of family_id, meal_plan_id, product_id on public.meal_plan_items
for each row execute function public.enforce_child_family_integrity('meal_plan_id', 'public.meal_plans', 'product_id', 'public.market_products');

drop trigger if exists trg_shopping_lists_family_integrity on public.shopping_lists;
create trigger trg_shopping_lists_family_integrity
before insert or update of family_id, converted_market_purchase_id on public.shopping_lists
for each row execute function public.enforce_child_family_integrity('converted_market_purchase_id', 'public.market_purchases');

drop trigger if exists trg_shopping_list_items_family_integrity on public.shopping_list_items;
create trigger trg_shopping_list_items_family_integrity
before insert or update of family_id, shopping_list_id, product_id, converted_to_market_item_id on public.shopping_list_items
for each row execute function public.enforce_child_family_integrity('shopping_list_id', 'public.shopping_lists', 'product_id', 'public.market_products', 'converted_to_market_item_id', 'public.market_purchase_items');

-- 3) Índices para mejorar pantallas pesadas: dashboard, proyecciones, insights y reportes.
create index if not exists income_entries_family_date_idx on public.income_entries (family_id, occurred_on desc);
create index if not exists income_entries_family_month_idx on public.income_entries (family_id, monthly_period desc);
create index if not exists income_entries_family_category_idx on public.income_entries (family_id, category_id);

create index if not exists expense_entries_family_date_idx on public.expense_entries (family_id, occurred_on desc);
create index if not exists expense_entries_family_month_source_idx on public.expense_entries (family_id, monthly_period desc, source_module);
create index if not exists expense_entries_family_category_idx on public.expense_entries (family_id, category_id);

create index if not exists manual_invoices_family_date_idx on public.manual_invoices (family_id, invoice_date desc);
create index if not exists manual_invoices_family_vendor_idx on public.manual_invoices (family_id, vendor);

create index if not exists market_periods_family_dates_idx on public.market_periods (family_id, starts_on desc, ends_on desc);
create index if not exists market_periods_family_status_idx on public.market_periods (family_id, status);
create index if not exists market_purchases_family_date_idx on public.market_purchases (family_id, purchased_on desc);
create index if not exists market_purchases_family_period_idx on public.market_purchases (family_id, market_period_id, purchased_on desc);
create index if not exists market_purchases_family_vendor_idx on public.market_purchases (family_id, vendor);
create index if not exists market_purchase_items_family_purchase_idx on public.market_purchase_items (family_id, market_purchase_id);
create index if not exists market_purchase_items_family_product_idx on public.market_purchase_items (family_id, product_id, unit);
create index if not exists market_purchase_items_family_name_unit_idx on public.market_purchase_items (family_id, product_name, unit);

create index if not exists stock_items_family_active_idx on public.stock_items (family_id, is_active);
create index if not exists stock_items_family_low_stock_idx on public.stock_items (family_id, is_active, quantity, min_quantity);

create index if not exists car_expenses_family_vehicle_date_idx on public.car_expenses (family_id, vehicle_id, occurred_on desc);
create index if not exists car_expenses_family_category_date_idx on public.car_expenses (family_id, category, occurred_on desc);

create index if not exists debts_family_type_status_idx on public.debts (family_id, debt_type, status);
create index if not exists debt_payments_family_debt_date_idx on public.debt_payments (family_id, debt_id, paid_on desc);
create index if not exists assets_family_type_status_idx on public.assets (family_id, asset_type, status);

create index if not exists meal_plans_family_month_idx on public.meal_plans (family_id, planned_on desc);
create index if not exists shopping_lists_family_status_period_idx on public.shopping_lists (family_id, status, period_start desc);
create index if not exists shopping_list_items_family_purchase_state_idx on public.shopping_list_items (family_id, shopping_list_id, is_purchased, converted_to_market_item_id);

-- 4) Checks defensivos para datos nuevos. NOT VALID no fuerza validación histórica, pero sí protege nuevos registros.
alter table public.families drop constraint if exists families_name_not_blank;
alter table public.families add constraint families_name_not_blank check (length(btrim(name)) > 0) not valid;

alter table public.family_members drop constraint if exists family_members_full_name_not_blank;
alter table public.family_members add constraint family_members_full_name_not_blank check (length(btrim(full_name)) > 0) not valid;

alter table public.categories drop constraint if exists categories_name_not_blank;
alter table public.categories add constraint categories_name_not_blank check (length(btrim(name)) > 0) not valid;

alter table public.market_products drop constraint if exists market_products_name_not_blank;
alter table public.market_products add constraint market_products_name_not_blank check (length(btrim(name)) > 0) not valid;

alter table public.market_purchase_items drop constraint if exists market_purchase_items_product_name_not_blank;
alter table public.market_purchase_items add constraint market_purchase_items_product_name_not_blank check (length(btrim(product_name)) > 0 and length(btrim(unit)) > 0) not valid;

alter table public.stock_items drop constraint if exists stock_items_product_name_unit_not_blank;
alter table public.stock_items add constraint stock_items_product_name_unit_not_blank check (length(btrim(product_name)) > 0 and length(btrim(unit)) > 0) not valid;

alter table public.shopping_lists drop constraint if exists shopping_lists_name_not_blank;
alter table public.shopping_lists add constraint shopping_lists_name_not_blank check (length(btrim(name)) > 0) not valid;

alter table public.shopping_list_items drop constraint if exists shopping_list_items_product_name_unit_not_blank;
alter table public.shopping_list_items add constraint shopping_list_items_product_name_unit_not_blank check (length(btrim(product_name)) > 0 and length(btrim(unit)) > 0) not valid;

alter table public.meal_plans drop constraint if exists meal_plans_title_not_blank;
alter table public.meal_plans add constraint meal_plans_title_not_blank check (length(btrim(title)) > 0) not valid;

alter table public.financial_goals drop constraint if exists financial_goals_name_not_blank;
alter table public.financial_goals add constraint financial_goals_name_not_blank check (length(btrim(name)) > 0) not valid;

-- 5) RLS explícito en tablas actuales. Idempotente y seguro si ya estaba activo.
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
alter table public.car_vehicles enable row level security;
alter table public.car_expenses enable row level security;
alter table public.car_reminders enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;
alter table public.assets enable row level security;
alter table public.financial_goals enable row level security;
alter table public.goal_contributions enable row level security;
alter table public.nutrition_profiles enable row level security;
alter table public.product_nutrition enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_members enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
