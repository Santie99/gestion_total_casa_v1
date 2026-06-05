"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { getShoppingPriorityLabel, getShoppingSourceLabel } from "../calculations";
import type { ShoppingListWithItems } from "../types";

function priorityClass(priority: string) {
  if (priority === "high") return "bg-red-50 text-red-700";
  if (priority === "normal") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: string) {
  if (status === "completed") return "Completada";
  if (status === "active") return "Activa";
  return "Borrador";
}

export function ShoppingListView({ lists }: { lists: ShoppingListWithItems[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function togglePurchased(itemId: string, isPurchased: boolean) {
    setLoadingId(itemId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("shopping_list_items").update({ is_purchased: !isPurchased }).eq("id", itemId);
      if (updateError) throw updateError;
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo actualizar el producto de la lista."));
    } finally {
      setLoadingId(null);
    }
  }

  async function completeList(listId: string) {
    setLoadingId(listId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.from("shopping_lists").update({ status: "completed" }).eq("id", listId);
      if (updateError) throw updateError;
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo completar la lista."));
    } finally {
      setLoadingId(null);
    }
  }

  if (!lists.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay listas de compras. Genera la primera desde menús y stock.</p>;
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {lists.map((list) => {
        const pending = list.items.filter((item) => !item.is_purchased).length;
        const purchased = list.items.filter((item) => item.is_purchased).length;
        return (
          <div key={list.id} className="rounded-2xl border p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{list.name}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{statusLabel(list.status)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(list.period_start)} → {formatDate(list.period_end)} · {pending} pendientes · {purchased} comprados
                </p>
                {list.notes ? <p className="mt-2 text-sm text-muted-foreground">{list.notes}</p> : null}
              </div>
              {list.status !== "completed" ? (
                <Button type="button" variant="outline" size="sm" disabled={loadingId === list.id} onClick={() => completeList(list.id)}>
                  {loadingId === list.id ? "Cerrando..." : "Marcar completada"}
                </Button>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {list.items.length ? list.items.map((item) => (
                <div key={item.id} className={`rounded-2xl border p-4 ${item.is_purchased ? "bg-slate-50 opacity-75" : "bg-white"}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-semibold ${item.is_purchased ? "line-through" : ""}`}>{item.product_name}</p>
                        <span className={`rounded-full px-2 py-1 text-xs ${priorityClass(item.priority)}`}>{getShoppingPriorityLabel(item.priority)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{getShoppingSourceLabel(item.source)}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.category_name ?? "Sin categoría"}</p>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-muted-foreground">Necesario</p>
                          <p className="font-medium">{item.needed_quantity ?? "N/A"} {item.unit}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-muted-foreground">Stock actual</p>
                          <p className="font-medium">{item.current_stock_quantity ?? "N/A"} {item.unit}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-muted-foreground">Comprar</p>
                          <p className="font-semibold">{item.suggested_purchase_quantity} {item.unit}</p>
                        </div>
                      </div>
                      {item.notes ? <p className="mt-3 text-xs text-muted-foreground">{item.notes}</p> : null}
                    </div>
                    <Button type="button" variant={item.is_purchased ? "ghost" : "outline"} size="sm" disabled={loadingId === item.id} onClick={() => togglePurchased(item.id, item.is_purchased)}>
                      {loadingId === item.id ? "Actualizando..." : item.is_purchased ? "Reabrir" : "Marcar comprado"}
                    </Button>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">Esta lista no tiene productos.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
