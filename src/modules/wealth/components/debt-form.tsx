"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { getDebtTypeLabel } from "../calculations";
import type { DebtType } from "../types";
import type { FamilyMember } from "@/modules/household/types";

const debtTypes: DebtType[] = ["credit_card", "personal_loan", "vehicle_loan", "mortgage", "family_loan", "other"];

export function DebtForm({ familyId, members }: { familyId: string; members: FamilyMember[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const debtType = String(formData.get("debt_type") ?? "") as DebtType;
    const entity = String(formData.get("entity") ?? "").trim();
    const currentBalance = Number(formData.get("current_balance"));
    const monthlyPaymentRaw = String(formData.get("monthly_payment") ?? "");
    const interestRateRaw = String(formData.get("interest_rate") ?? "");
    const dueDayRaw = String(formData.get("due_day") ?? "");
    const responsibleMemberId = String(formData.get("responsible_member_id") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();

    const monthlyPayment = monthlyPaymentRaw ? Number(monthlyPaymentRaw) : null;
    const interestRate = interestRateRaw ? Number(interestRateRaw) : null;
    const dueDay = dueDayRaw ? Number(dueDayRaw) : null;

    if (!name) {
      setError("Escribe el nombre de la deuda.");
      setLoading(false);
      return;
    }

    if (!debtTypes.includes(debtType)) {
      setError("Selecciona un tipo de deuda válido.");
      setLoading(false);
      return;
    }

    if (Number.isNaN(currentBalance) || currentBalance < 0) {
      setError("El saldo actual debe ser cero o mayor.");
      setLoading(false);
      return;
    }

    if (monthlyPayment !== null && (Number.isNaN(monthlyPayment) || monthlyPayment < 0)) {
      setError("La cuota mensual debe ser cero o mayor.");
      setLoading(false);
      return;
    }

    if (interestRate !== null && (Number.isNaN(interestRate) || interestRate < 0)) {
      setError("La tasa de interés debe ser cero o mayor.");
      setLoading(false);
      return;
    }

    if (dueDay !== null && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
      setError("El día de pago debe estar entre 1 y 31.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("debts").insert({
        family_id: familyId,
        name,
        debt_type: debtType,
        entity: entity || null,
        current_balance: currentBalance,
        monthly_payment: monthlyPayment,
        interest_rate: interestRate,
        due_day: dueDay,
        responsible_member_id: responsibleMemberId || null,
        notes: notes || null,
      });

      if (error) throw error;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear la deuda. Revisa los datos y permisos."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="debt-name">Nombre</label>
          <Input id="debt-name" name="name" placeholder="Ej.: Tarjeta Bancolombia" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="debt-type">Tipo</label>
          <Select id="debt-type" name="debt_type" defaultValue="credit_card" required>
            {debtTypes.map((type) => <option key={type} value={type}>{getDebtTypeLabel(type)}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="debt-entity">Entidad</label>
          <Input id="debt-entity" name="entity" placeholder="Banco, persona o entidad" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="debt-responsible">Responsable</label>
          <Select id="debt-responsible" name="responsible_member_id" defaultValue="">
            <option value="">Sin responsable</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="debt-balance">Saldo actual</label>
          <Input id="debt-balance" name="current_balance" type="number" min="0" step="0.01" placeholder="5000000" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="debt-payment">Cuota mensual</label>
          <Input id="debt-payment" name="monthly_payment" type="number" min="0" step="0.01" placeholder="350000" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="debt-rate">Tasa % EA/mes</label>
          <Input id="debt-rate" name="interest_rate" type="number" min="0" step="0.01" placeholder="2.1" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="debt-due-day">Día de pago</label>
          <Input id="debt-due-day" name="due_day" type="number" min="1" max="31" step="1" placeholder="15" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="debt-notes">Notas</label>
        <Textarea id="debt-notes" name="notes" placeholder="Condiciones, observaciones o estrategia de pago." />
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Crear deuda"}</Button>
    </form>
  );
}
