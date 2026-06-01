"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { MarketProduct } from "../types";

export function StockItemForm({ familyId, products }: { familyId: string; products: MarketProduct[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const selectedProduct = products.find((product) => product.id === selectedProductId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const productId = String(formData.get("product_id") ?? "");
    const productName = String(formData.get("product_name") ?? "").trim();
    const categoryName = String(formData.get("category_name") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();
    const quantity = Number(formData.get("quantity"));
    const minQuantity = Number(formData.get("min_quantity") || 0);

    if (!productName) {
      setError("Escribe el nombre del producto o selecciona un producto maestro.");
      setLoading(false);
      return;
    }

    if (!unit) {
      setError("Escribe la unidad del stock: bolsa, kg, litro, unidad, etc.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(quantity) || quantity < 0) {
      setError("El stock inicial no puede ser negativo.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(minQuantity) || minQuantity < 0) {
      setError("El stock mínimo no puede ser negativo.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: existing } = await supabase
        .from("stock_items")
        .select("id")
        .eq("family_id", familyId)
        .eq("product_name", productName)
        .eq("unit", unit)
        .maybeSingle();

      if (existing?.id) {
        setError("Ya existe un stock para ese producto y unidad. Usa movimientos para ajustarlo.");
        setLoading(false);
        return;
      }

      const { data: stockItem, error: stockError } = await supabase
        .from("stock_items")
        .insert({
          family_id: familyId,
          product_id: productId || null,
          product_name: productName,
          category_name: categoryName || null,
          unit,
          quantity,
          min_quantity: minQuantity,
        })
        .select("id")
        .single();

      if (stockError) throw stockError;

      const { error: movementError } = await supabase.from("stock_movements").insert({
        family_id: familyId,
        stock_item_id: stockItem.id,
        movement_type: "initial",
        quantity_delta: quantity,
        quantity_after: quantity,
        notes: "Stock inicial registrado manualmente.",
        occurred_on: new Date().toISOString().slice(0, 10),
      });

      if (movementError) throw movementError;

      form.reset();
      setSelectedProductId("");
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear el stock inicial."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="stock-product-id">Producto maestro opcional</label>
        <Select id="stock-product-id" name="product_id" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
          <option value="">Producto libre</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="stock-product-name">Producto</label>
          <Input id="stock-product-name" name="product_name" placeholder="Ej.: Leche" defaultValue={selectedProduct?.name ?? ""} key={`stock-name-${selectedProductId}`} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="stock-category-name">Categoría</label>
          <Input id="stock-category-name" name="category_name" placeholder="Ej.: Lácteos" defaultValue={selectedProduct?.default_category ?? ""} key={`stock-category-${selectedProductId}`} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="stock-quantity">Stock actual</label>
          <Input id="stock-quantity" name="quantity" type="number" min="0" step="0.001" placeholder="10" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="stock-unit">Unidad</label>
          <Input id="stock-unit" name="unit" placeholder="bolsa, kg, unidad" defaultValue={selectedProduct?.default_unit ?? ""} key={`stock-unit-${selectedProductId}`} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="stock-min">Stock mínimo</label>
          <Input id="stock-min" name="min_quantity" type="number" min="0" step="0.001" placeholder="2" />
        </div>
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Crear stock inicial"}</Button>
    </form>
  );
}
