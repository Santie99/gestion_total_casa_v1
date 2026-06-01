import type { StockItem } from "../types";

export function StockItemList({ items }: { items: StockItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay stock registrado. Crea un stock inicial o agrega compras con actualización de inventario.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const quantity = Number(item.quantity ?? 0);
        const minQuantity = Number(item.min_quantity ?? 0);
        const isEmpty = quantity <= 0;
        const isLow = !isEmpty && quantity <= minQuantity;
        const status = isEmpty ? "Agotado" : isLow ? "Bajo" : "OK";
        const statusClass = isEmpty ? "bg-red-50 text-red-700" : isLow ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";

        return (
          <div key={item.id} className="rounded-2xl border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold">{item.product_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.category_name ?? "Sin categoría"} · Unidad: {item.unit}</p>
              </div>
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>{status}</span>
            </div>
            <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Disponible</p>
                <p className="font-medium">{quantity} {item.unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock mínimo</p>
                <p className="font-medium">{minQuantity} {item.unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Última actualización</p>
                <p className="font-medium">{new Date(item.last_updated_at).toLocaleString("es-CO")}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
