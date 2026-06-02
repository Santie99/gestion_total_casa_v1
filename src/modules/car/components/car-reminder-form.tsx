"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { carCategoryOptions } from "../calculations";
import type { CarVehicle } from "../types";

export function CarReminderForm({ familyId, vehicles }: { familyId: string; vehicles: CarVehicle[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const vehicleId = String(formData.get("vehicle_id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "");
    const dueOn = String(formData.get("due_on") ?? "") || null;
    const dueKmRaw = String(formData.get("due_km") ?? "").trim();
    const dueKm = dueKmRaw ? Number(dueKmRaw) : null;
    const notes = String(formData.get("notes") ?? "").trim();

    if (!title) {
      setError("Escribe el nombre del vencimiento o recordatorio.");
      setLoading(false);
      return;
    }

    if (!category) {
      setError("Selecciona una categoría.");
      setLoading(false);
      return;
    }

    if (dueKm !== null && (Number.isNaN(dueKm) || dueKm < 0)) {
      setError("El kilometraje objetivo no puede ser negativo.");
      setLoading(false);
      return;
    }

    if (!dueOn && dueKm === null) {
      setError("Define una fecha de vencimiento o un kilometraje objetivo.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("car_reminders").insert({
        family_id: familyId,
        vehicle_id: vehicleId || null,
        title,
        category,
        due_on: dueOn,
        due_km: dueKm,
        notes: notes || null,
      });

      if (error) throw error;
      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear el recordatorio."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="car-reminder-vehicle">Vehículo</label>
          <Select id="car-reminder-vehicle" name="vehicle_id" defaultValue="">
            <option value="">Sin vehículo específico</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>{vehicle.name}{vehicle.plate ? ` · ${vehicle.plate}` : ""}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="car-reminder-category">Categoría</label>
          <Select id="car-reminder-category" name="category" defaultValue="maintenance" required>
            {carCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="car-reminder-title">Recordatorio</label>
        <Input id="car-reminder-title" name="title" placeholder="Ej.: Cambiar aceite, renovar SOAT" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="car-reminder-date">Fecha de vencimiento</label>
          <Input id="car-reminder-date" name="due_on" type="date" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="car-reminder-km">Kilometraje objetivo</label>
          <Input id="car-reminder-km" name="due_km" type="number" min="0" step="1" placeholder="50000" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="car-reminder-notes">Notas</label>
        <Textarea id="car-reminder-notes" name="notes" placeholder="Condiciones, taller, documento pendiente, etc." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Crear recordatorio"}</Button>
    </form>
  );
}
