-- Gestión Total Casa — Sprint 3 migration
-- Ejecutar después del schema de Sprint 1/2 si tu proyecto ya existe en Supabase.

alter table public.family_members
alter column user_id drop not null;

alter table public.family_members
add column if not exists is_active boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'family_members'
      and policyname = 'Family members can create internal members'
  ) then
    create policy "Family members can create internal members" on public.family_members
    for insert to authenticated
    with check (user_id is null and family_id in (select public.user_family_ids()));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'family_members'
      and policyname = 'Family members can update members in their families'
  ) then
    create policy "Family members can update members in their families" on public.family_members
    for update to authenticated
    using (family_id in (select public.user_family_ids()))
    with check (family_id in (select public.user_family_ids()));
  end if;
end $$;
