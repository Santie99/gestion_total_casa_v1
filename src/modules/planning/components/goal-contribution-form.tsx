"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/dates";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { FinancialGoal } from "../types";

export function GoalContributionForm({ familyId, goals }: { familyId: string; goals: FinancialGoal[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = toDateInputValue(new Date());
  const activeGoals = goals.filter((goal) => goal.status === "active");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const goalId = String(formData.get("goal_id") ?? "");
    const amount = Number(formData.get("amount"));
    const contributedOn = String(formData.get("contributed_on") ?? "");
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!goalId) {
      setError("Selecciona un objetivo.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      setError("El aporte debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    if (!contributedOn || contributedOn > today) {
      setError("La fecha del aporte no puede ser futura.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("goal_contributions").insert({
        family_id: familyId,
        goal_id: goalId,
        amount,
        contributed_on: contributedOn,
        notes,
      });

      if (error) throw error;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo registrar el aporte."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="contribution-goal">Objetivo</label>
        <Select id="contribution-goal" name="goal_id" defaultValue="" required>
          <option value="">Selecciona objetivo</option>
          {activeGoals.map((goal) => (
            <option key={goal.id} value={goal.id}>{goal.name}</option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="contribution-amount">Aporte</label>
          <Input id="contribution-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="300000" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="contribution-date">Fecha</label>
          <Input id="contribution-date" name="contributed_on" type="date" max={today} defaultValue={today} required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="contribution-notes">Notas</label>
        <Textarea id="contribution-notes" name="notes" placeholder="Ej.: Aporte desde ahorro mensual." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading || activeGoals.length === 0}>{loading ? "Guardando..." : "Registrar aporte"}</Button>
    </form>
  );
}
