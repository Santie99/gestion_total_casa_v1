import { formatCurrency } from "@/lib/formatters";
import type { MarketPurchaseWithItems } from "../types";
import { sumMarketItems } from "../calculations";

export function MarketPurchaseList({ purchases }: { purchases: MarketPurchaseWithItems[] }) {
  if (purchases.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta quincena aún no tiene compras. Registra una compra para empezar a construir el historial.</p>;
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => {
        const total = sumMarketItems(purchase.items);
        return (
          <div key={purchase.id} className="rounded-2xl border p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{purchase.vendor || "Compra sin proveedor"}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {purchase.purchase_type === "main" ? "Principal" : "Esporádica"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {purchase.purchased_on}{purchase.invoice ? ` · Factura ${purchase.invoice.invoice_code}` : " · Sin factura"}
                </p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(total)}</p>
            </div>

            {purchase.items.length ? (
              <>
                <div className="mt-4 space-y-3 md:hidden">
                  {purchase.items.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.category_name || "Sin categoría"}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <p>Cantidad: <span className="font-medium text-slate-900">{Number(item.quantity).toLocaleString("es-CO")} {item.unit}</span></p>
                        <p>Unitario: <span className="font-medium text-slate-900">{item.unit_price == null ? "—" : `${formatCurrency(item.unit_price)} / ${item.unit}`}</span></p>
                        <p>Stock futuro: <span className="font-medium text-slate-900">{item.updates_stock ? "Sí" : "No"}</span></p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="py-2">Producto</th>
                        <th className="py-2">Categoría</th>
                        <th className="py-2">Cantidad</th>
                        <th className="py-2">Total</th>
                        <th className="py-2">Unitario</th>
                        <th className="py-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="py-2 font-medium">{item.product_name}</td>
                          <td className="py-2 text-muted-foreground">{item.category_name || "—"}</td>
                          <td className="py-2">{Number(item.quantity).toLocaleString("es-CO")} {item.unit}</td>
                          <td className="py-2">{formatCurrency(item.total_price)}</td>
                          <td className="py-2">{item.unit_price == null ? "—" : `${formatCurrency(item.unit_price)} / ${item.unit}`}</td>
                          <td className="py-2">{item.updates_stock ? "Sí" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-muted-foreground">Esta compra aún no tiene productos.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
