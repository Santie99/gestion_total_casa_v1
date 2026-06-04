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
import { getNutritionGoalLabel } from "../calculations";
import type { NutritionGoal, NutritionProfile } from "../types";

const goals: NutritionGoal[] = ["deficit", "maintenance", "surplus", "recomposition"];

export function NutritionProfileForm({
  familyId,
  members,
  profiles,
}: {
  familyId: string;
  members: FamilyMember[];
  profiles: NutritionProfile[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const memberId = String(formData.get("member_id") ?? "");
    const dailyCalories = Number(formData.get("daily_calories"));
    const dailyProtein = Number(formData.get("daily_protein"));
    const goal = String(formData.get("goal") ?? "maintenance") as NutritionGoal;
    const mealsPerDay = Number(formData.get("meals_per_day") || 3);
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!memberId) {
      setError("Selecciona un miembro de la familia.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(dailyCalories) || dailyCalories <= 0) {
      setError("Las kilocalorías diarias deben ser mayores que cero.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(dailyProtein) || dailyProtein <= 0) {
      setError("La proteína diaria debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(mealsPerDay) || mealsPerDay <= 0) {
      setError("El número de comidas debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("nutrition_profiles").upsert(
        {
          family_id: familyId,
          member_id: memberId,
          daily_calories: dailyCalories,
          daily_protein: dailyProtein,
          goal,
          meals_per_day: mealsPerDay,
          notes,
        },
        { onConflict: "member_id" },
      );

      if (error) throw error;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo guardar el perfil nutricional."));
    } finally {
      setLoading(false);
    }
  }

  const profiledMemberIds = new Set(profiles.map((profile) => profile.member_id));

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="nutrition-member">Miembro</label>
        <Select id="nutrition-member" name="member_id" defaultValue="" required>
          <option value="">Selecciona un miembro</option>
          {members.filter((member) => member.is_active).map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name}{profiledMemberIds.has(member.id) ? " · actualizar" : ""}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="daily-calories">Kilocalorías diarias</label>
          <Input id="daily-calories" name="daily_calories" type="number" min="1" step="1" placeholder="2200" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="daily-protein">Proteína diaria (g)</label>
          <Input id="daily-protein" name="daily_protein" type="number" min="1" step="0.1" placeholder="140" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="nutrition-goal">Objetivo</label>
          <Select id="nutrition-goal" name="goal" defaultValue="maintenance">
            {goals.map((goal) => (
              <option key={goal} value={goal}>{getNutritionGoalLabel(goal)}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="meals-per-day">Comidas al día</label>
          <Input id="meals-per-day" name="meals_per_day" type="number" min="1" step="1" defaultValue="3" required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="nutrition-notes">Notas</label>
        <Textarea id="nutrition-notes" name="notes" placeholder="Preferencias, restricciones o contexto básico." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Guardar perfil"}</Button>
    </form>
  );
}
