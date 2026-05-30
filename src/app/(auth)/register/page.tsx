import Link from "next/link";
import { RegisterForm } from "./register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear familia</CardTitle>
          <CardDescription>Crea el primer usuario administrador de la familia.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-4 text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link className="font-medium text-slate-900 underline" href="/login">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
