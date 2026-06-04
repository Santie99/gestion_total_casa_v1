export type NutritionGoal = "deficit" | "maintenance" | "surplus" | "recomposition";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

export type NutritionProfile = {
  id: string;
  family_id: string;
  member_id: string;
  daily_calories: number;
  daily_protein: number;
  goal: NutritionGoal;
  meals_per_day: number;
  notes: string | null;
  created_at: string;
  family_members?: { full_name: string } | null;
};

export type ProductNutrition = {
  id: string;
  family_id: string;
  product_id: string;
  serving_quantity: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
  created_at: string;
  market_products?: { name: string; default_category: string | null; default_unit: string | null } | null;
};

export type MealPlan = {
  id: string;
  family_id: string;
  planned_on: string;
  meal_type: MealType;
  title: string;
  preparation_notes: string | null;
  cook_member_id: string | null;
  created_at: string;
  cook_member?: { full_name: string } | null;
};

export type MealPlanMember = {
  id: string;
  family_id: string;
  meal_plan_id: string;
  member_id: string;
  target_calories: number | null;
  target_protein: number | null;
  created_at: string;
  family_members?: { full_name: string } | null;
};

export type MealPlanItem = {
  id: string;
  family_id: string;
  meal_plan_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit: string;
  estimated_calories: number | null;
  estimated_protein: number | null;
  estimated_carbs: number | null;
  estimated_fat: number | null;
  notes: string | null;
  created_at: string;
  market_products?: { name: string; default_category: string | null; default_unit: string | null } | null;
};

export type MealPlanWithDetails = MealPlan & {
  members: MealPlanMember[];
  items: MealPlanItem[];
};

export type DailyMenuSummary = {
  plannedOn: string;
  mealCount: number;
  estimatedCalories: number;
  estimatedProtein: number;
};
