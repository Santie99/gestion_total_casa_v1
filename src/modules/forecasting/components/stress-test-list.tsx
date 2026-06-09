import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { StressTestResult } from "../types";

function severityClass(severity: StressTestResult["severity"]) {
  if (severity === "critical") return "border-red-200 bg-red-50 text-red-800";
  if (severity === "warning") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export function StressTestList({ tests }: { tests: StressTestResult[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stress testing doméstico</CardTitle>
        <CardDescription>Escenarios rápidos para medir resiliencia ante cambios de ingreso o gasto.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {tests.map((test) => (
            <div key={test.name} className={`rounded-2xl border p-4 ${severityClass(test.severity)}`}>
              <p className="font-semibold">{test.name}</p>
              <p className="mt-1 text-xs opacity-80">{test.description}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p>Flujo mensual: <span className="font-bold">{formatCurrency(test.projectedMonthlyNetFlow)}</span></p>
                <p>Runway: <span className="font-bold">{test.runwayMonths === null ? "No aplica" : `${test.runwayMonths.toFixed(1)} meses`}</span></p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
