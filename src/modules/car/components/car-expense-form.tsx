"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/dates";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { carCategoryOptions } from "../calculations";
import type { CarVehicle } from "../types";

export function CarExpenseForm({ familyId, vehicles }: { familyId: string; vehicles: CarVehicle[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const today = toDateInputValue(new Date());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const vehicleId = String(formData.get("vehicle_id") ?? "");
    const category = String(formData.get("category") ?? "");
    const amount = Number(formData.get("amount"));
    const occurredOn = String(formData.get("occurred_on") ?? "");
    const vendor = String(formData.get("vendor") ?? "").trim();
    const odometerRaw = String(formData.get("odometer_km") ?? "").trim();
    const odometerKm = odometerRaw ? Number(odometerRaw) : null;
    const notes = String(formData.get("notes") ?? "").trim();

    if (!category) {
      setError("Selecciona una categoría del gasto del carro.");
      setLoading(false);
      return;
    }

    if (!occurredOn) {
      setError("Selecciona la fecha real del gasto.");
      setLoading(false);
      return;
    }

    if (occurredOn > today) {
      setError("La fecha del gasto no puede ser futura.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      setError("El valor del gasto debe ser mayor que cero.");
      setLoading(false);
      return;
    }

    if (odometerKm !== null && (Number.isNaN(odometerKm) || odometerKm < 0)) {
      setError("El kilometraje no puede ser negativo.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("car_expenses").insert({
        family_id: familyId,
        vehicle_id: vehicleId || null,
        category,
        amount,
        occurred_on: occurredOn,
        vendor: vendor || null,
        odometer_km: odometerKm,
        notes: notes || null,
      });

      if (error) throw error;
      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo registrar el gasto del carro."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="car-expense-vehicle">Vehículo</label>
          <Select id="car-expense-vehicle" name="vehicle_id" defaultValue="">
            <option value="">Sin vehículo específico</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>{vehicle.name}{vehicle.plate ? ` · ${vehicle.plate}` : ""}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="car-expense-category">Categoría</label>
          <Select id="car-expense-category" name="category" defaultValue="gasoline" required>
            {carCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="car-expense-date">Fecha</label>
          <Input id="car-expense-date" name="occurred_on" type="date" max={today} defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="car-expense-amount">Valor</label>
          <Input id="car-expense-amount" name="amount" type="number" min="0.01" step="0.01" placeholder="120000" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="car-expense-km">Kilometraje</label>
          <Input id="car-expense-km" name="odometer_km" type="number" min="0" step="1" placeholder="45200" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="car-expense-vendor">Proveedor / lugar</label>
        <Input id="car-expense-vendor" name="vendor" placeholder="Ej.: Terpel, taller, CDA" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="car-expense-notes">Notas</label>
        <Textarea id="car-expense-notes" name="notes" placeholder="Detalle del gasto, repuesto, observaciones, etc." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Registrar gasto"}</Button>
    </form>
  );
}
