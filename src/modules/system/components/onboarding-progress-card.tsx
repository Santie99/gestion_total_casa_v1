import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  isComplete: boolean;
  requiredForStableUse?: boolean;
};

type OnboardingProgressCardProps = {
  steps: OnboardingStep[];
};

export function OnboardingProgressCard({ steps }: OnboardingProgressCardProps) {
  const requiredSteps = steps.filter((step) => step.requiredForStableUse !== false);
  const completedRequiredSteps = requiredSteps.filter((step) => step.isComplete).length;
  const progress = requiredSteps.length > 0 ? completedRequiredSteps / requiredSteps.length : 1;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Onboarding operativo</CardDescription>
        <CardTitle>Checklist inicial de uso real</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Avance de configuración estable</p>
              <p className="text-sm text-muted-foreground">
                {completedRequiredSteps} de {requiredSteps.length} pasos base completados.
              </p>
            </div>
            <p className="text-2xl font-bold">{Math.round(progress * 100)}%</p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white">
            <div className="h-2 rounded-full bg-slate-950 transition-all" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.isComplete ? CheckCircle2 : Circle;

            return (
              <div key={step.id} className="rounded-2xl border p-4">
                <div className="flex items-start gap-3">
                  <Icon className={step.isComplete ? "mt-0.5 h-5 w-5 text-emerald-700" : "mt-0.5 h-5 w-5 text-slate-400"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{step.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          step.isComplete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {step.isComplete ? "Completo" : "Pendiente"}
                      </span>
                    </div>
                    <Link
                      href={step.href}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold transition hover:bg-slate-50"
                    >
                      {step.actionLabel}
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
