"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { getAssetTypeLabel } from "../calculations";
import type { Asset } from "../types";

export function AssetList({ assets }: { assets: Asset[] }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(asset: Asset, status: Asset["status"]) {
    setUpdatingId(asset.id);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("assets").update({ status }).eq("id", asset.id);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo actualizar el activo."));
    } finally {
      setUpdatingId(null);
    }
  }

  if (!assets.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay activos registrados.</p>;
  }

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {assets.map((asset) => (
        <div key={asset.id} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">{asset.name}</p>
              <p className="text-xs text-muted-foreground">
                {getAssetTypeLabel(asset.asset_type)} · {asset.status === "active" ? "Activo" : asset.status === "sold" ? "Vendido" : "Inactivo"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Titular: {asset.family_members?.full_name ?? "No asignado"} · Valoración: {asset.valuation_date}
              </p>
            </div>
            <p className="text-lg font-bold">{formatCurrency(Number(asset.estimated_value))}</p>
          </div>
          {asset.notes ? <p className="mt-3 text-sm text-muted-foreground">{asset.notes}</p> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {asset.status !== "active" ? (
              <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={updatingId === asset.id} onClick={() => updateStatus(asset, "active")}>Marcar activo</Button>
            ) : null}
            {asset.status !== "sold" ? (
              <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={updatingId === asset.id} onClick={() => updateStatus(asset, "sold")}>Marcar vendido</Button>
            ) : null}
            {asset.status !== "inactive" ? (
              <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={updatingId === asset.id} onClick={() => updateStatus(asset, "inactive")}>Desactivar</Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
