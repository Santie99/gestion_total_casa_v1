export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toDateInputValue } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/modules/household/queries";
import type { FamilyMember } from "@/modules/household/types";
import type { MarketProduct } from "@/modules/market/types";
import { getDailyMenuSummaries } from "@/modules/menus/calculations";
import { DailyMenuSummaryList } from "@/modules/menus/components/daily-menu-summary-list";
import { MealItemForm } from "@/modules/menus/components/meal-item-form";
import { MealPlanForm } from "@/modules/menus/components/meal-plan-form";
import { MealPlanList } from "@/modules/menus/components/meal-plan-list";
import { MenuSummaryCard } from "@/modules/menus/components/menu-summary-card";
import { NutritionProfileForm } from "@/modules/menus/components/nutrition-profile-form";
import { NutritionProfileList } from "@/modules/menus/components/nutrition-profile-list";
import { ProductNutritionForm } from "@/modules/menus/components/product-nutrition-form";
import { ProductNutritionList } from "@/modules/menus/components/product-nutrition-list";
import type { MealPlan, MealPlanItem, MealPlanMember, MealPlanWithDetails, NutritionProfile, ProductNutrition } from "@/modules/menus/types";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default async function MenusPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const today = new Date();
  const rangeStart = toDateInputValue(today);
  const rangeEnd = toDateInputValue(addDays(today, 14));

  const [
    { data: membersData },
    { data: productsData },
    { data: nutritionProfilesData },
    { data: productNutritionData },
    { data: mealPlansData },
  ] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, family_id, user_id, full_name, role, is_active, created_at")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: true }),
    supabase
      .from("market_products")
      .select("id, family_id, name, default_category, default_unit, is_active, is_stockable, created_at")
      .eq("family_id", context.familyId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("nutrition_profiles")
      .select("id, family_id, member_id, daily_calories, daily_protein, goal, meals_per_day, notes, created_at, family_members(full_name)")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_nutrition")
      .select("id, family_id, product_id, serving_quantity, serving_unit, calories, protein, carbs, fat, notes, created_at, market_products(name, default_category, default_unit)")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("meal_plans")
      .select("id, family_id, planned_on, meal_type, title, preparation_notes, cook_member_id, created_at, cook_member:family_members(full_name)")
      .eq("family_id", context.familyId)
      .gte("planned_on", rangeStart)
      .lte("planned_on", rangeEnd)
      .order("planned_on", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const members = (membersData ?? []) as FamilyMember[];
  const products = (productsData ?? []) as MarketProduct[];
  const nutritionProfiles = (nutritionProfilesData ?? []) as unknown as NutritionProfile[];
  const productNutrition = (productNutritionData ?? []) as unknown as ProductNutrition[];
  const mealPlans = (mealPlansData ?? []) as unknown as MealPlan[];
  const mealPlanIds = mealPlans.map((plan) => plan.id);

  const [{ data: mealPlanMembersData }, { data: mealPlanItemsData }] = mealPlanIds.length
    ? await Promise.all([
        supabase
          .from("meal_plan_members")
          .select("id, family_id, meal_plan_id, member_id, target_calories, target_protein, created_at, family_members(full_name)")
          .eq("family_id", context.familyId)
          .in("meal_plan_id", mealPlanIds),
        supabase
          .from("meal_plan_items")
          .select("id, family_id, meal_plan_id, product_id, product_name, quantity, unit, estimated_calories, estimated_protein, estimated_carbs, estimated_fat, notes, created_at, market_products(name, default_category, default_unit)")
          .eq("family_id", context.familyId)
          .in("meal_plan_id", mealPlanIds)
          .order("created_at", { ascending: true }),
      ])
    : [{ data: [] }, { data: [] }];

  const mealPlanMembers = (mealPlanMembersData ?? []) as unknown as MealPlanMember[];
  const mealPlanItems = (mealPlanItemsData ?? []) as unknown as MealPlanItem[];
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
  const dailySummaries = getDailyMenuSummaries(plansWithDetails);
  const totalPlannedItems = mealPlanItems.length;
  const activeMembersWithProfiles = nutritionProfiles.length;
  const productsWithNutrition = productNutrition.length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 10 · Menús nutricionales base</p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Menús</h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Perfiles nutricionales, base nutricional de productos y planificación familiar de comidas. Esta versión aún no descuenta stock automáticamente.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MenuSummaryCard title="Perfiles" value={`${activeMembersWithProfiles}/${members.filter((member) => member.is_active).length}`} description="Miembros activos con requerimientos configurados." />
        <MenuSummaryCard title="Productos nutridos" value={String(productsWithNutrition)} description="Productos maestros con calorías y proteína." />
        <MenuSummaryCard title="Menús próximos" value={String(plansWithDetails.length)} description="Comidas planeadas para los próximos 14 días." />
        <MenuSummaryCard title="Ítems en menús" value={String(totalPlannedItems)} description="Productos agregados a preparaciones familiares." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil nutricional</CardTitle>
              <CardDescription>Configura kilocalorías, proteína y objetivo por miembro.</CardDescription>
            </CardHeader>
            <CardContent>
              <NutritionProfileForm familyId={context.familyId} members={members} profiles={nutritionProfiles} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perfiles existentes</CardTitle>
              <CardDescription>Base para calcular metas por comida.</CardDescription>
            </CardHeader>
            <CardContent>
              <NutritionProfileList profiles={nutritionProfiles} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Base nutricional</CardTitle>
              <CardDescription>Agrega calorías y macros a productos maestros.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductNutritionForm familyId={context.familyId} products={products} nutritionRows={productNutrition} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos con nutrición</CardTitle>
              <CardDescription>Estos productos pueden estimar menús automáticamente si la unidad coincide.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductNutritionList rows={productNutrition} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crear menú familiar</CardTitle>
                <CardDescription>Una preparación puede servir para varios miembros con metas diferentes.</CardDescription>
              </CardHeader>
              <CardContent>
                <MealPlanForm familyId={context.familyId} members={members} profiles={nutritionProfiles} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agregar producto al menú</CardTitle>
                <CardDescription>La estimación nutricional se calcula si producto y unidad coinciden con la base.</CardDescription>
              </CardHeader>
              <CardContent>
                <MealItemForm familyId={context.familyId} mealPlans={mealPlans} products={products} nutritionRows={productNutrition} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen diario</CardTitle>
              <CardDescription>Calorías y proteína estimadas por día para los próximos 14 días.</CardDescription>
            </CardHeader>
            <CardContent>
              <DailyMenuSummaryList summaries={dailySummaries} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menús familiares próximos</CardTitle>
              <CardDescription>Vista familiar por comida, miembros, productos y preparación para quien cocina.</CardDescription>
            </CardHeader>
            <CardContent>
              <MealPlanList plans={plansWithDetails} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
