import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/modules/household/queries";

export default async function ConfiguracionPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();

  const [{ data: members }, { data: categories }] = await Promise.all([
    supabase
      .from("family_members")
      .select("id, full_name, role, created_at")
      .eq("family_id", context.familyId)
      .order("created_at"),
    supabase
      .from("categories")
      .select("id, name, kind, layer")
      .eq("family_id", context.familyId)
      .order("kind")
      .order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 2 · Configuración base</p>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="mt-2 text-muted-foreground">Datos transversales del hogar y clasificación financiera.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
              <p className="text-sm text-muted-foreground">La edición avanzada de familia y miembros se implementará en otro sprint.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Miembros</CardTitle>
            <CardDescription>Usuarios asociados a esta familia.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(members ?? []).map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-2xl border p-3 text-sm">
                  <span className="font-medium">{member.full_name}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{member.role}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
