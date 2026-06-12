import { formatCurrency, formatDate } from "@/lib/formatters";
import type { AuditRecord } from "../types";

export function AuditTimeline({ records }: { records: AuditRecord[] }) {
  const visibleRecords = records.slice(0, 18);

  if (!visibleRecords.length) {
    return <p className="text-sm text-muted-foreground">No hay registros auditables para este periodo.</p>;
  }

  return (
    <div className="space-y-3">
      {visibleRecords.map((record) => (
        <div key={`${record.module}-${record.id}`} className="rounded-2xl border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{record.module}</p>
              <p className="mt-1 font-semibold">{record.title}</p>
              <p className="text-xs text-muted-foreground">{record.detail}</p>
            </div>
            <div className="text-left sm:text-right">
              {record.amount !== null ? <p className="text-sm font-semibold">{formatCurrency(record.amount)}</p> : null}
              {record.status ? <p className="text-xs text-muted-foreground">{record.status}</p> : null}
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <span>Fecha operación: {formatDate(record.occurredOn)}</span>
            <span>Creado en sistema: {record.createdAt ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.createdAt)) : "Sin dato"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
