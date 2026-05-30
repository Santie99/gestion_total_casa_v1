import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/modules/finance/components/category-form";
import { EntryForm } from "@/modules/finance/components/entry-form";
import { EntryList } from "@/modules/finance/components/entry-list";
import { groupEntriesByCategory, sumEntries } from "@/modules/finance/calculations";
import type { Category, FinanceEntry } from "@/modules/finance/types";
import { getCurrentFamily } from "@/modules/household/queries";

export default async function GastosPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const month = getCurrentMonthRange();

  const [{ data: categories }, { data: entries }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, kind, layer")
      .eq("family_id", context.familyId)
      .eq("kind", "expense")
      .eq("layer", "finance")
      .order("name"),
    supabase
      .from("expense_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .eq("source_module", "manual")
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
  ]);

  const typedCategories = (categories ?? []) as Category[];
  const typedEntries = (entries ?? []) as unknown as FinanceEntry[];
  const total = sumEntries(typedEntries);
  const categoryTotals = groupEntriesByCategory(typedEntries).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 2 · Finanzas base</p>
        <h2 className="text-3xl font-bold tracking-tight">Gastos</h2>
        <p className="mt-2 text-muted-foreground">
          Registro centralizado de salidas manuales. Mercado y Carro alimentarán esta capa por separado en fases posteriores.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total del mes</CardDescription>
            <CardTitle className="text-2xl text-red-700">{formatCurrency(total)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Periodo: {month.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Movimientos</CardDescription>
            <CardTitle className="text-2xl">{typedEntries.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Registros de gasto cargados este mes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Categorías</CardDescription>
            <CardTitle className="text-2xl">{typedCategories.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Base para presupuestos y métricas CFO.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo gasto</CardTitle>
            <CardDescription>Todo gasto queda asociado al hogar, usuario, fecha real y corte mensual.</CardDescription>
          </CardHeader>
          <CardContent>
            <EntryForm familyId={context.familyId} memberId={context.memberId} categories={typedCategories} type="expense" />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Categorías de gasto</CardTitle>
              <CardDescription>Crea categorías manuales para gastos generales.</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryForm familyId={context.familyId} kind="expense" />
              <div className="pt-2">
                {typedCategories.length ? (
                  <div className="flex flex-wrap gap-2">
                    {typedCategories.map((category) => (
                      <span key={category.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {category.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay categorías creadas.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top categorías</CardTitle>
              <CardDescription>Lectura rápida del gasto del mes.</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryTotals.length ? (
                <div className="space-y-3">
                  {categoryTotals.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no hay datos para agrupar.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gastos registrados</CardTitle>
          <CardDescription>Movimientos manuales del mes actual. Luego agregaremos filtros semanal, quincenal y anual.</CardDescription>
        </CardHeader>
        <CardContent>
          <EntryList entries={typedEntries} type="expense" />
        </CardContent>
      </Card>
    </div>
  );
}
