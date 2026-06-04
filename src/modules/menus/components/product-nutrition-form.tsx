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
import type { ProductNutrition } from "../types";

export function ProductNutritionForm({
  familyId,
  products,
  nutritionRows,
}: {
  familyId: string;
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
    const productId = String(formData.get("product_id") ?? "");
    const servingQuantity = Number(formData.get("serving_quantity"));
    const servingUnit = String(formData.get("serving_unit") ?? "").trim();
    const calories = Number(formData.get("calories"));
    const protein = Number(formData.get("protein"));
    const carbsRaw = String(formData.get("carbs") ?? "");
    const fatRaw = String(formData.get("fat") ?? "");
    const carbs = carbsRaw === "" ? null : Number(carbsRaw);
    const fat = fatRaw === "" ? null : Number(fatRaw);
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!productId) {
      setError("Selecciona un producto maestro.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(servingQuantity) || servingQuantity <= 0) {
      setError("La cantidad base debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    if (!servingUnit) {
      setError("Escribe la unidad base: unidad, g, kg, bolsa, litro, etc.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(calories) || calories < 0 || Number.isNaN(protein) || protein < 0) {
      setError("Calorías y proteína deben ser valores válidos iguales o mayores que cero.");
      setLoading(false);
      return;
    }

    if ((carbs !== null && (Number.isNaN(carbs) || carbs < 0)) || (fat !== null && (Number.isNaN(fat) || fat < 0))) {
      setError("Carbohidratos y grasas deben ser valores válidos iguales o mayores que cero.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("product_nutrition").upsert(
        {
          family_id: familyId,
          product_id: productId,
          serving_quantity: servingQuantity,
          serving_unit: servingUnit,
          calories,
          protein,
          carbs,
          fat,
          notes,
        },
        { onConflict: "product_id" },
      );

      if (error) throw error;

      form.reset();
      setSelectedProductId("");
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo guardar la información nutricional."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="nutrition-product">Producto maestro</label>
        <Select id="nutrition-product" name="product_id" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} required>
          <option value="">Selecciona un producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">{selectedNutrition ? "Este producto ya tiene datos nutricionales. Guardar actualizará la base." : selectedProduct ? `Unidad sugerida: ${selectedProduct.default_unit ?? "sin unidad"}` : "Primero crea productos maestros en Mercado."}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="serving-quantity">Cantidad base</label>
          <Input id="serving-quantity" name="serving_quantity" type="number" min="0.001" step="0.001" placeholder="100" defaultValue={selectedNutrition?.serving_quantity ?? ""} key={`qty-${selectedProductId}`} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="serving-unit">Unidad base</label>
          <Input id="serving-unit" name="serving_unit" placeholder="g, unidad, bolsa" defaultValue={selectedNutrition?.serving_unit ?? selectedProduct?.default_unit ?? ""} key={`unit-${selectedProductId}`} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="calories">Calorías</label>
          <Input id="calories" name="calories" type="number" min="0" step="0.1" placeholder="89" defaultValue={selectedNutrition?.calories ?? ""} key={`cal-${selectedProductId}`} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="protein">Proteína (g)</label>
          <Input id="protein" name="protein" type="number" min="0" step="0.1" placeholder="1.1" defaultValue={selectedNutrition?.protein ?? ""} key={`pro-${selectedProductId}`} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="carbs">Carbohidratos (g)</label>
          <Input id="carbs" name="carbs" type="number" min="0" step="0.1" placeholder="Opcional" defaultValue={selectedNutrition?.carbs ?? ""} key={`carb-${selectedProductId}`} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="fat">Grasas (g)</label>
          <Input id="fat" name="fat" type="number" min="0" step="0.1" placeholder="Opcional" defaultValue={selectedNutrition?.fat ?? ""} key={`fat-${selectedProductId}`} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="nutrition-notes-product">Notas</label>
        <Textarea id="nutrition-notes-product" name="notes" placeholder="Fuente del dato o aclaración de porción." defaultValue={selectedNutrition?.notes ?? ""} key={`notes-${selectedProductId}`} />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading || products.length === 0}>{loading ? "Guardando..." : "Guardar nutrición"}</Button>
    </form>
  );
}
