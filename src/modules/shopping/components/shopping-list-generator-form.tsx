"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/dates";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { StockItem } from "@/modules/market/types";
import type { MealPlanWithDetails } from "@/modules/menus/types";
import { getLowStockSuggestions, getShoppingSuggestionsFromMenus, mergeShoppingSuggestions } from "../calculations";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function ShoppingListGeneratorForm({
  familyId,
  plans,
  stockItems,
}: {
  familyId: string;
  plans: MealPlanWithDetails[];
  stockItems: StockItem[];
}) {
  const router = useRouter();
  const today = toDateInputValue(new Date());
  const defaultEnd = toDateInputValue(addDays(new Date(), 14));
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [includeLowStock, setIncludeLowStock] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const previewSuggestions = useMemo(() => {
    const menuSuggestions = getShoppingSuggestionsFromMenus({ plans, stockItems, periodStart, periodEnd });
    const lowStockSuggestions = includeLowStock ? getLowStockSuggestions(stockItems) : [];
    return mergeShoppingSuggestions([...menuSuggestions, ...lowStockSuggestions]);
  }, [includeLowStock, periodEnd, periodStart, plans, stockItems]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!name) {
      setError("Escribe un nombre para la lista de compras.");
      setLoading(false);
      return;
    }

    if (periodEnd < periodStart) {
      setError("La fecha final no puede ser anterior a la inicial.");
      setLoading(false);
      return;
    }

    if (!previewSuggestions.length) {
      setError("No hay compras sugeridas para este rango. Revisa menús, stock o agrega compras manuales después de crear una lista.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: list, error: listError } = await supabase
        .from("shopping_lists")
        .insert({
          family_id: familyId,
          name,
          period_start: periodStart,
          period_end: periodEnd,
          status: "draft",
          notes: notes || null,
        })
        .select("id")
        .single();

      if (listError) throw listError;

      const rows = previewSuggestions.map((suggestion) => ({
        family_id: familyId,
        shopping_list_id: list.id,
        product_id: suggestion.productId,
        product_name: suggestion.productName,
        category_name: suggestion.categoryName,
        needed_quantity: suggestion.neededQuantity,
        current_stock_quantity: suggestion.currentStockQuantity,
        suggested_purchase_quantity: suggestion.suggestedPurchaseQuantity,
        unit: suggestion.unit,
        source: suggestion.source,
        priority: suggestion.priority,
        notes: suggestion.notes,
      }));

      const { error: itemsError } = await supabase.from("shopping_list_items").insert(rows);
      if (itemsError) throw itemsError;

      form.reset();
      setPeriodStart(today);
      setPeriodEnd(defaultEnd);
      setIncludeLowStock(true);
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo generar la lista de compras."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="shopping-list-name">Nombre</label>
        <Input id="shopping-list-name" name="name" placeholder="Ej.: Compras próxima quincena" defaultValue="Compras próxima quincena" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="shopping-period-start">Desde</label>
          <Input id="shopping-period-start" name="period_start" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="shopping-period-end">Hasta</label>
          <Input id="shopping-period-end" name="period_end" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} required />
        </div>
      </div>

      <label className="flex items-start gap-2 rounded-xl border p-3 text-sm">
        <input
          type="checkbox"
          checked={includeLowStock}
          onChange={(event) => setIncludeLowStock(event.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>Incluir productos con stock bajo o agotado, aunque no aparezcan en menús.</span>
      </label>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm">
        <p className="font-semibold">Vista previa</p>
        <p className="mt-1 text-muted-foreground">
          {previewSuggestions.length} producto(s) sugeridos. La lista se calcula con menús del rango seleccionado y stock actual.
        </p>
        {previewSuggestions.length ? (
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
            {previewSuggestions.slice(0, 8).map((suggestion) => (
              <div key={`${suggestion.productName}-${suggestion.unit}-${suggestion.source}`} className="flex items-start justify-between gap-3 rounded-xl bg-white p-3">
                <div>
                  <p className="font-medium">{suggestion.productName}</p>
                  <p className="text-xs text-muted-foreground">Necesario {suggestion.neededQuantity} · stock {suggestion.currentStockQuantity} {suggestion.unit}</p>
                </div>
                <p className="text-sm font-semibold">Comprar {suggestion.suggestedPurchaseQuantity} {suggestion.unit}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="shopping-list-notes">Notas</label>
        <Textarea id="shopping-list-notes" name="notes" placeholder="Ej.: revisar precios antes de comprar productos no prioritarios" />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Generando..." : "Generar lista inteligente"}</Button>
    </form>
  );
}
