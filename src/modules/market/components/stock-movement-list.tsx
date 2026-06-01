import type { StockMovement } from "../types";

const movementLabel: Record<string, string> = {
  initial: "Stock inicial",
  purchase_in: "Entrada por compra",
  consume: "Consumo / salida",
  adjustment: "Ajuste manual",
};

export function StockMovementList({ movements }: { movements: StockMovement[] }) {
  if (movements.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay movimientos de stock.</p>;
  }

  return (
    <div className="space-y-2">
      {movements.slice(0, 12).map((movement) => {
        const delta = Number(movement.quantity_delta ?? 0);
        return (
          <div key={movement.id} className="rounded-xl border p-3 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium">{movement.stock_items?.product_name ?? "Producto"}</p>
                <p className="text-xs text-muted-foreground">{movementLabel[movement.movement_type] ?? movement.movement_type} · {movement.occurred_on}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className={delta >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{delta >= 0 ? "+" : ""}{delta} {movement.stock_items?.unit ?? ""}</p>
                <p className="text-xs text-muted-foreground">Después: {movement.quantity_after}</p>
              </div>
            </div>
            {movement.notes ? <p className="mt-2 text-xs text-muted-foreground">{movement.notes}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
