import Link from "next/link";
import { Car, CreditCard, Flag, Home, Landmark, ReceiptText, Settings, ShoppingCart, Target, Wallet } from "lucide-react";
import { LogoutButton } from "@/components/layout/logout-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/ingresos", label: "Ingresos", icon: Wallet },
  { href: "/gastos", label: "Gastos", icon: ReceiptText },
  { href: "/presupuestos", label: "Presup.", icon: Target },
  { href: "/objetivos", label: "Objetivos", icon: Flag },
  { href: "/deudas", label: "Deudas", icon: CreditCard },
  { href: "/patrimonio", label: "Patrimonio", icon: Landmark },
  { href: "/mercado", label: "Mercado", icon: ShoppingCart },
  { href: "/carro", label: "Carro", icon: Car },
  { href: "/configuracion", label: "Config.", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-white p-5 lg:block">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Gestión Total</p>
          <h1 className="text-xl font-bold">Casa</h1>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5">
          <LogoutButton />
        </div>
      </aside>
      <main className="pb-24 lg:ml-72 lg:pb-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 overflow-x-auto border-t bg-white p-2 lg:hidden">
        <div className="flex min-w-max gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-w-20 flex-col items-center gap-1 rounded-xl p-2 text-[11px] text-slate-700 hover:bg-slate-100">
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
