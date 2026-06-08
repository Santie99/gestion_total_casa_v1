import Link from "next/link";
import { Car, ClipboardList, Plus, ShoppingCart, Target, Utensils, Wallet } from "lucide-react";

const actions = [
  { href: "/compras", label: "Lista de mercado", description: "Comprar y convertir a stock", icon: ClipboardList },
  { href: "/mercado", label: "Mercado / stock", description: "Compras, precios e inventario", icon: ShoppingCart },
  { href: "/gastos", label: "Registrar gasto", description: "Gasto manual rápido", icon: Wallet },
  { href: "/carro", label: "Carro", description: "Gastos y recordatorios", icon: Car },
  { href: "/menus", label: "Menús", description: "Plan familiar", icon: Utensils },
  { href: "/objetivos", label: "Objetivo", description: "Aportes y progreso", icon: Target },
];

export function QuickActions() {
  return (
    <section className="rounded-3xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Acciones rápidas</p>
          <p className="text-sm text-muted-foreground">Atajos para uso diario desde celular.</p>
        </div>
        <span className="hidden rounded-full bg-slate-100 p-2 text-slate-700 sm:inline-flex"><Plus className="h-4 w-4" /></span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-2xl border bg-slate-50 p-3 transition hover:bg-slate-100 active:scale-[0.99]"
          >
            <span className="rounded-2xl bg-white p-2 text-slate-900 shadow-sm"><action.icon className="h-5 w-5" /></span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">{action.label}</span>
              <span className="block text-xs text-muted-foreground">{action.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
