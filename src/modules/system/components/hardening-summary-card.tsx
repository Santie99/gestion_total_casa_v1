import { Database, LockKeyhole, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const hardeningItems = [
  {
    title: "RLS activo",
    description: "Todas las tablas de datos familiares mantienen Row Level Security activo por familia.",
    icon: LockKeyhole,
  },
  {
    title: "Integridad por familia",
    description: "Triggers bloquean relaciones cruzadas entre registros de familias distintas.",
    icon: ShieldCheck,
  },
  {
    title: "Índices de performance",
    description: "Consultas de Dashboard, Reportes, Insights y Proyecciones quedan reforzadas por fecha, familia, módulo y estado.",
    icon: Zap,
  },
  {
    title: "Checks defensivos",
    description: "Nuevos registros críticos no pueden guardar nombres o unidades vacías.",
    icon: Database,
  },
];

export function HardeningSummaryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hardening técnico</CardTitle>
        <CardDescription>Sprint 18 · Seguridad, performance e integridad de datos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {hardeningItems.map((item) => (
            <div key={item.title} className="rounded-2xl border bg-slate-50/70 p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <item.icon className="h-4 w-4" />
              </div>
              <p className="font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Esta tarjeta solo resume el estado técnico. La protección real queda en Supabase con la migración de Sprint 18.
        </p>
      </CardContent>
    </Card>
  );
}
