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
import { getMealTypeLabel } from "../calculations";
import type { MealType, NutritionProfile } from "../types";

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack", "other"];

export function MealPlanForm({
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
  const profileByMemberId = new Map(profiles.map((profile) => [profile.member_id, profile]));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const plannedOn = String(formData.get("planned_on") ?? "");
    const mealType = String(formData.get("meal_type") ?? "lunch") as MealType;
    const title = String(formData.get("title") ?? "").trim();
    const cookMemberId = String(formData.get("cook_member_id") ?? "") || null;
    const preparationNotes = String(formData.get("preparation_notes") ?? "").trim() || null;
    const memberIds = formData.getAll("member_ids").map(String).filter(Boolean);

    if (!plannedOn) {
      setError("Selecciona la fecha del menú.");
      setLoading(false);
      return;
    }

    if (!title) {
      setError("Escribe el nombre de la comida o preparación.");
      setLoading(false);
      return;
    }

    if (!memberIds.length) {
      setError("Selecciona al menos un miembro que comerá esta preparación.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: mealPlan, error: mealPlanError } = await supabase
        .from("meal_plans")
        .insert({
          family_id: familyId,
          planned_on: plannedOn,
          meal_type: mealType,
          title,
          cook_member_id: cookMemberId,
          preparation_notes: preparationNotes,
        })
        .select("id")
        .single();

      if (mealPlanError) throw mealPlanError;

      const memberRows = memberIds.map((memberId) => {
        const profile = profileByMemberId.get(memberId);
        const mealDivider = profile ? Math.max(Number(profile.meals_per_day ?? 3), 1) : 3;
        return {
          family_id: familyId,
          meal_plan_id: mealPlan.id,
          member_id: memberId,
          target_calories: profile ? Number(profile.daily_calories) / mealDivider : null,
          target_protein: profile ? Number(profile.daily_protein) / mealDivider : null,
        };
      });

      const { error: membersError } = await supabase.from("meal_plan_members").insert(memberRows);
      if (membersError) throw membersError;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear el menú."));
    } finally {
      setLoading(false);
    }
  }

  const activeMembers = members.filter((member) => member.is_active);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="meal-date">Fecha</label>
          <Input id="meal-date" name="planned_on" type="date" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="meal-type">Tipo de comida</label>
          <Select id="meal-type" name="meal_type" defaultValue="lunch">
            {mealTypes.map((mealType) => (
              <option key={mealType} value={mealType}>{getMealTypeLabel(mealType)}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="meal-title">Preparación</label>
        <Input id="meal-title" name="title" placeholder="Ej.: Muslos al horno con arroz y ensalada" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="cook-member">Quién cocina</label>
        <Select id="cook-member" name="cook_member_id" defaultValue="">
          <option value="">Sin asignar</option>
          {activeMembers.map((member) => (
            <option key={member.id} value={member.id}>{member.full_name}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Miembros incluidos</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {activeMembers.map((member) => {
            const hasProfile = profileByMemberId.has(member.id);
            return (
              <label key={member.id} className="flex items-start gap-2 rounded-xl border p-3 text-sm">
                <input name="member_ids" type="checkbox" value={member.id} className="mt-0.5 h-4 w-4" />
                <span>
                  <span className="font-medium">{member.full_name}</span>
                  <span className="block text-xs text-muted-foreground">{hasProfile ? "Con perfil nutricional" : "Sin perfil nutricional"}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="prep-notes">Instrucciones para cocinar</label>
        <Textarea id="prep-notes" name="preparation_notes" placeholder="Ej.: Hornear todos los muslos juntos y dividir porciones según cada miembro." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading || activeMembers.length === 0}>{loading ? "Guardando..." : "Crear menú"}</Button>
    </form>
  );
}
