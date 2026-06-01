"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toDateInputValue } from "@/lib/dates";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { StockItem, StockMovementType } from "../types";

export function StockMovementForm({ familyId, stockItems }: { familyId: string; stockItems: StockItem[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const today = toDateInputValue(new Date());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const stockItemId = String(formData.get("stock_item_id") ?? "");
    const movementType = String(formData.get("movement_type") ?? "consume") as StockMovementType;
    const rawQuantity = Number(formData.get("quantity"));
    const occurredOn = String(formData.get("occurred_on") ?? today);
    const notes = String(formData.get("notes") ?? "").trim();

    if (!stockItemId) {
      setError("Selecciona un producto del stock.");
      setLoading(false);
      return;
    }

    if (occurredOn > today) {
      setError("La fecha del movimiento no puede ser futura.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(rawQuantity) || rawQuantity <= 0) {
      setError("La cantidad debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    const stockItem = stockItems.find((item) => item.id === stockItemId);
    if (!stockItem) {
      setError("El producto seleccionado no existe en stock.");
      setLoading(false);
      return;
    }

    const delta = movementType === "consume" ? -rawQuantity : rawQuantity;
    const nextQuantity = Number(stockItem.quantity ?? 0) + delta;

    if (nextQuantity < 0) {
      setError("No puedes consumir más de lo que hay en stock.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("stock_items")
        .update({ quantity: nextQuantity, last_updated_at: new Date().toISOString() })
        .eq("id", stockItemId)
        .eq("family_id", familyId);

      if (updateError) throw updateError;

      const { error: movementError } = await supabase.from("stock_movements").insert({
        family_id: familyId,
        stock_item_id: stockItemId,
        movement_type: movementType,
        quantity_delta: delta,
        quantity_after: nextQuantity,
        notes: notes || null,
        occurred_on: occurredOn,
      });

      if (movementError) throw movementError;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo registrar el movimiento de stock."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="stock-movement-item">Producto</label>
        <Select id="stock-movement-item" name="stock_item_id" defaultValue="" required>
          <option value="">Selecciona producto</option>
          {stockItems.map((item) => (
            <option key={item.id} value={item.id}>{item.product_name} · {item.quantity} {item.unit}</option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="stock-movement-type">Tipo</label>
          <Select id="stock-movement-type" name="movement_type" defaultValue="consume">
            <option value="consume">Consumo / salida</option>
            <option value="adjustment">Entrada / ajuste positivo</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="stock-movement-quantity">Cantidad</label>
          <Input id="stock-movement-quantity" name="quantity" type="number" min="0.001" step="0.001" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="stock-movement-date">Fecha</label>
          <Input id="stock-movement-date" name="occurred_on" type="date" max={today} defaultValue={today} required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="stock-movement-notes">Notas</label>
        <Input id="stock-movement-notes" name="notes" placeholder="Ej.: usado para almuerzo, ajuste por conteo físico" />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading || stockItems.length === 0}>{loading ? "Guardando..." : "Registrar movimiento"}</Button>
    </form>
  );
}
