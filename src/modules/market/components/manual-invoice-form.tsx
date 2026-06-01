"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/dates";
import { getFriendlyErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export function ManualInvoiceForm({ familyId }: { familyId: string }) {
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
    const invoiceCode = String(formData.get("invoice_code") ?? "").trim();
    const invoiceDate = String(formData.get("invoice_date") ?? "");
    const vendor = String(formData.get("vendor") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!invoiceCode) {
      setError("Escribe el número único de factura.");
      setLoading(false);
      return;
    }

    if (invoiceDate && invoiceDate > today) {
      setError("La fecha de la factura no puede ser posterior a hoy.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("manual_invoices").insert({
        family_id: familyId,
        invoice_code: invoiceCode,
        invoice_date: invoiceDate || null,
        vendor: vendor || null,
        notes: notes || null,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      });

      if (error) throw error;

      form.reset();
      router.refresh();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "No se pudo crear la factura."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="invoice-code">Número único</label>
        <Input id="invoice-code" name="invoice_code" placeholder="Ej.: MERCADO-2026-Q1-001" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="invoice-date">Fecha</label>
          <Input id="invoice-date" name="invoice_date" type="date" defaultValue={today} max={today} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="invoice-vendor">Lugar/proveedor</label>
          <Input id="invoice-vendor" name="vendor" placeholder="Ej.: D1, Éxito, plaza" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="invoice-notes">Notas</label>
        <Textarea id="invoice-notes" name="notes" placeholder="Detalle físico de la factura o ubicación." />
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Crear factura"}</Button>
    </form>
  );
}
