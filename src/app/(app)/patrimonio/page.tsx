export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/modules/household/queries";
import type { FamilyMember } from "@/modules/household/types";
import { AssetForm } from "@/modules/wealth/components/asset-form";
import { AssetList } from "@/modules/wealth/components/asset-list";
import { WealthSummaryCard } from "@/modules/wealth/components/wealth-summary-card";
import { getWealthSummary, groupAssetsByType, groupDebtsByType } from "@/modules/wealth/calculations";
import type { Asset, Debt } from "@/modules/wealth/types";

export default async function PatrimonioPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();

  const [{ data: assetsData }, { data: debtsData }, { data: membersData }] = await Promise.all([
    supabase
      .from("assets")
      .select("id, family_id, name, asset_type, estimated_value, valuation_date, owner_member_id, status, notes, created_at, family_members(full_name)")
      .eq("family_id", context.familyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("debts")
      .select("id, family_id, name, debt_type, entity, current_balance, monthly_payment, interest_rate, due_day, responsible_member_id, status, notes, created_at, family_members(full_name)")
      .eq("family_id", context.familyId),
    supabase
      .from("family_members")
      .select("id, family_id, user_id, full_name, role, is_active, created_at")
      .eq("family_id", context.familyId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  const assets = (assetsData ?? []) as unknown as Asset[];
  const debts = (debtsData ?? []) as unknown as Debt[];
  const members = (membersData ?? []) as unknown as FamilyMember[];
  const summary = getWealthSummary(debts, assets);
  const assetGroups = groupAssetsByType(assets);
  const debtGroups = groupDebtsByType(debts);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Patrimonio</h2>
        <p className="mt-2 text-muted-foreground">Balance de activos, deudas y patrimonio neto de {context.familyName}.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <WealthSummaryCard summary={summary} />
        <Card>
          <CardHeader>
            <CardTitle>Lectura CFO</CardTitle>
            <CardDescription>Interpretación rápida del balance familiar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-semibold text-slate-900">Patrimonio neto:</span> {formatCurrency(summary.netWorth)}.</p>
              <p><span className="font-semibold text-slate-900">Deuda / activos:</span> {formatPercent(summary.debtToAssetRatio)}.</p>
              <p>
                {summary.netWorth < 0
                  ? "El patrimonio neto está negativo: las deudas superan los activos registrados. Prioriza reducción de deuda y liquidez."
                  : "El patrimonio neto está positivo. La siguiente mejora será medir evolución mensual y liquidez real."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo activo</CardTitle>
            <CardDescription>Registra efectivo, cuentas, inversiones, vehículos, inmuebles u otros bienes.</CardDescription>
          </CardHeader>
          <CardContent>
            <AssetForm familyId={context.familyId} members={members} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activos registrados</CardTitle>
            <CardDescription>Actualiza estado sin borrar históricos.</CardDescription>
          </CardHeader>
          <CardContent>
            <AssetList assets={assets} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Composición de activos</CardTitle>
            <CardDescription>Distribución del valor activo por tipo.</CardDescription>
          </CardHeader>
          <CardContent>
            {assetGroups.length ? (
              <div className="space-y-3">
                {assetGroups.map((group) => (
                  <div key={group.type} className="rounded-2xl border bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{group.label}</p>
                      <p className="font-bold">{formatCurrency(group.amount)}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{summary.totalAssets > 0 ? formatPercent(group.amount / summary.totalAssets) : "0%"} de activos.</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Aún no hay activos activos para analizar.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Composición de deudas</CardTitle>
            <CardDescription>Impacto de deuda dentro del balance.</CardDescription>
          </CardHeader>
          <CardContent>
            {debtGroups.length ? (
              <div className="space-y-3">
                {debtGroups.map((group) => (
                  <div key={group.type} className="rounded-2xl border bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{group.label}</p>
                      <p className="font-bold">{formatCurrency(group.amount)}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{summary.totalDebts > 0 ? formatPercent(group.amount / summary.totalDebts) : "0%"} de deuda activa.</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Aún no hay deudas activas para analizar.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
