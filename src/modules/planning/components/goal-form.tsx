"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMember } from "@/modules/household/types";
import { getGoalCategoryLabel, getGoalPriorityLabel } from "../calculations";
import type { GoalCategory, GoalPriority } from "../types";

const categories: GoalCategory[] = ["emergency_fund", "travel", "debt_payment", "purchase", "home_improvement", "education", "investment", "other"];
const priorities: GoalPriority[] = ["high", "medium", "low"];

export function GoalForm({ familyId, members }: { familyId: string; members: FamilyMember[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "other") as GoalCategory;
    const targetAmount = Number(formData.get("target_amount"));
    const currentAmount = Number(formData.get("current_amount") || 0);
    const targetDate = String(formData.get("target_date") ?? "") || null;
    const responsibleMemberId = String(formData.get("responsible_member_id") ?? "") || null;
    const priority = String(formData.get("priority") ?? "medium") as GoalPriority;
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!name) {
      setError("Escribe el nombre del objetivo.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(targetAmount) || targetAmount <= 0) {
      setError("El monto objetivo debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(currentAmount) || currentAmount < 0) {
      setError("El monto actual no puede ser negativo.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("financial_goals").insert({
        family_id: familyId,
        name,
        category,
        target_amount: targetAmount,
        current_amount: currentAmount,
        target_date: targetDate,
        responsible_member_id: responsibleMemberId,
        priority,
        notes,
      });

      if (error) throw error;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear el objetivo financiero."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="goal-name">Nombre</label>
        <Input id="goal-name" name="name" placeholder="Ej.: Fondo de emergencia" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="goal-category">Categoría</label>
          <Select id="goal-category" name="category" defaultValue="emergency_fund">
            {categories.map((category) => (
              <option key={category} value={category}>{getGoalCategoryLabel(category)}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="goal-priority">Prioridad</label>
          <Select id="goal-priority" name="priority" defaultValue="medium">
            {priorities.map((priority) => (
              <option key={priority} value={priority}>{getGoalPriorityLabel(priority)}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="goal-target-amount">Monto objetivo</label>
          <Input id="goal-target-amount" name="target_amount" type="number" min="0.01" step="0.01" placeholder="5000000" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="goal-current-amount">Monto actual</label>
          <Input id="goal-current-amount" name="current_amount" type="number" min="0" step="0.01" placeholder="0" defaultValue="0" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="goal-target-date">Fecha objetivo</label>
          <Input id="goal-target-date" name="target_date" type="date" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="goal-member">Responsable</label>
          <Select id="goal-member" name="responsible_member_id" defaultValue="">
            <option value="">Sin responsable</option>
            {members.filter((member) => member.is_active).map((member) => (
              <option key={member.id} value={member.id}>{member.full_name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="goal-notes">Notas</label>
        <Textarea id="goal-notes" name="notes" placeholder="Estrategia, motivo o detalles del objetivo." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Crear objetivo"}</Button>
    </form>
  );
}
