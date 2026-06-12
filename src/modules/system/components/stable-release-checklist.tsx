import { CheckCircle2, CircleDot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const releaseChecks = [
  {
    title: "Build local limpio",
    description: "Ejecuta npm run build antes de subir a GitHub. Si falla, no hagas commit ni deploy.",
    status: "manual",
  },
  {
    title: "Migraciones aplicadas",
    description: "La última migración obligatoria fue Sprint 18. Sprint 19 no agrega SQL nuevo.",
    status: "complete",
  },
  {
    title: "PWA instalada desde Vercel",
    description: "Prueba la app en celular desde el dominio de producción, no solo desde local.",
    status: "manual",
  },
  {
    title: "Flujo Mercado → Compras → Stock validado",
    description: "Crea lista, agrupa por proveedor, convierte parcialmente y revisa stock/histórico.",
    status: "manual",
  },
  {
    title: "Reportes e Insights revisados",
    description: "Confirma que los reportes CSV, proyecciones e insights carguen con datos reales.",
    status: "manual",
  },
  {
    title: "Datos demo excluidos",
    description: "Sprint 19 no crea datos de ejemplo ni semillas opcionales por decisión del proyecto.",
    status: "complete",
  },
];

export function StableReleaseChecklist() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Versión estable</CardDescription>
        <CardTitle>Checklist final antes de usar en producción</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {releaseChecks.map((item) => {
            const Icon = item.status === "complete" ? CheckCircle2 : CircleDot;
            return (
              <div key={item.title} className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Icon className={item.status === "complete" ? "mt-0.5 h-5 w-5 text-emerald-700" : "mt-0.5 h-5 w-5 text-slate-500"} />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
