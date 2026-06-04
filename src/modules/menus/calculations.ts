import type { DailyMenuSummary, MealPlanItem, MealPlanWithDetails, MealType, NutritionGoal } from "./types";

export function getNutritionGoalLabel(goal: NutritionGoal) {
  const labels: Record<NutritionGoal, string> = {
    deficit: "Déficit",
    maintenance: "Mantenimiento",
    surplus: "Superávit",
    recomposition: "Recomposición",
  };

  return labels[goal];
}

export function getMealTypeLabel(type: MealType) {
  const labels: Record<MealType, string> = {
    breakfast: "Desayuno",
    lunch: "Almuerzo",
    dinner: "Cena",
    snack: "Snack",
    other: "Otro",
  };

  return labels[type];
}

export function sumMealItemCalories(items: Pick<MealPlanItem, "estimated_calories">[]) {
  return items.reduce((total, item) => total + Number(item.estimated_calories ?? 0), 0);
}

export function sumMealItemProtein(items: Pick<MealPlanItem, "estimated_protein">[]) {
  return items.reduce((total, item) => total + Number(item.estimated_protein ?? 0), 0);
}

export function getDailyMenuSummaries(plans: MealPlanWithDetails[]): DailyMenuSummary[] {
  const grouped = plans.reduce<Record<string, DailyMenuSummary>>((acc, plan) => {
    const current = acc[plan.planned_on] ?? {
      plannedOn: plan.planned_on,
      mealCount: 0,
      estimatedCalories: 0,
      estimatedProtein: 0,
    };

    current.mealCount += 1;
    current.estimatedCalories += sumMealItemCalories(plan.items);
    current.estimatedProtein += sumMealItemProtein(plan.items);
    acc[plan.planned_on] = current;

    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => a.plannedOn.localeCompare(b.plannedOn));
}

export function getMealPlanTotals(plan: MealPlanWithDetails) {
  return {
    calories: sumMealItemCalories(plan.items),
    protein: sumMealItemProtein(plan.items),
  };
}

export function estimateNutritionFromServing(params: {
  quantity: number;
  unit: string;
  servingQuantity: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number | null;
  fat: number | null;
}) {
  const unitMatches = params.unit.trim().toLowerCase() === params.servingUnit.trim().toLowerCase();
  if (!unitMatches || params.servingQuantity <= 0 || params.quantity <= 0) {
    return { calories: null, protein: null, carbs: null, fat: null };
  }

  const factor = params.quantity / params.servingQuantity;
  return {
    calories: params.calories * factor,
    protein: params.protein * factor,
    carbs: params.carbs === null ? null : params.carbs * factor,
    fat: params.fat === null ? null : params.fat * factor,
  };
}
