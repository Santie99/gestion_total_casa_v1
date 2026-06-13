export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toDateInputValue } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/modules/household/queries";
import type { ManualInvoice, MarketPeriod, MarketProduct, StockItem } from "@/modules/market/types";
import type { MealPlan, MealPlanItem, MealPlanMember, MealPlanWithDetails } from "@/modules/menus/types";
import { getShoppingListStats } from "@/modules/shopping/calculations";
import { ShoppingListGeneratorForm } from "@/modules/shopping/components/shopping-list-generator-form";
import { ShoppingListView } from "@/modules/shopping/components/shopping-list-view";
import { ShoppingManualItemForm } from "@/modules/shopping/components/shopping-manual-item-form";
import { ShoppingSummaryCard } from "@/modules/shopping/components/shopping-summary-card";
import type { ShoppingList, ShoppingListItem, ShoppingListWithItems } from "@/modules/shopping/types";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default async function ShoppingPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const today = new Date();
  const rangeStart = toDateInputValue(today);
  const rangeEnd = toDateInputValue(addDays(today, 30));

  const [
    { data: mealPlansData },
    { data: stockItemsData },
    { data: productsData },
    { data: shoppingListsData },
    { data: marketPeriodsData },
    { data: invoicesData },
  ] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("id, family_id, planned_on, meal_type, title, preparation_notes, cook_member_id, created_at, cook_member:family_members(full_name)")
      .eq("family_id", context.familyId)
      .gte("planned_on", rangeStart)
      .lte("planned_on", rangeEnd)
      .order("planned_on", { ascending: true }),
    supabase
      .from("stock_items")
      .select("id, family_id, product_id, product_name, category_name, unit, quantity, min_quantity, is_active, last_updated_at, created_at")
      .eq("family_id", context.familyId)
      .eq("is_active", true)
      .order("product_name", { ascending: true }),
    supabase
      .from("market_products")
      .select("id, family_id, name, default_category, default_unit, is_active, is_stockable, created_at")
      .eq("family_id", context.familyId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("shopping_lists")
      .select("id, family_id, name, period_start, period_end, status, notes, converted_market_purchase_id, converted_at, created_at")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("market_periods")
      .select("id, family_id, name, starts_on, ends_on, status, notes, created_at")
      .eq("family_id", context.familyId)
      .order("starts_on", { ascending: false }),
    supabase
      .from("manual_invoices")
      .select("id, family_id, invoice_code, invoice_date, vendor, notes, created_at")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const mealPlans = (mealPlansData ?? []) as unknown as MealPlan[];
  const mealPlanIds = mealPlans.map((plan) => plan.id);
  const [{ data: mealPlanMembersData }, { data: mealPlanItemsData }, { data: shoppingItemsData }] = await Promise.all([
    mealPlanIds.length
      ? supabase
          .from("meal_plan_members")
          .select("id, family_id, meal_plan_id, member_id, target_calories, target_protein, created_at, family_members(full_name)")
          .eq("family_id", context.familyId)
          .in("meal_plan_id", mealPlanIds)
      : Promise.resolve({ data: [] }),
    mealPlanIds.length
      ? supabase
          .from("meal_plan_items")
          .select("id, family_id, meal_plan_id, product_id, product_name, quantity, unit, estimated_calories, estimated_protein, estimated_carbs, estimated_fat, notes, created_at, market_products(name, default_category, default_unit)")
          .eq("family_id", context.familyId)
          .in("meal_plan_id", mealPlanIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    (shoppingListsData ?? []).length
      ? supabase
          .from("shopping_list_items")
          .select("id, family_id, shopping_list_id, product_id, product_name, category_name, needed_quantity, current_stock_quantity, suggested_purchase_quantity, actual_purchase_quantity, actual_unit, actual_total_price, converted_to_market_item_id, preferred_vendor, unit, source, priority, is_purchased, notes, created_at")
          .eq("family_id", context.familyId)
          .in("shopping_list_id", (shoppingListsData ?? []).map((list) => list.id))
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const mealPlanMembers = (mealPlanMembersData ?? []) as unknown as MealPlanMember[];
  const mealPlanItems = (mealPlanItemsData ?? []) as unknown as MealPlanItem[];
  const stockItems = (stockItemsData ?? []) as StockItem[];
  const products = (productsData ?? []) as MarketProduct[];
  const marketPeriods = (marketPeriodsData ?? []) as MarketPeriod[];
  const invoices = (invoicesData ?? []) as ManualInvoice[];
  const shoppingLists = (shoppingListsData ?? []) as ShoppingList[];
  const shoppingItems = (shoppingItemsData ?? []) as ShoppingListItem[];

  const membersByPlan = mealPlanMembers.reduce<Record<string, MealPlanMember[]>>((acc, member) => {
    acc[member.meal_plan_id] = [...(acc[member.meal_plan_id] ?? []), member];
    return acc;
  }, {});
  const itemsByPlan = mealPlanItems.reduce<Record<string, MealPlanItem[]>>((acc, item) => {
    acc[item.meal_plan_id] = [...(acc[item.meal_plan_id] ?? []), item];
    return acc;
  }, {});
  const plansWithDetails: MealPlanWithDetails[] = mealPlans.map((plan) => ({
    ...plan,
    members: membersByPlan[plan.id] ?? [],
    items: itemsByPlan[plan.id] ?? [],
  }));

  const itemsByList = shoppingItems.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
    acc[item.shopping_list_id] = [...(acc[item.shopping_list_id] ?? []), item];
    return acc;
  }, {});
  const listsWithItems: ShoppingListWithItems[] = shoppingLists.map((list) => ({ ...list, items: itemsByList[list.id] ?? [] }));
  const stats = getShoppingListStats(listsWithItems);
  const lowStockCount = stockItems.filter((item) => Number(item.min_quantity ?? 0) > 0 && Number(item.quantity ?? 0) <= Number(item.min_quantity ?? 0)).length;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-sm sm:p-7">
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Compras</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70 sm:text-base">
          Crea listas generales, agrupa productos por lugar de compra y convierte solo los productos comprados de cada proveedor en compras reales de Mercado con stock automático.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <div className="flex min-w-full gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-[230px] flex-1 sm:min-w-0"><ShoppingSummaryCard title="Listas activas" value={String(stats.activeLists)} description="Listas en borrador o activas." /></div>
          <div className="min-w-[230px] flex-1 sm:min-w-0"><ShoppingSummaryCard title="Pendientes" value={String(stats.pendingItems)} description="Productos aún no marcados como comprados." /></div>
          <div className="min-w-[230px] flex-1 sm:min-w-0"><ShoppingSummaryCard title="Prioridad alta" value={String(stats.highPriorityItems)} description="Faltantes críticos por menús o stock agotado." /></div>
          <div className="min-w-[230px] flex-1 sm:min-w-0"><ShoppingSummaryCard title="Stock bajo" value={String(lowStockCount)} description="Productos del inventario en o debajo del mínimo." /></div>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 xl:overflow-visible">
        <div className="flex gap-4 xl:grid xl:grid-cols-[380px_1fr]">
          <div className="w-[86vw] shrink-0 space-y-4 sm:w-[420px] xl:w-auto xl:shrink">
            <Card className="rounded-[1.75rem]">
              <CardHeader>
                <CardTitle>Crear lista</CardTitle>
                <CardDescription>Genera sugerencias automáticas o crea una lista manual vacía para cargar productos desde cero.</CardDescription>
              </CardHeader>
              <CardContent>
                <ShoppingListGeneratorForm familyId={context.familyId} plans={plansWithDetails} stockItems={stockItems} />
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem]">
              <CardHeader>
                <CardTitle>Agregar producto</CardTitle>
                <CardDescription>Agrega compras prioritarias, esporádicas o productos no cubiertos por menús. Puedes asignar lugar sugerido por producto.</CardDescription>
              </CardHeader>
              <CardContent>
                <ShoppingManualItemForm familyId={context.familyId} lists={shoppingLists.filter((list) => list.status !== "completed")} products={products} />
              </CardContent>
            </Card>
          </div>

          <Card className="w-[92vw] shrink-0 rounded-[1.75rem] sm:w-[620px] xl:w-auto xl:shrink">
            <CardHeader>
              <CardTitle>Listas de compras</CardTitle>
              <CardDescription>Agrupa por lugar, marca productos comprados, registra cantidades/precios reales y convierte por proveedor o grupo.</CardDescription>
            </CardHeader>
            <CardContent>
              <ShoppingListView familyId={context.familyId} lists={listsWithItems} marketPeriods={marketPeriods} invoices={invoices} products={products} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
