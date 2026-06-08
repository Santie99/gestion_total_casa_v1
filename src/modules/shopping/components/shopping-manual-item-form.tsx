"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { MarketProduct } from "@/modules/market/types";
import type { ShoppingList } from "../types";

export function ShoppingManualItemForm({ familyId, lists, products }: { familyId: string; lists: ShoppingList[]; products: MarketProduct[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const selectedProduct = products.find((product) => product.id === selectedProductId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const shoppingListId = String(formData.get("shopping_list_id") ?? "");
    const productId = String(formData.get("product_id") ?? "");
    const productName = String(formData.get("product_name") ?? "").trim();
    const categoryName = String(formData.get("category_name") ?? "").trim();
    const quantity = Number(formData.get("suggested_purchase_quantity"));
    const unit = String(formData.get("unit") ?? "").trim();
    const preferredVendor = String(formData.get("preferred_vendor") ?? "").trim();
    const priority = String(formData.get("priority") ?? "normal");
    const notes = String(formData.get("notes") ?? "").trim();

    if (!shoppingListId) {
      setError("Selecciona una lista de compras.");
      setLoading(false);
      return;
    }

    if (!productName) {
      setError("Escribe el producto o selecciona un producto maestro.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      setError("La cantidad a comprar debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    if (!unit) {
      setError("Escribe la unidad: unidad, kg, libra, bolsa, litro, etc.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("shopping_list_items").insert({
        family_id: familyId,
        shopping_list_id: shoppingListId,
        product_id: productId || null,
        product_name: productName,
        category_name: categoryName || null,
        needed_quantity: null,
        current_stock_quantity: null,
        suggested_purchase_quantity: quantity,
        unit,
        source: "manual",
        priority: ["low", "normal", "high"].includes(priority) ? priority : "normal",
        preferred_vendor: preferredVendor || null,
        notes: notes || null,
      });

      if (insertError) throw insertError;

      form.reset();
      setSelectedProductId("");
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo agregar el producto manual."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="manual-list-id">Lista</label>
        <Select id="manual-list-id" name="shopping_list_id" defaultValue="" required>
          <option value="">Selecciona lista</option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>{list.name} · {list.period_start} a {list.period_end}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="manual-product-id">Producto maestro opcional</label>
        <Select id="manual-product-id" name="product_id" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
          <option value="">Producto libre</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="manual-product-name">Producto</label>
          <Input id="manual-product-name" name="product_name" defaultValue={selectedProduct?.name ?? ""} key={`name-${selectedProductId}`} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="manual-category-name">Categoría</label>
          <Input id="manual-category-name" name="category_name" defaultValue={selectedProduct?.default_category ?? ""} key={`category-${selectedProductId}`} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="manual-quantity">Cantidad a comprar</label>
          <Input id="manual-quantity" name="suggested_purchase_quantity" type="number" min="0.001" step="0.001" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="manual-unit">Unidad</label>
          <Input id="manual-unit" name="unit" defaultValue={selectedProduct?.default_unit ?? ""} key={`unit-${selectedProductId}`} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="manual-preferred-vendor">Lugar sugerido</label>
          <Input id="manual-preferred-vendor" name="preferred_vendor" placeholder="Ej.: D1, Plaza, Éxito" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="manual-priority">Prioridad</label>
          <Select id="manual-priority" name="priority" defaultValue="normal">
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="manual-notes">Notas</label>
        <Input id="manual-notes" name="notes" placeholder="Ej.: marca preferida, revisar oferta" />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading || lists.length === 0}>{loading ? "Agregando..." : "Agregar producto manual"}</Button>
    </form>
  );
}
