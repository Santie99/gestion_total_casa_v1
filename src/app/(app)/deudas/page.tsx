export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/modules/household/queries";
import type { FamilyMember } from "@/modules/household/types";
import { DebtForm } from "@/modules/wealth/components/debt-form";
import { DebtList } from "@/modules/wealth/components/debt-list";
import { getDebtToIncomeRatio, getWealthSummary, groupDebtsByType } from "@/modules/wealth/calculations";
import type { Asset, Debt } from "@/modules/wealth/types";
import { getCurrentMonthRange } from "@/lib/dates";
import { sumEntries } from "@/modules/finance/calculations";
import type { FinanceEntry } from "@/modules/finance/types";

export default async function DeudasPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const month = getCurrentMonthRange();

  const [{ data: debtsData }, { data: assetsData }, { data: membersData }, { data: incomeData }] = await Promise.all([
    supabase
      .from("debts")
      .select("id, family_id, name, debt_type, entity, current_balance, monthly_payment, interest_rate, due_day, responsible_member_id, status, notes, created_at, family_members(full_name)")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("assets")
      .select("id, family_id, name, asset_type, estimated_value, valuation_date, owner_member_id, status, notes, created_at, family_members(full_name)")
      .eq("family_id", context.familyId),
    supabase
      .from("family_members")
      .select("id, family_id, user_id, full_name, role, is_active, created_at")
      .eq("family_id", context.familyId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("income_entries")
      .select("id, amount, occurred_on, description, category_id, categories(name)")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end),
  ]);

  const debts = (debtsData ?? []) as unknown as Debt[];
  const assets = (assetsData ?? []) as unknown as Asset[];
  const members = (membersData ?? []) as unknown as FamilyMember[];
  const monthlyIncome = sumEntries((incomeData ?? []) as unknown as FinanceEntry[]);
  const summary = getWealthSummary(debts, assets);
  const debtToIncome = getDebtToIncomeRatio(summary.monthlyDebtPayments, monthlyIncome);
  const debtGroups = groupDebtsByType(debts);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 8 · Gestión de deuda</p>
        <h2 className="text-3xl font-bold tracking-tight">Deudas</h2>
        <p className="mt-2 text-muted-foreground">Registra obligaciones, cuotas y riesgo de sobreendeudamiento de {context.familyName}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Deuda activa total</CardDescription>
            <CardTitle className="text-2xl text-red-700">{formatCurrency(summary.totalDebts)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Suma de saldos activos registrados.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Cuotas mensuales</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(summary.monthlyDebtPayments)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Carga mensual declarada de deuda.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Debt-to-Income</CardDescription>
            <CardTitle className={debtToIncome > 0.35 ? "text-2xl text-red-700" : debtToIncome > 0.25 ? "text-2xl text-amber-700" : "text-2xl text-emerald-700"}>{formatPercent(debtToIncome)}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Cuotas mensuales divididas entre ingresos del mes.</p></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Deudas registradas</CardDescription>
            <CardTitle className="text-2xl">{debts.length}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Activas, pagadas o pausadas.</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva deuda</CardTitle>
            <CardDescription>Registra saldo, cuota, entidad y responsable.</CardDescription>
          </CardHeader>
          <CardContent>
            <DebtForm familyId={context.familyId} members={members} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deudas registradas</CardTitle>
            <CardDescription>Actualiza estado sin borrar históricos.</CardDescription>
          </CardHeader>
          <CardContent>
            <DebtList debts={debts} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Composición de deuda</CardTitle>
          <CardDescription>Distribución por tipo para priorizar decisiones de pago.</CardDescription>
        </CardHeader>
        <CardContent>
          {debtGroups.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {debtGroups.map((group) => (
                <div key={group.type} className="rounded-2xl border bg-slate-50 p-4">
                  <p className="text-sm font-semibold">{group.label}</p>
                  <p className="mt-2 text-xl font-bold">{formatCurrency(group.amount)}</p>
                  <p className="text-xs text-muted-foreground">{summary.totalDebts > 0 ? formatPercent(group.amount / summary.totalDebts) : "0%"} del total activo.</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Aún no hay deuda activa para analizar.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
