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
