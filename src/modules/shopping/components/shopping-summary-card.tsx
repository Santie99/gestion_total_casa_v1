export function ShoppingSummaryCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
