"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "../types";

export function EntryForm({
  familyId,
  memberId,
  categories,
  type,
}: {
  familyId: string;
  memberId: string;
  categories: Category[];
  type: "income" | "expense";
}) {
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
    const amount = Number(formData.get("amount"));
    const occurredOn = String(formData.get("occurred_on"));
    const categoryId = String(formData.get("category_id") ?? "");
    const description = String(formData.get("description") ?? "").trim();

    if (!amount || amount <= 0) {
      setError("El monto debe ser mayor a cero.");
      setLoading(false);
      return;
    }

    if (!occurredOn) {
      setError("Selecciona la fecha real del movimiento.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const table = type === "income" ? "income_entries" : "expense_entries";
    const { error } = await supabase.from(table).insert({
      family_id: familyId,
      member_id: memberId,
      category_id: categoryId || null,
      amount,
      occurred_on: occurredOn,
      description: description || null,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      ...(type === "expense" ? { source_module: "manual" } : {}),
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    form.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`${type}-amount`}>Monto</label>
          <Input id={`${type}-amount`} name="amount" type="number" min="0" step="100" placeholder="0" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={`${type}-date`}>Fecha real</label>
          <Input id={`${type}-date`} name="occurred_on" type="date" defaultValue={today} required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${type}-category`}>Categoría</label>
        <Select id={`${type}-category`} name="category_id" defaultValue="">
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${type}-description`}>Descripción</label>
        <Textarea id={`${type}-description`} name="description" placeholder={type === "income" ? "Ej.: salario de mayo" : "Ej.: pago recibo de luz"} />
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Guardando..." : "Guardar movimiento"}</Button>
    </form>
  );
}
