import type { MarketProduct } from "../types";

export function MarketProductList({ products }: { products: MarketProduct[] }) {
  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay productos maestros. Puedes registrar compras con texto libre y crear productos maestros poco a poco.</p>;
  }

  return (
    <div className="space-y-3">
      {products.slice(0, 10).map((product) => (
        <div key={product.id} className="rounded-2xl border p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {product.default_category ?? "Sin categoría"} · {product.default_unit ?? "Sin unidad base"}
              </p>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {product.is_stockable ? "Inventariable" : "No inventariable"}
            </span>
          </div>
        </div>
      ))}
      {products.length > 10 ? <p className="text-xs text-muted-foreground">Mostrando 10 de {products.length} productos.</p> : null}
    </div>
  );
}
