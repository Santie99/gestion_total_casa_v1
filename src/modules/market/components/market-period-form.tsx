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

export function MarketPeriodForm({ familyId }: { familyId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const today = toDateInputValue(new Date());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const startsOn = String(formData.get("starts_on") ?? "");
    const endsOn = String(formData.get("ends_on") ?? "");
    const status = String(formData.get("status") ?? "open");
    const notes = String(formData.get("notes") ?? "").trim();

    if (!name || !startsOn || !endsOn) {
      setError("Completa nombre, fecha inicial y fecha final.");
      setLoading(false);
      return;
    }

    if (endsOn < startsOn) {
      setError("La fecha final no puede ser anterior a la fecha inicial.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("market_periods").insert({
        family_id: familyId,
        name,
        starts_on: startsOn,
        ends_on: endsOn,
        status,
        notes: notes || null,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      });

      if (error) throw error;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear la quincena."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="period-name">Nombre de la quincena</label>
        <Input id="period-name" name="name" placeholder="Ej.: Primera quincena de junio" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="period-starts-on">Fecha inicial</label>
          <Input id="period-starts-on" name="starts_on" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="period-ends-on">Fecha final</label>
          <Input id="period-ends-on" name="ends_on" type="date" defaultValue={today} required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="period-status">Estado</label>
        <Select id="period-status" name="status" defaultValue="open">
          <option value="open">Abierta</option>
          <option value="closed">Cerrada</option>
          <option value="historical">Histórica</option>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="period-notes">Notas</label>
        <Textarea id="period-notes" name="notes" placeholder="Ej.: mercado con fechas flexibles" />
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Creando..." : "Crear quincena"}</Button>
    </form>
  );
}
