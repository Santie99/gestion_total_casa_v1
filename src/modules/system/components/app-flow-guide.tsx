import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, Lightbulb, ShoppingCart, Target, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const flows = [
  {
    title: "Flujo financiero mensual",
    description: "Registra ingresos, gastos y presupuestos; luego revisa dashboard, proyecciones e insights.",
    steps: [
      { label: "Ingresos", href: "/ingresos", icon: Wallet },
      { label: "Gastos", href: "/gastos", icon: Wallet },
      { label: "Presupuestos", href: "/presupuestos", icon: Target },
      { label: "Proyecciones", href: "/proyecciones", icon: TrendingUp },
      { label: "Insights", href: "/insights", icon: Lightbulb },
    ],
  },
  {
    title: "Flujo real de mercado",
    description: "Planea la lista, compra por proveedor, convierte a Mercado y deja stock actualizado.",
    steps: [
      { label: "Compras", href: "/compras", icon: ClipboardList },
      { label: "Mercado", href: "/mercado", icon: ShoppingCart },
      { label: "Reportes", href: "/reportes", icon: FileText },
    ],
  },
];

export function AppFlowGuide() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Mapa de uso</CardDescription>
        <CardTitle>Flujos recomendados de la app</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flows.map((flow) => (
            <div key={flow.title} className="rounded-2xl border p-4">
              <p className="font-semibold">{flow.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{flow.description}</p>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {flow.steps.map((step, index) => (
                  <div key={step.href} className="flex shrink-0 items-center gap-3">
                    <Link
                      href={step.href}
                      className="flex min-w-[8.5rem] items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <step.icon className="h-4 w-4" />
                      {step.label}
                    </Link>
                    {index < flow.steps.length - 1 ? <ArrowRight className="h-4 w-4 text-slate-400" /> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
