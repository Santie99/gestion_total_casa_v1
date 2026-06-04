"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { MarketProduct } from "@/modules/market/types";
import { estimateNutritionFromServing, getMealTypeLabel } from "../calculations";
import type { MealPlan, ProductNutrition } from "../types";

export function MealItemForm({
  familyId,
  mealPlans,
  products,
  nutritionRows,
}: {
  familyId: string;
  mealPlans: MealPlan[];
  products: MarketProduct[];
  nutritionRows: ProductNutrition[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");

  const nutritionByProduct = useMemo(() => new Map(nutritionRows.map((row) => [row.product_id, row])), [nutritionRows]);
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedNutrition = selectedProductId ? nutritionByProduct.get(selectedProductId) : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const mealPlanId = String(formData.get("meal_plan_id") ?? "");
    const productId = String(formData.get("product_id") ?? "") || null;
    const productName = String(formData.get("product_name") ?? "").trim();
    const quantity = Number(formData.get("quantity"));
    const unit = String(formData.get("unit") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!mealPlanId) {
      setError("Selecciona un menú antes de agregar productos.");
      setLoading(false);
      return;
    }

    if (!productName) {
      setError("Escribe el producto o selecciona un producto maestro.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      setError("La cantidad debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    if (!unit) {
      setError("Escribe la unidad: g, unidad, bolsa, taza, etc.");
      setLoading(false);
      return;
    }

    const nutrition = productId ? nutritionByProduct.get(productId) : null;
    const estimated = nutrition
      ? estimateNutritionFromServing({
          quantity,
          unit,
          servingQuantity: Number(nutrition.serving_quantity),
          servingUnit: nutrition.serving_unit,
          calories: Number(nutrition.calories),
          protein: Number(nutrition.protein),
          carbs: nutrition.carbs === null ? null : Number(nutrition.carbs),
          fat: nutrition.fat === null ? null : Number(nutrition.fat),
        })
      : { calories: null, protein: null, carbs: null, fat: null };

    try {
      const supabase = createClient();
      const { error } = await supabase.from("meal_plan_items").insert({
        family_id: familyId,
        meal_plan_id: mealPlanId,
        product_id: productId,
        product_name: productName,
        quantity,
        unit,
        estimated_calories: estimated.calories,
        estimated_protein: estimated.protein,
        estimated_carbs: estimated.carbs,
        estimated_fat: estimated.fat,
        notes,
      });

      if (error) throw error;

      form.reset();
      setSelectedProductId("");
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo agregar el producto al menú."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="meal-plan-id">Menú</label>
        <Select id="meal-plan-id" name="meal_plan_id" defaultValue="" required>
          <option value="">Selecciona un menú</option>
          {mealPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>{plan.planned_on} · {getMealTypeLabel(plan.meal_type)} · {plan.title}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="meal-product-id">Producto maestro opcional</label>
        <Select id="meal-product-id" name="product_id" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
          <option value="">Producto libre</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          {selectedNutrition ? `Base nutricional: ${selectedNutrition.serving_quantity} ${selectedNutrition.serving_unit}. Si usas otra unidad no se estimará automáticamente.` : "Selecciona un producto con datos nutricionales para calcular calorías y proteína."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="meal-product-name">Producto</label>
          <Input id="meal-product-name" name="product_name" placeholder="Ej.: Bananos" defaultValue={selectedProduct?.name ?? ""} key={`name-${selectedProductId}`} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="meal-unit">Unidad</label>
          <Input id="meal-unit" name="unit" placeholder="g, unidad, bolsa" defaultValue={selectedNutrition?.serving_unit ?? selectedProduct?.default_unit ?? ""} key={`unit-${selectedProductId}`} required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="meal-quantity">Cantidad total usada</label>
        <Input id="meal-quantity" name="quantity" type="number" min="0.001" step="0.001" placeholder="500" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="meal-item-notes">Notas</label>
        <Textarea id="meal-item-notes" name="notes" placeholder="Ej.: cantidad total para todos los miembros incluidos." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading || mealPlans.length === 0}>{loading ? "Guardando..." : "Agregar al menú"}</Button>
    </form>
  );
}
