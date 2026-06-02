-- Sprint 6 — Carro operativo base
-- Ejecutar después de sprint_5.sql.

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
