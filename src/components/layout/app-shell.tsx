"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  ClipboardList,
  CreditCard,
  Flag,
  Home,
  Landmark,
  Lightbulb,
  ReceiptText,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
  Utensils,
  Wallet,
} from "lucide-react";
import { LogoutButton } from "@/components/layout/logout-button";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const navGroups = [
  {
    title: "Inicio",
    items: [{ href: "/dashboard", label: "Dashboard", shortLabel: "Inicio", icon: Home }],
  },
  {
    title: "Finanzas",
    items: [
      { href: "/ingresos", label: "Ingresos", shortLabel: "Ingresos", icon: Wallet },
      { href: "/gastos", label: "Gastos", shortLabel: "Gastos", icon: ReceiptText },
      { href: "/presupuestos", label: "Presupuestos", shortLabel: "Presup.", icon: Target },
      { href: "/proyecciones", label: "Proyecciones", shortLabel: "Proy.", icon: TrendingUp },
      { href: "/insights", label: "Insights", shortLabel: "Insights", icon: Lightbulb },
      { href: "/objetivos", label: "Objetivos", shortLabel: "Metas", icon: Flag },
      { href: "/deudas", label: "Deudas", shortLabel: "Deudas", icon: CreditCard },
      { href: "/patrimonio", label: "Patrimonio", shortLabel: "Patrim.", icon: Landmark },
    ],
  },
  {
    title: "Operación",
    items: [
      { href: "/compras", label: "Compras", shortLabel: "Compras", icon: ClipboardList },
      { href: "/mercado", label: "Mercado", shortLabel: "Mercado", icon: ShoppingCart },
      { href: "/menus", label: "Menús", shortLabel: "Menús", icon: Utensils },
      { href: "/carro", label: "Carro", shortLabel: "Carro", icon: Car },
    ],
  },
  {
    title: "Sistema",
    items: [{ href: "/configuracion", label: "Configuración", shortLabel: "Config.", icon: Settings }],
  },
];

const mobilePrimaryItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/compras", label: "Compras", icon: ClipboardList },
  { href: "/mercado", label: "Mercado", icon: ShoppingCart },
  { href: "/gastos", label: "Gastos", icon: ReceiptText },
  { href: "/presupuestos", label: "Presup.", icon: Target },
  { href: "/proyecciones", label: "Proy.", icon: TrendingUp },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/menus", label: "Menús", icon: Utensils },
  { href: "/carro", label: "Carro", icon: Car },
  { href: "/objetivos", label: "Metas", icon: Flag },
  { href: "/configuracion", label: "Config.", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentItem = navGroups.flatMap((group) => group.items).find((item) => isActivePath(pathname, item.href));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ServiceWorkerRegister />
      <OfflineBanner />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-white/95 p-5 shadow-sm backdrop-blur lg:block">
        <div className="mb-7 rounded-3xl bg-slate-950 p-4 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Gestión Total</p>
          <h1 className="mt-1 text-xl font-bold">Casa</h1>
          <p className="mt-2 text-xs text-slate-300">Finanzas + operación familiar</p>
        </div>

        <nav className="space-y-5 pb-24">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                        active ? "bg-slate-950 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <LogoutButton />
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b bg-white/90 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Gestión Total Casa</p>
            <h1 className="text-base font-bold text-slate-950">{currentItem?.label ?? "App"}</h1>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">PWA</span>
        </div>
      </header>

      <main className="pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:ml-72 lg:pb-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mobilePrimaryItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[4.55rem] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition active:scale-[0.98] ${
                  active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
