import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col items-center justify-center text-center">
        <Card className="max-w-3xl">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Gestión Total del Hogar</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">Administra tu hogar como una operación inteligente.</h1>
          <p className="mb-8 text-base text-muted-foreground sm:text-lg">
            Finanzas familiares, mercado, stock, carro, objetivos y decisiones con enfoque CFO. Sprint 1: base técnica, login y estructura modular.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Crear familia</Link>
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
