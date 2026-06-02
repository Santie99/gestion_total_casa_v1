"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { monthInputToMonthStart } from "@/lib/dates";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { getBudgetScopeLabel } from "../calculations";
import type { BudgetScope } from "../types";

const budgetScopes: BudgetScope[] = ["total", "manual", "market", "car"];

export function BudgetForm({ familyId, defaultMonth }: { familyId: string; defaultMonth: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const budgetMonth = String(formData.get("budget_month") ?? "");
    const scope = String(formData.get("scope") ?? "") as BudgetScope;
    const categoryName = String(formData.get("category_name") ?? "").trim();
    const amount = Number(formData.get("amount"));
    const notes = String(formData.get("notes") ?? "").trim();

    if (!budgetMonth) {
      setError("Selecciona el mes del presupuesto.");
      setLoading(false);
      return;
    }

    if (!budgetScopes.includes(scope)) {
      setError("Selecciona un tipo de presupuesto válido.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      setError("El monto presupuestado debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("monthly_budgets").insert({
        family_id: familyId,
        budget_month: monthInputToMonthStart(budgetMonth),
        scope,
        category_name: categoryName || null,
        amount,
        notes: notes || null,
      });

      if (error) throw error;

      form.reset();
      setLoading(false);
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear el presupuesto. Revisa si ya existe uno igual para ese mes."));
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="budget-month">Mes</label>
          <Input id="budget-month" name="budget_month" type="month" defaultValue={defaultMonth} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="budget-scope">Tipo</label>
          <Select id="budget-scope" name="scope" defaultValue="total" required>
            {budgetScopes.map((scope) => (
              <option key={scope} value={scope}>{getBudgetScopeLabel(scope)}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="budget-category">Etiqueta opcional</label>
          <Input id="budget-category" name="category_name" placeholder="Ej.: Mercado quincenal, Carro, Extras" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="budget-amount">Monto presupuestado</label>
          <Input id="budget-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="1500000" required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="budget-notes">Notas</label>
        <Textarea id="budget-notes" name="notes" placeholder="Ej.: límite mensual esperado para el módulo de mercado." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Crear presupuesto"}</Button>
    </form>
  );
}
