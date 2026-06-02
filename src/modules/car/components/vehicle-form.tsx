"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export function VehicleForm({ familyId }: { familyId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const plate = String(formData.get("plate") ?? "").trim().toUpperCase();
    const brand = String(formData.get("brand") ?? "").trim();
    const modelYearRaw = String(formData.get("model_year") ?? "").trim();
    const currentKmRaw = String(formData.get("current_km") ?? "").trim();
    const modelYear = modelYearRaw ? Number(modelYearRaw) : null;
    const currentKm = currentKmRaw ? Number(currentKmRaw) : null;

    if (!name) {
      setError("Escribe un nombre para identificar el vehículo.");
      setLoading(false);
      return;
    }

    if (modelYear !== null && (Number.isNaN(modelYear) || modelYear < 1900 || modelYear > new Date().getFullYear() + 1)) {
      setError("El año del modelo no parece válido.");
      setLoading(false);
      return;
    }

    if (currentKm !== null && (Number.isNaN(currentKm) || currentKm < 0)) {
      setError("El kilometraje no puede ser negativo.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("car_vehicles").insert({
        family_id: familyId,
        name,
        plate: plate || null,
        brand: brand || null,
        model_year: modelYear,
        current_km: currentKm,
      });

      if (error) throw error;
      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear el vehículo."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="vehicle-name">Nombre</label>
          <Input id="vehicle-name" name="name" placeholder="Ej.: Carro familiar" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="vehicle-plate">Placa</label>
          <Input id="vehicle-plate" name="plate" placeholder="Ej.: ABC123" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="vehicle-brand">Marca / referencia</label>
          <Input id="vehicle-brand" name="brand" placeholder="Ej.: Renault Logan" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="vehicle-year">Modelo</label>
          <Input id="vehicle-year" name="model_year" type="number" min="1900" step="1" placeholder="2020" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="vehicle-km">Kilometraje actual</label>
          <Input id="vehicle-km" name="current_km" type="number" min="0" step="1" placeholder="45000" />
        </div>
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Crear vehículo"}</Button>
    </form>
  );
}
