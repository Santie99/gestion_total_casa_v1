export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMonthRange } from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/modules/household/queries";
import { groupCarExpensesByCategory, getUpcomingReminders, sumCarExpenses } from "@/modules/car/calculations";
import { CarExpenseForm } from "@/modules/car/components/car-expense-form";
import { CarExpenseList } from "@/modules/car/components/car-expense-list";
import { CarReminderForm } from "@/modules/car/components/car-reminder-form";
import { CarReminderList } from "@/modules/car/components/car-reminder-list";
import { CarSummaryCard } from "@/modules/car/components/car-summary-card";
import { VehicleForm } from "@/modules/car/components/vehicle-form";
import { VehicleList } from "@/modules/car/components/vehicle-list";
import type { CarExpense, CarReminder, CarVehicle } from "@/modules/car/types";

export default async function CarPage() {
  const context = await getCurrentFamily();
  const supabase = await createClient();
  const month = getCurrentMonthRange();

  const [{ data: vehiclesData }, { data: expensesData }, { data: remindersData }] = await Promise.all([
    supabase
      .from("car_vehicles")
      .select("id, family_id, name, plate, brand, model_year, current_km, is_active, created_at")
      .eq("family_id", context.familyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("car_expenses")
      .select("id, family_id, vehicle_id, category, amount, occurred_on, monthly_period, vendor, odometer_km, notes, created_at, car_vehicles(name, plate)")
      .eq("family_id", context.familyId)
      .gte("occurred_on", month.start)
      .lte("occurred_on", month.end)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("car_reminders")
      .select("id, family_id, vehicle_id, title, category, due_on, due_km, status, notes, created_at, car_vehicles(name, plate)")
      .eq("family_id", context.familyId)
      .eq("status", "pending")
      .order("due_on", { ascending: true, nullsFirst: false }),
  ]);

  const vehicles = (vehiclesData ?? []) as unknown as CarVehicle[];
  const expenses = (expensesData ?? []) as unknown as CarExpense[];
  const reminders = getUpcomingReminders((remindersData ?? []) as unknown as CarReminder[]);
  const total = sumCarExpenses(expenses);
  const byCategory = groupCarExpensesByCategory(expenses).slice(0, 6);
  const gasolineTotal = expenses
    .filter((expense) => expense.category === "gasoline")
    .reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const maintenanceTotal = expenses
    .filter((expense) => ["maintenance", "parts", "inspection"].includes(expense.category))
    .reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Carro</h2>
        <p className="mt-2 text-muted-foreground">
          Gastos, vehículos, mantenimientos y vencimientos. Esta sección inicia la operación del carro sin mezclar todavía sus datos con Mercado.
        </p>
      </div>

      <div className="mobile-summary-carousel md:grid md:grid-cols-2 xl:grid-cols-4">
        <CarSummaryCard title="Gasto del mes" value={total} description={`Gastos de carro registrados en ${month.label}.`} />
        <CarSummaryCard title="Vehículos activos" value={String(vehicles.length)} description="Vehículos disponibles para asociar gastos y vencimientos." />
        <CarSummaryCard title="Gasolina" value={gasolineTotal} description="Subtotal de combustible del mes." />
        <CarSummaryCard title="Mantenimiento" value={maintenanceTotal} description="Mantenimiento, revisiones y repuestos del mes." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crear vehículo</CardTitle>
              <CardDescription>Registra el carro base para asociar gastos, kilómetros y próximos vencimientos.</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleForm familyId={context.familyId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehículos</CardTitle>
              <CardDescription>Vehículos activos de la familia.</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleList vehicles={vehicles} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registrar gasto del carro</CardTitle>
              <CardDescription>Gasolina, impuestos, arreglos, limpieza, revisiones, seguros, peajes y otros gastos.</CardDescription>
            </CardHeader>
            <CardContent>
              <CarExpenseForm familyId={context.familyId} vehicles={vehicles} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gastos del mes</CardTitle>
              <CardDescription>Historial operativo del carro en el periodo actual.</CardDescription>
            </CardHeader>
            <CardContent>
              <CarExpenseList expenses={expenses} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Crear vencimiento o mantenimiento</CardTitle>
            <CardDescription>SOAT, tecnomecánica, aceite, impuestos, revisiones o cualquier alerta futura.</CardDescription>
          </CardHeader>
          <CardContent>
            <CarReminderForm familyId={context.familyId} vehicles={vehicles} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimientos</CardTitle>
            <CardDescription>Recordatorios pendientes ordenados por fecha o kilometraje.</CardDescription>
          </CardHeader>
          <CardContent>
            <CarReminderList reminders={reminders} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gasto por categoría del carro</CardTitle>
          <CardDescription>Concentración del gasto operativo del vehículo en el mes.</CardDescription>
        </CardHeader>
        <CardContent>
          {byCategory.length ? (
            <div className="space-y-4">
              {byCategory.map((category) => {
                const percentage = total > 0 ? category.amount / total : 0;
                return (
                  <div key={category.name} className="space-y-2">
                    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(category.amount)} · {formatPercent(percentage)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.min(percentage * 100, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Registra gastos del carro para ver el análisis por categoría.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
