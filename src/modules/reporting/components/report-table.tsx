import { formatCurrency, formatPercent } from "@/lib/formatters";

type NumericColumn = "amount" | "percentage" | "currencyOrNull" | "plain";

export function ReportTable<T extends Record<string, unknown>>({
  rows,
  columns,
  emptyMessage,
}: {
  rows: T[];
  columns: Array<{ key: keyof T; label: string; type?: NumericColumn }>;
  emptyMessage: string;
}) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  function formatValue(value: unknown, type?: NumericColumn) {
    if (type === "amount") return formatCurrency(Number(value ?? 0));
    if (type === "currencyOrNull") return value === null || value === undefined ? "—" : formatCurrency(Number(value));
    if (type === "percentage") return formatPercent(Number(value ?? 0));
    return String(value ?? "—");
  }

  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3">
                  {formatValue(row[column.key], column.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
