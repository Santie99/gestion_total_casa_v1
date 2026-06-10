import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, Lightbulb, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAreaLabel, getSeverityLabel } from "../calculations";
import type { HouseholdInsight, InsightSeverity } from "../types";

function severityClasses(severity: InsightSeverity) {
  const classes: Record<InsightSeverity, string> = {
    critical: "border-red-200 bg-red-50 text-red-900",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    info: "border-blue-200 bg-blue-50 text-blue-950",
    positive: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };
  return classes[severity];
}

function SeverityIcon({ severity }: { severity: InsightSeverity }) {
  if (severity === "critical") return <ShieldAlert className="h-5 w-5" />;
  if (severity === "warning") return <AlertTriangle className="h-5 w-5" />;
  if (severity === "positive") return <CheckCircle2 className="h-5 w-5" />;
  return <Info className="h-5 w-5" />;
}

export function InsightList({ insights }: { insights: HouseholdInsight[] }) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin insights por ahora</CardTitle>
          <CardDescription>Cuando haya datos suficientes, aquí aparecerán señales accionables.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {insights.map((insight) => (
        <Card key={insight.id} className={`border ${severityClasses(insight.severity)}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-white/70 p-2 shadow-sm">
                  <SeverityIcon severity={insight.severity} />
                </div>
                <div>
                  <CardTitle className="text-base">{insight.title}</CardTitle>
                  <CardDescription className="mt-1 text-xs text-current opacity-75">
                    {getAreaLabel(insight.area)} · {getSeverityLabel(insight.severity)}
                  </CardDescription>
                </div>
              </div>
              {insight.metricValue ? (
                <div className="rounded-2xl bg-white/70 px-3 py-2 text-right text-xs shadow-sm">
                  <p className="opacity-70">{insight.metricLabel}</p>
                  <p className="font-bold">{insight.metricValue}</p>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6">{insight.description}</p>
            <div className="rounded-2xl bg-white/70 p-3 text-sm shadow-sm">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{insight.recommendation}</p>
              </div>
            </div>
            {insight.actionHref ? (
              <Link href={insight.actionHref} className="inline-flex rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                {insight.actionLabel ?? "Revisar"}
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
