export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/modules/household/queries";
import type { FamilyMember } from "@/modules/household/types";
import { getGoalProgressRows, getGoalSummary } from "@/modules/planning/calculations";
import { GoalContributionForm } from "@/modules/planning/components/goal-contribution-form";
import { GoalForm } from "@/modules/planning/components/goal-form";
import { GoalList } from "@/modules/planning/components/goal-list";
import { GoalSummaryCards } from "@/modules/planning/components/goal-summary-card";
import type { FinancialGoal, GoalContribution } from "@/modules/planning/types";

export default async function ObjetivosPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();

  const [{ data: membersData }, { data: goalsData }, { data: contributionsData }] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, family_id, user_id, full_name, role, is_active, created_at")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: true }),
    supabase
      .from("financial_goals")
      .select("id, family_id, name, category, target_amount, current_amount, target_date, responsible_member_id, priority, status, notes, created_at, family_members(full_name)")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("goal_contributions")
      .select("id, family_id, goal_id, contributed_on, amount, notes, created_by, created_at, financial_goals(name)")
      .eq("family_id", context.familyId)
      .order("contributed_on", { ascending: false }),
  ]);

  const members = (membersData ?? []) as unknown as FamilyMember[];
  const goals = (goalsData ?? []) as unknown as FinancialGoal[];
  const contributions = (contributionsData ?? []) as unknown as GoalContribution[];
  const progressRows = getGoalProgressRows(goals, contributions);
  const summary = getGoalSummary(progressRows);
  const recentContributions = contributions.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Objetivos financieros</h2>
        <p className="mt-2 text-muted-foreground">
          Define metas, registra aportes y revisa si el ritmo actual alcanza para cumplirlas. Familia: {context.familyName}.
        </p>
      </div>

      <GoalSummaryCards summary={summary} />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nuevo objetivo</CardTitle>
              <CardDescription>Crea metas medibles con monto, fecha, prioridad y responsable.</CardDescription>
            </CardHeader>
            <CardContent>
              <GoalForm familyId={context.familyId} members={members} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registrar aporte</CardTitle>
              <CardDescription>Los aportes se suman al monto actual del objetivo para calcular progreso.</CardDescription>
            </CardHeader>
            <CardContent>
              <GoalContributionForm familyId={context.familyId} goals={goals} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Progreso de objetivos</CardTitle>
            <CardDescription>Prioriza los objetivos de alto impacto, próximos a vencer o en riesgo.</CardDescription>
          </CardHeader>
          <CardContent>
            <GoalList goals={progressRows} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximo objetivo crítico</CardTitle>
            <CardDescription>La meta activa con fecha más cercana.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.nextGoal ? (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold">{summary.nextGoal.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Faltan {formatCurrency(summary.nextGoal.remainingAmount)}. Aporte mensual requerido: {summary.nextGoal.requiredMonthlyContribution !== null ? formatCurrency(summary.nextGoal.requiredMonthlyContribution) : "sin fecha"}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay objetivos activos con fecha objetivo.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aportes recientes</CardTitle>
            <CardDescription>Últimos movimientos registrados hacia objetivos.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentContributions.length ? (
              <div className="space-y-3">
                {recentContributions.map((contribution) => (
                  <div key={contribution.id} className="flex flex-col rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{contribution.financial_goals?.name ?? "Objetivo"}</p>
                      <p className="text-xs text-muted-foreground">{contribution.contributed_on}</p>
                    </div>
                    <p className="font-semibold text-emerald-700">{formatCurrency(contribution.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay aportes registrados.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
