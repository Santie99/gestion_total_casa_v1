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
import type { ManualInvoice, MarketPeriod } from "../types";

export function MarketPurchaseForm({
  familyId,
  periods,
  selectedPeriodId,
  invoices,
}: {
  familyId: string;
  periods: MarketPeriod[];
  selectedPeriodId: string | null;
  invoices: ManualInvoice[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const today = toDateInputValue(new Date());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const marketPeriodId = String(formData.get("market_period_id") ?? "");
    const purchasedOn = String(formData.get("purchased_on") ?? "");
    const vendor = String(formData.get("vendor") ?? "").trim();
    const purchaseType = String(formData.get("purchase_type") ?? "main");
    const invoiceId = String(formData.get("invoice_id") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();

    if (!marketPeriodId || !purchasedOn) {
      setError("Selecciona una quincena y fecha de compra.");
      setLoading(false);
      return;
    }

    if (purchasedOn > today) {
      setError("La fecha de compra no puede ser posterior a hoy.");
      setLoading(false);
      return;
    }

    const selectedPeriod = periods.find((period) => period.id === marketPeriodId);
    if (selectedPeriod && (purchasedOn < selectedPeriod.starts_on || purchasedOn > selectedPeriod.ends_on)) {
      setWarning("La fecha de compra está fuera del rango de la quincena seleccionada. Se guardará de todas formas porque las quincenas pueden ser flexibles.");
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("market_purchases").insert({
        family_id: familyId,
        market_period_id: marketPeriodId,
        purchased_on: purchasedOn,
        vendor: vendor || null,
        purchase_type: purchaseType,
        invoice_id: invoiceId || null,
        notes: notes || null,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      });

      if (error) throw error;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear la compra. Revisa fecha, quincena, factura y conexión."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="purchase-period">Quincena</label>
        <Select id="purchase-period" name="market_period_id" defaultValue={selectedPeriodId ?? ""} required>
          <option value="">Selecciona una quincena</option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>{period.name}</option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="purchase-date">Fecha de compra</label>
          <Input id="purchase-date" name="purchased_on" type="date" defaultValue={today} max={today} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="purchase-type">Tipo</label>
          <Select id="purchase-type" name="purchase_type" defaultValue="main">
            <option value="main">Compra principal</option>
            <option value="sporadic">Compra esporádica</option>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="purchase-vendor">Lugar/proveedor</label>
          <Input id="purchase-vendor" name="vendor" placeholder="Ej.: Éxito, D1, plaza" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="purchase-invoice">Factura opcional</label>
          <Select id="purchase-invoice" name="invoice_id" defaultValue="">
            <option value="">Sin factura asociada</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>{invoice.invoice_code}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="purchase-notes">Notas</label>
        <Textarea id="purchase-notes" name="notes" placeholder="Ej.: compra quincenal principal" />
      </div>
      {warning ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{warning}</p> : null}
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading || periods.length === 0}>{loading ? "Guardando..." : "Crear compra"}</Button>
    </form>
  );
}
