import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AiReadinessCard() {
  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle>Endpoint IA preparado</CardTitle>
        <CardDescription>Sprint 16 no conecta IA externa. Solo deja lista la estructura interna para una capa futura.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-purple-950">
        <p>
          El endpoint interno queda en <code className="rounded bg-white/70 px-1 py-0.5">/api/insights/draft</code>. Recibe contexto e insights determinísticos y devuelve un payload preparado.
        </p>
        <p>
          Más adelante podremos conectar un proveedor IA para redactar recomendaciones en lenguaje natural, sin cambiar la lógica base ni depender de IA para cálculos críticos.
        </p>
      </CardContent>
    </Card>
  );
}
