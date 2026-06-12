export const dynamic = "force-dynamic";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/modules/household/queries";
import { AppFlowGuide } from "@/modules/system/components/app-flow-guide";
import { ModuleMapCard } from "@/modules/system/components/module-map-card";
import { OnboardingProgressCard, type OnboardingStep } from "@/modules/system/components/onboarding-progress-card";
import { StableReleaseChecklist } from "@/modules/system/components/stable-release-checklist";

async function getCount(table: string, familyId: string, extra?: (query: any) => any) {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("family_id", familyId);

  if (extra) query = extra(query);

  const { count, error } = await query;
  if (error) return 0;

  return count ?? 0;
}

export default async function GuiaPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();

  const [
    memberCountResult,
    categoryCount,
    productCount,
    marketPeriodCount,
    budgetCount,
    shoppingListCount,
    goalCount,
    assetCount,
    debtCount,
    reportableMovementCount,
  ] = await Promise.all([
    supabase
      .from("family_members")
      .select("id", { count: "exact", head: true })
      .eq("family_id", context.familyId)
      .eq("is_active", true),
    getCount("categories", context.familyId),
    getCount("market_products", context.familyId),
    getCount("market_periods", context.familyId),
    getCount("monthly_budgets", context.familyId),
    getCount("shopping_lists", context.familyId),
    getCount("financial_goals", context.familyId, (query) => query.eq("status", "active")),
    getCount("assets", context.familyId, (query) => query.eq("is_active", true)),
    getCount("debts", context.familyId, (query) => query.eq("status", "active")),
    getCount("income_entries", context.familyId),
  ]);

  const memberCount = memberCountResult.count ?? 0;

  const onboardingSteps: OnboardingStep[] = [
    {
      id: "family",
      title: "Familia y miembros base",
      description: `${memberCount} miembro(s) activo(s). Este es el punto de partida para asociar movimientos y operación del hogar.`,
      href: "/configuracion",
      actionLabel: "Ir a configuración",
      isComplete: memberCount > 0,
      requiredForStableUse: true,
    },
    {
      id: "categories",
      title: "Categorías financieras",
      description: `${categoryCount} categoría(s) creadas. Se usan para ordenar ingresos y gastos manuales.`,
      href: "/gastos",
      actionLabel: "Crear categorías desde gastos",
      isComplete: categoryCount > 0,
      requiredForStableUse: true,
    },
    {
      id: "products",
      title: "Productos maestros de mercado",
      description: `${productCount} producto(s) maestro(s). Base para stock, histórico de precios y listas limpias.`,
      href: "/mercado",
      actionLabel: "Ir a Mercado",
      isComplete: productCount > 0,
      requiredForStableUse: true,
    },
    {
      id: "periods",
      title: "Quincena o periodo de mercado",
      description: `${marketPeriodCount} periodo(s) creado(s). Necesario para convertir listas a compras reales.`,
      href: "/mercado",
      actionLabel: "Crear periodo",
      isComplete: marketPeriodCount > 0,
      requiredForStableUse: true,
    },
    {
      id: "budgets",
      title: "Presupuestos mensuales",
      description: `${budgetCount} presupuesto(s). Permiten medir ejecución y alimentar insights de control.`,
      href: "/presupuestos",
      actionLabel: "Ir a presupuestos",
      isComplete: budgetCount > 0,
      requiredForStableUse: true,
    },
    {
      id: "shopping",
      title: "Primer flujo de compras",
      description: `${shoppingListCount} lista(s) creada(s). Valida el flujo Lista → Mercado → Stock.`,
      href: "/compras",
      actionLabel: "Ir a compras",
      isComplete: shoppingListCount > 0,
      requiredForStableUse: true,
    },
    {
      id: "goals",
      title: "Objetivos financieros",
      description: `${goalCount} objetivo(s) activo(s). Útiles para medir progreso y forecast.`,
      href: "/objetivos",
      actionLabel: "Ir a objetivos",
      isComplete: goalCount > 0,
      requiredForStableUse: false,
    },
    {
      id: "wealth",
      title: "Patrimonio y deuda",
      description: `${assetCount} activo(s) y ${debtCount} deuda(s) activa(s). Mejoran la lectura de balance familiar.`,
      href: "/patrimonio",
      actionLabel: "Ir a patrimonio",
      isComplete: assetCount > 0 || debtCount > 0,
      requiredForStableUse: false,
    },
    {
      id: "reports",
      title: "Datos suficientes para reportes",
      description: `${reportableMovementCount} ingreso(s) registrados. Reportes, insights y proyecciones mejoran con datos reales.`,
      href: "/reportes",
      actionLabel: "Ir a reportes",
      isComplete: reportableMovementCount > 0,
      requiredForStableUse: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm md:p-8">
        <p className="text-sm text-slate-300">Sprint 19 · Versión estable</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Guía inicial y cierre operativo</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-300">
          Punto de control final para usar Gestión Total Casa como app familiar: configuración mínima, flujos recomendados,
          checklist de estabilidad y mapa completo de módulos. No incluye datos demo ni semillas de ejemplo.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className="rounded-2xl bg-white px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
            Volver al dashboard
          </Link>
          <Link href="/reportes" className="rounded-2xl border border-white/20 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/10">
            Revisar reportes
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <OnboardingProgressCard steps={onboardingSteps} />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardDescription>Familia activa</CardDescription>
              <CardTitle>{context.familyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold">Usuario actual</p>
                  <p className="text-sm text-muted-foreground">{context.memberName} · {context.role}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold">Estado de Sprint 19</p>
                  <p className="text-sm text-muted-foreground">Cierre estable sin migración SQL y sin datos de ejemplo.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <StableReleaseChecklist />
        </div>
      </div>

      <AppFlowGuide />
      <ModuleMapCard />
    </div>
  );
}
