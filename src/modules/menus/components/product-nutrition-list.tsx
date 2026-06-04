import type { ProductNutrition } from "../types";

export function ProductNutritionList({ rows }: { rows: ProductNutrition[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay productos con datos nutricionales. Agrega datos para poder estimar menús.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">{row.market_products?.name ?? "Producto"}</p>
              <p className="text-xs text-muted-foreground">Base: {Number(row.serving_quantity).toLocaleString("es-CO")} {row.serving_unit}</p>
            </div>
            <div className="text-sm sm:text-right">
              <p className="font-semibold">{Number(row.calories).toLocaleString("es-CO")} kcal</p>
              <p className="text-muted-foreground">{Number(row.protein).toLocaleString("es-CO")} g proteína</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <p>Carbohidratos: {row.carbs === null ? "N/A" : `${Number(row.carbs).toLocaleString("es-CO")} g`}</p>
            <p>Grasas: {row.fat === null ? "N/A" : `${Number(row.fat).toLocaleString("es-CO")} g`}</p>
          </div>
          {row.notes ? <p className="mt-3 text-sm text-muted-foreground">{row.notes}</p> : null}
        </div>
      ))}
    </div>
  );
}
