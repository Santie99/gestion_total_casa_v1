import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import { carCategoryLabels } from "../calculations";
import type { CarReminder } from "../types";

export function CarReminderList({ reminders }: { reminders: CarReminder[] }) {
  if (!reminders.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay vencimientos o mantenimientos pendientes.</p>;
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <Card key={reminder.id} className="p-4">
          <CardHeader className="mb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">{reminder.title}</CardTitle>
                <CardDescription>
                  {carCategoryLabels[reminder.category] ?? "Recordatorio"} · {reminder.car_vehicles?.name ?? "Sin vehículo"}
                  {reminder.car_vehicles?.plate ? ` · ${reminder.car_vehicles.plate}` : ""}
                </CardDescription>
              </div>
              <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Pendiente</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {reminder.due_on ? <p>Fecha: {formatDate(reminder.due_on)}</p> : null}
            {reminder.due_km !== null ? <p>Kilometraje: {Number(reminder.due_km).toLocaleString("es-CO")} km</p> : null}
            {reminder.notes ? <p>{reminder.notes}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
