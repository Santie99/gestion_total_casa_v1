import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange } from "@/lib/dates";
import { formatCurrency } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/modules/finance/components/category-form";
import { EntryForm } from "@/modules/finance/components/entry-form";
import { EntryList } from "@/modules/finance/components/entry-list";
import { sumEntries } from "@/modules/finance/calculations";
import type { Category, FinanceEntry } from "@/modules/finance/types";
import { getCurrentFamily } from "@/modules/household/queries";

export default async function IngresosPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const month = getCurrentMonthRange();

  const [{ data: categories }, { data: entries }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, kind, layer")
      .eq("family_id", context.familyId)
      .eq("kind", "income")
      .order("name"),
    supabase
      .from("income_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
  ]);

  const typedCategories = (categories ?? []) as Category[];
  const typedEntries = (entries ?? []) as unknown as FinanceEntry[];
  const total = sumEntries(typedEntries);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ingresos</h2>
        <p className="mt-2 text-muted-foreground">
          Registro de entradas de dinero con fecha real y consolidación mensual automática.
        </p>
      </div>

      <div className="mobile-summary-carousel md:grid md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total del mes</CardDescription>
            <CardTitle className="text-2xl text-emerald-700">{formatCurrency(total)}</CardTitle>
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
            <p className="text-sm text-muted-foreground">Registros de ingreso cargados este mes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Categorías</CardDescription>
            <CardTitle className="text-2xl">{typedCategories.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Clasificación base para análisis futuro.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo ingreso</CardTitle>
            <CardDescription>Todo ingreso queda asociado al hogar, usuario, fecha real y corte mensual.</CardDescription>
          </CardHeader>
          <CardContent>
            <EntryForm familyId={context.familyId} memberId={context.memberId} categories={typedCategories} type="income" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorías de ingreso</CardTitle>
            <CardDescription>Crea categorías antes o durante el registro.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm familyId={context.familyId} kind="income" />
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos registrados</CardTitle>
          <CardDescription>Movimientos del mes actual. Luego agregaremos filtros semanal, quincenal y anual.</CardDescription>
        </CardHeader>
        <CardContent>
          <EntryList entries={typedEntries} type="income" />
        </CardContent>
      </Card>
    </div>
  );
}
