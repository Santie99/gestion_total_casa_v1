import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarVehicle } from "../types";

export function VehicleList({ vehicles }: { vehicles: CarVehicle[] }) {
  if (!vehicles.length) {
    return <p className="text-sm text-muted-foreground">Aún no hay vehículos. Crea el primero para registrar gastos y vencimientos.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} className="p-4">
          <CardHeader className="mb-2">
            <CardTitle className="text-base">{vehicle.name}</CardTitle>
            <CardDescription>{vehicle.plate || "Sin placa"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{vehicle.brand || "Sin marca"}{vehicle.model_year ? ` · ${vehicle.model_year}` : ""}</p>
            <p>{vehicle.current_km !== null ? `${vehicle.current_km.toLocaleString("es-CO")} km` : "Kilometraje no registrado"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
