import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { MemberForm } from "@/modules/household/components/member-form";
import { MemberList } from "@/modules/household/components/member-list";
import { getCurrentFamily } from "@/modules/household/queries";
import { HardeningSummaryCard } from "@/modules/system/components/hardening-summary-card";
import type { FamilyMember } from "@/modules/household/types";

export default async function ConfiguracionPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();

  const [{ data: members }, { data: categories }] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, family_id, user_id, full_name, role, is_active, created_at")
      .eq("family_id", context.familyId)
      .order("created_at"),
    supabase
      .from("categories")
      .select("id, name, kind, layer")
      .eq("family_id", context.familyId)
      .order("kind")
      .order("name"),
  ]);

  const activeMembers = ((members ?? []) as FamilyMember[]).filter((member) => member.is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 3 · Configuración familiar</p>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="mt-2 text-muted-foreground">Administra miembros internos, familia activa y categorías transversales.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{context.familyName}</CardTitle>
            <CardDescription>Familia activa de la sesión actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium">Usuario actual</p>
                <p className="text-sm text-muted-foreground">{context.memberName} · {context.role}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium">Miembros activos</p>
                <p className="text-sm text-muted-foreground">{activeMembers} de {(members ?? []).length} creados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crear miembro interno</CardTitle>
            <CardDescription>Estos miembros sirven para asociar ingresos, gastos, mercado y futuros menús. No tienen login propio todavía.</CardDescription>
          </CardHeader>
          <CardContent>
            <MemberForm familyId={context.familyId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regla actual</CardTitle>
            <CardDescription>Gestión de miembros Sprint 3.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Por ahora los miembros nuevos son internos. Más adelante se podrá convertir un miembro interno en usuario con login propio mediante invitación o asociación de cuenta.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Miembros de la familia</CardTitle>
          <CardDescription>Activa o desactiva miembros sin borrar históricos asociados.</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberList members={(members ?? []) as FamilyMember[]} currentMemberId={context.memberId} />
        </CardContent>
      </Card>

      <HardeningSummaryCard />

      <Card className="border-slate-300 bg-slate-50">
        <CardHeader>
          <CardTitle>Guía inicial y cierre estable</CardTitle>
          <CardDescription>Revisa el onboarding operativo, mapa de módulos y checklist final de producción.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Sprint 19 no agrega datos demo ni SQL nuevo. La guía sirve para validar que la familia ya puede usar la PWA con datos reales.
            </p>
            <Link href="/guia" className="rounded-2xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800">
              Abrir guía
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorías creadas</CardTitle>
          <CardDescription>Las categorías se crean desde Ingresos y Gastos. Luego tendrán administración completa aquí.</CardDescription>
        </CardHeader>
        <CardContent>
          {categories?.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <div key={category.id} className="rounded-2xl border p-4">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.kind === "income" ? "Ingreso" : "Gasto"} · {category.layer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay categorías creadas todavía.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
