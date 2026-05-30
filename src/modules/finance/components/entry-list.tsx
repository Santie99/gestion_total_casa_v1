"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { FinanceEntry } from "../types";

export function EntryList({ entries, type }: { entries: FinanceEntry[]; type: "income" | "expense" }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const table = type === "income" ? "income_entries" : "expense_entries";
    await supabase.from(table).delete().eq("id", id);
    setDeletingId(null);
    router.refresh();
  }

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay movimientos registrados en este mes.</p>;
  }

  return (
    <div className="divide-y rounded-2xl border bg-white">
      {entries.map((entry) => (
        <div key={entry.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-medium">{entry.description || "Movimiento sin descripción"}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(entry.occurred_on)} · {entry.categories?.name ?? "Sin categoría"}
            </p>
          </div>
          <div className="flex items-center gap-3 sm:justify-end">
            <p className="font-semibold">{formatCurrency(entry.amount)}</p>
            <Button variant="ghost" size="sm" disabled={deletingId === entry.id} onClick={() => handleDelete(entry.id)}>
              Eliminar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
