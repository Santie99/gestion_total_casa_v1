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
