"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toDateInputValue } from "@/lib/dates";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { MarketProduct, MarketPurchase } from "../types";

export function MarketItemForm({
  familyId,
  purchases,
  products,
}: {
  familyId: string;
  purchases: MarketPurchase[];
  products: MarketProduct[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const today = toDateInputValue(new Date());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const marketPurchaseId = String(formData.get("market_purchase_id") ?? "");
    const productId = String(formData.get("product_id") ?? "");
    const productName = String(formData.get("product_name") ?? "").trim();
    const categoryName = String(formData.get("category_name") ?? "").trim();
    const quantity = Number(formData.get("quantity"));
    const unit = String(formData.get("unit") ?? "").trim();
    const totalPrice = Number(formData.get("total_price"));
    const updatesStock = formData.get("updates_stock") === "on";

    if (!marketPurchaseId) {
      setError("Selecciona una compra antes de agregar productos.");
      setLoading(false);
      return;
    }

    const selectedPurchase = purchases.find((purchase) => purchase.id === marketPurchaseId);
    if (selectedPurchase?.purchased_on && selectedPurchase.purchased_on > today) {
      setError("No se pueden agregar productos a una compra con fecha futura. Corrige la fecha de la compra primero.");
      setLoading(false);
      return;
    }

    if (!productName) {
      setError("Escribe el nombre del producto o selecciona un producto maestro.");
      setLoading(false);
      return;
    }

    if (!categoryName) {
      setError("Escribe la categoría del producto para que el mercado pueda analizarse por rubros.");
      setLoading(false);
      return;
    }

    if (!quantity || quantity <= 0) {
      setError("La cantidad debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    if (!unit) {
      setError("Escribe una unidad comparable: bolsa, kg, litro, unidad, etc.");
      setLoading(false);
      return;
    }

    if (!totalPrice || totalPrice <= 0) {
      setError("El precio total debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("market_purchase_items").insert({
        family_id: familyId,
        market_purchase_id: marketPurchaseId,
        product_id: productId || null,
        product_name: productName,
        category_name: categoryName,
        quantity,
        unit,
        total_price: totalPrice,
        updates_stock: updatesStock,
      });

      if (error) throw error;

      form.reset();
      setSelectedProductId("");
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo guardar el producto. Revisa cantidad, precio, compra seleccionada y conexión."));
    } finally {
      setLoading(false);
    }
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

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="item-product-id">Producto maestro opcional</label>
        <Select
          id="item-product-id"
          name="product_id"
          value={selectedProductId}
          onChange={(event) => setSelectedProductId(event.target.value)}
        >
          <option value="">Producto libre</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">Si eliges un producto maestro, se autocompletan nombre, categoría y unidad. Puedes editarlos antes de guardar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-product-name">Producto</label>
          <Input id="item-product-name" name="product_name" placeholder="Ej.: Leche" defaultValue={selectedProduct?.name ?? ""} key={`name-${selectedProductId}`} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-category-name">Categoría</label>
          <Input id="item-category-name" name="category_name" placeholder="Ej.: Lácteos" defaultValue={selectedProduct?.default_category ?? ""} key={`category-${selectedProductId}`} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-quantity">Cantidad</label>
          <Input id="item-quantity" name="quantity" type="number" min="0.001" step="0.001" placeholder="10" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-unit">Unidad</label>
          <Input id="item-unit" name="unit" placeholder="bolsas, kg, litros" defaultValue={selectedProduct?.default_unit ?? ""} key={`unit-${selectedProductId}`} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="item-total-price">Precio total</label>
          <Input id="item-total-price" name="total_price" type="number" min="1" step="100" placeholder="20000" required />
        </div>
      </div>
      <label className="flex items-start gap-2 rounded-xl border p-3 text-sm">
        <input name="updates_stock" type="checkbox" defaultChecked={selectedProduct?.is_stockable ?? true} className="mt-0.5 h-4 w-4" />
        <span>Este producto actualizará stock cuando se implemente inventario.</span>
      </label>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading || purchases.length === 0}>{loading ? "Guardando..." : "Agregar producto"}</Button>
    </form>
  );
}
