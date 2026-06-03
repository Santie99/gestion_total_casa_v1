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
