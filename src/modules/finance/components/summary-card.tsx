import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

export function SummaryCard({
  title,
  value,
  description,
  tone = "neutral",
}: {
  title: string;
  value: number;
  description: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass = tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-red-700" : "text-slate-950";

  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className={`text-2xl ${toneClass}`}>{formatCurrency(value)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
