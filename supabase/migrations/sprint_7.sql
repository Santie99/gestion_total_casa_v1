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
