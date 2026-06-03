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
import type { FamilyMember } from "@/modules/household/types";
import { getAssetTypeLabel } from "../calculations";
import type { AssetType } from "../types";

const assetTypes: AssetType[] = ["cash", "bank_account", "investment", "vehicle", "real_estate", "home_item", "other"];

export function AssetForm({ familyId, members }: { familyId: string; members: FamilyMember[] }) {
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
    const assetType = String(formData.get("asset_type") ?? "") as AssetType;
    const estimatedValue = Number(formData.get("estimated_value"));
    const valuationDate = String(formData.get("valuation_date") ?? "");
    const ownerMemberId = String(formData.get("owner_member_id") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();

    if (!name) {
      setError("Escribe el nombre del activo.");
      setLoading(false);
      return;
    }

    if (!assetTypes.includes(assetType)) {
      setError("Selecciona un tipo de activo válido.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(estimatedValue) || estimatedValue < 0) {
      setError("El valor estimado debe ser cero o mayor.");
      setLoading(false);
      return;
    }

    if (!valuationDate) {
      setError("Selecciona la fecha de valoración.");
      setLoading(false);
      return;
    }

    if (valuationDate > today) {
      setError("La fecha de valoración no puede ser futura.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("assets").insert({
        family_id: familyId,
        name,
        asset_type: assetType,
        estimated_value: estimatedValue,
        valuation_date: valuationDate,
        owner_member_id: ownerMemberId || null,
        notes: notes || null,
      });

      if (error) throw error;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear el activo. Revisa los datos y permisos."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="asset-name">Nombre</label>
          <Input id="asset-name" name="name" placeholder="Ej.: Cuenta de ahorros" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="asset-type">Tipo</label>
          <Select id="asset-type" name="asset_type" defaultValue="bank_account" required>
            {assetTypes.map((type) => <option key={type} value={type}>{getAssetTypeLabel(type)}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="asset-value">Valor estimado</label>
          <Input id="asset-value" name="estimated_value" type="number" min="0" step="0.01" placeholder="10000000" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="asset-date">Fecha valoración</label>
          <Input id="asset-date" name="valuation_date" type="date" max={today} defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="asset-owner">Titular</label>
          <Select id="asset-owner" name="owner_member_id" defaultValue="">
            <option value="">Sin titular</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="asset-notes">Notas</label>
        <Textarea id="asset-notes" name="notes" placeholder="Información de valoración, ubicación o liquidez del activo." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Crear activo"}</Button>
    </form>
  );
}
