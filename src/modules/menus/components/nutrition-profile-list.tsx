import { getNutritionGoalLabel } from "../calculations";
import type { NutritionProfile } from "../types";

export function NutritionProfileList({ profiles }: { profiles: NutritionProfile[] }) {
  if (!profiles.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay perfiles nutricionales. Crea uno por miembro para planear menús.</p>;
  }

  return (
    <div className="space-y-3">
      {profiles.map((profile) => (
        <div key={profile.id} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">{profile.family_members?.full_name ?? "Miembro"}</p>
              <p className="text-xs text-muted-foreground">{getNutritionGoalLabel(profile.goal)} · {profile.meals_per_day} comidas/día</p>
            </div>
            <div className="text-sm sm:text-right">
              <p className="font-semibold">{Number(profile.daily_calories).toLocaleString("es-CO")} kcal</p>
              <p className="text-muted-foreground">{Number(profile.daily_protein).toLocaleString("es-CO")} g proteína</p>
            </div>
          </div>
          {profile.notes ? <p className="mt-3 text-sm text-muted-foreground">{profile.notes}</p> : null}
        </div>
      ))}
    </div>
  );
}
