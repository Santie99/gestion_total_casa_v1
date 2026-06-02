import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { carCategoryLabels } from "../calculations";
import type { CarExpense } from "../types";

export function CarExpenseList({ expenses }: { expenses: CarExpense[] }) {
  if (!expenses.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay gastos del carro en el periodo actual.</p>;
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <Card key={expense.id} className="p-4">
          <CardHeader className="mb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{carCategoryLabels[expense.category] ?? "Gasto del carro"}</CardTitle>
                <CardDescription>
                  {formatDate(expense.occurred_on)} · {expense.car_vehicles?.name ?? "Sin vehículo"}
                  {expense.car_vehicles?.plate ? ` · ${expense.car_vehicles.plate}` : ""}
                </CardDescription>
              </div>
              <p className="text-lg font-semibold">{formatCurrency(expense.amount)}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{expense.vendor || "Proveedor no registrado"}</p>
            {expense.odometer_km !== null ? <p>Kilometraje: {Number(expense.odometer_km).toLocaleString("es-CO")} km</p> : null}
            {expense.notes ? <p>{expense.notes}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
