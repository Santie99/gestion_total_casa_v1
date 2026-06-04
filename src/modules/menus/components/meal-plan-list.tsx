import { formatDate } from "@/lib/formatters";
import { getMealPlanTotals, getMealTypeLabel } from "../calculations";
import type { MealPlanWithDetails } from "../types";

function numberOrDash(value: number | null | undefined, suffix: string) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  return `${Number(value).toLocaleString("es-CO", { maximumFractionDigits: 1 })} ${suffix}`;
}

export function MealPlanList({ plans }: { plans: MealPlanWithDetails[] }) {
  if (!plans.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay menús creados. Crea una preparación familiar para empezar.</p>;
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => {
        const totals = getMealPlanTotals(plan);
        return (
          <div key={plan.id} className="rounded-2xl border p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{plan.title}</h3>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{getMealTypeLabel(plan.meal_type)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(plan.planned_on)} · Cocina: {plan.cook_member?.full_name ?? "sin asignar"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm lg:min-w-56">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground">Kcal estimadas</p>
                  <p className="font-semibold">{numberOrDash(totals.calories, "kcal")}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-muted-foreground">Proteína</p>
                  <p className="font-semibold">{numberOrDash(totals.protein, "g")}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold">Miembros</p>
                {plan.members.length ? (
                  <div className="mt-2 space-y-2">
                    {plan.members.map((member) => (
                      <div key={member.id} className="text-sm text-muted-foreground">
                        <span className="font-medium text-slate-800">{member.family_members?.full_name ?? "Miembro"}</span>
                        <span> · Meta comida: {numberOrDash(member.target_calories, "kcal")} · {numberOrDash(member.target_protein, "g proteína")}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-2 text-sm text-muted-foreground">Sin miembros asociados.</p>}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold">Productos</p>
                {plan.items.length ? (
                  <div className="mt-2 space-y-2">
                    {plan.items.map((item) => (
                      <div key={item.id} className="text-sm text-muted-foreground">
                        <span className="font-medium text-slate-800">{item.product_name}</span>
                        <span> · {Number(item.quantity).toLocaleString("es-CO")} {item.unit}</span>
                        <span> · {numberOrDash(item.estimated_calories, "kcal")} · {numberOrDash(item.estimated_protein, "g proteína")}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-2 text-sm text-muted-foreground">Agrega productos al menú para estimar nutrición.</p>}
              </div>
            </div>

            {plan.preparation_notes ? (
              <div className="mt-4 rounded-2xl border border-dashed p-4">
                <p className="text-sm font-semibold">Preparación para quien cocina</p>
                <p className="mt-1 text-sm text-muted-foreground">{plan.preparation_notes}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
