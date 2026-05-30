import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const items = ['Ingresos por persona', 'Ingresos por fuente', 'Periodicidad', 'Corte mensual', 'Comparativos'];

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Sprint 1</p>
        <h2 className="text-3xl font-bold tracking-tight">Ingresos</h2>
        <p className="mt-2 text-muted-foreground">Registro y análisis de entradas de dinero</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle>{item}</CardTitle>
              <CardDescription>Preparado para implementación por fases.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Esta tarjeta es un placeholder funcional de la arquitectura inicial.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
