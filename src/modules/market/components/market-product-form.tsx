"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export function MarketProductForm({ familyId }: { familyId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const defaultCategory = String(formData.get("default_category") ?? "").trim();
    const defaultUnit = String(formData.get("default_unit") ?? "").trim();
    const isStockable = formData.get("is_stockable") === "on";

    if (!name) {
      setError("Escribe el nombre del producto maestro.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("market_products").insert({
        family_id: familyId,
        name,
        default_category: defaultCategory || null,
        default_unit: defaultUnit || null,
        is_stockable: isStockable,
      });

      if (error) throw error;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear el producto maestro."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="market-product-name">Producto</label>
          <Input id="market-product-name" name="name" placeholder="Ej.: Leche" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="market-product-category">Categoría base</label>
          <Input id="market-product-category" name="default_category" placeholder="Ej.: Lácteos" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="market-product-unit">Unidad base</label>
          <Input id="market-product-unit" name="default_unit" placeholder="Ej.: bolsa, kg, litro" />
        </div>
      </div>
      <label className="flex items-start gap-2 rounded-xl border p-3 text-sm">
        <input name="is_stockable" type="checkbox" defaultChecked className="mt-0.5 h-4 w-4" />
        <span>Este producto será inventariable cuando implementemos Stock en casa.</span>
      </label>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Crear producto maestro"}</Button>
    </form>
  );
}
