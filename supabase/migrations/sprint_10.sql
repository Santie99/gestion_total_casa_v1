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
