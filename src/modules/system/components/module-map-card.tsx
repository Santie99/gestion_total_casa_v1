import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  { href: "/dashboard", title: "Inicio", description: "Resumen ejecutivo del mes." },
  { href: "/ingresos", title: "Ingresos", description: "Entradas de dinero por fecha y categoría." },
  { href: "/gastos", title: "Gastos", description: "Gastos manuales sin duplicar Mercado o Carro." },
  { href: "/presupuestos", title: "Presupuestos", description: "Límites mensuales por capa financiera." },
  { href: "/mercado", title: "Mercado", description: "Compras reales, stock, productos e histórico de precios." },
  { href: "/compras", title: "Compras", description: "Listas inteligentes/manuales y conversión parcial a Mercado." },
  { href: "/menus", title: "Menús", description: "Planeación de comidas y nutrición base." },
  { href: "/carro", title: "Carro", description: "Vehículos, gastos y recordatorios." },
  { href: "/deudas", title: "Deudas", description: "Saldos, cuotas y riesgo financiero." },
  { href: "/patrimonio", title: "Patrimonio", description: "Activos, deudas y patrimonio neto." },
  { href: "/objetivos", title: "Objetivos", description: "Metas financieras y aportes." },
  { href: "/proyecciones", title: "Proyecciones", description: "Forecast, escenarios y stress testing." },
  { href: "/insights", title: "Insights", description: "Señales determinísticas y acciones prioritarias." },
  { href: "/reportes", title: "Reportes", description: "Reportes mensuales, CSV y auditoría." },
  { href: "/configuracion", title: "Configuración", description: "Familia, miembros, categorías y estado técnico." },
];

export function ModuleMapCard() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Mapa completo</CardDescription>
        <CardTitle>Módulos disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link key={module.href} href={module.href} className="rounded-2xl border bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="font-semibold">{module.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
