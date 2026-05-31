"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { MarketPurchase } from "../types";

export function MarketItemForm({ familyId, purchases }: { familyId: string; purchases: MarketPurchase[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const marketPurchaseId = String(formData.get("market_purchase_id") ?? "");
    const productName = String(formData.get("product_name") ?? "").trim();
    const categoryName = String(formData.get("category_name") ?? "").trim();
    const quantity = Number(formData.get("quantity"));
    const unit = String(formData.get("unit") ?? "").trim();
    const totalPrice = Number(formData.get("total_price"));
    const updatesStock = formData.get("updates_stock") === "on";

    if (!marketPurchaseId || !productName || !quantity || quantity <= 0 || !unit || totalPrice < 0) {
      setError("Completa compra, producto, cantidad, unidad y precio total.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("market_purchase_items").insert({
      family_id: familyId,
      market_purchase_id: marketPurchaseId,
      product_name: productName,
      category_name: categoryName || null,
      quantity,
      unit,
      total_price: totalPrice,
      updates_stock: updatesStock,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    form.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="item-purchase">Compra</label>
        <Select id="item-purchase" name="market_purchase_id" defaultValue="" required>
          <option value="">Selecciona una compra</option>
          {purchases.map((purchase) => (
            <option key={purchase.id} value={purchase.id}>
              {purchase.purchased_on} · {purchase.vendor || "Sin proveedor"} · {purchase.purchase_type === "main" ? "Principal" : "Esporádica"}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-product-name">Producto</label>
          <Input id="item-product-name" name="product_name" placeholder="Ej.: Leche" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-category-name">Categoría</label>
          <Input id="item-category-name" name="category_name" placeholder="Ej.: Lácteos" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-quantity">Cantidad</label>
          <Input id="item-quantity" name="quantity" type="number" min="0.001" step="0.001" placeholder="10" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-unit">Unidad</label>
          <Input id="item-unit" name="unit" placeholder="bolsas, kg, litros" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-total-price">Precio total</label>
          <Input id="item-total-price" name="total_price" type="number" min="0" step="100" placeholder="20000" required />
        </div>
      </div>
      <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
        <input name="updates_stock" type="checkbox" defaultChecked className="h-4 w-4" />
        Este producto actualizará stock cuando se implemente inventario.
      </label>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading || purchases.length === 0}>{loading ? "Guardando..." : "Agregar producto"}</Button>
    </form>
  );
}
