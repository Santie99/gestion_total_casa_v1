export function StockSummaryCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
