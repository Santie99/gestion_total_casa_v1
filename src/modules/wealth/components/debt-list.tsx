"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { getDebtStatusLabel, getDebtTypeLabel } from "../calculations";
import type { Debt } from "../types";

export function DebtList({ debts }: { debts: Debt[] }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(debt: Debt, status: Debt["status"]) {
    setUpdatingId(debt.id);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("debts").update({ status }).eq("id", debt.id);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo actualizar la deuda."));
    } finally {
      setUpdatingId(null);
    }
  }

  if (!debts.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay deudas registradas.</p>;
  }

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {debts.map((debt) => (
        <div key={debt.id} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">{debt.name}</p>
              <p className="text-xs text-muted-foreground">
                {getDebtTypeLabel(debt.debt_type)} · {debt.entity || "Sin entidad"} · {getDebtStatusLabel(debt.status)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Responsable: {debt.family_members?.full_name ?? "No asignado"}
                {debt.due_day ? ` · Día de pago: ${debt.due_day}` : ""}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-lg font-bold">{formatCurrency(Number(debt.current_balance))}</p>
              <p className="text-xs text-muted-foreground">Cuota: {formatCurrency(Number(debt.monthly_payment ?? 0))}</p>
            </div>
          </div>
          {debt.notes ? <p className="mt-3 text-sm text-muted-foreground">{debt.notes}</p> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {debt.status !== "active" ? (
              <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={updatingId === debt.id} onClick={() => updateStatus(debt, "active")}>Marcar activa</Button>
            ) : null}
            {debt.status !== "paid" ? (
              <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={updatingId === debt.id} onClick={() => updateStatus(debt, "paid")}>Marcar pagada</Button>
            ) : null}
            {debt.status !== "paused" ? (
              <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={updatingId === debt.id} onClick={() => updateStatus(debt, "paused")}>Pausar</Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
