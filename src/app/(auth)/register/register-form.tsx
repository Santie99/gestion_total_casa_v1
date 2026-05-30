"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const fullName = String(formData.get("fullName"));
    const familyName = String(formData.get("familyName"));
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, family_name: familyName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setError("Cuenta creada. Confirma el correo o desactiva temporalmente la confirmación de email en Supabase para desarrollo.");
      setLoading(false);
      return;
    }

    const { error: familyError } = await supabase.rpc("create_family_for_current_user", {
      family_name: familyName,
      member_full_name: fullName,
    });

    if (familyError) {
      setError(familyError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="familyName">Nombre de la familia</label>
        <Input id="familyName" name="familyName" required placeholder="Familia Bernal" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="fullName">Tu nombre</label>
        <Input id="fullName" name="fullName" required placeholder="Santie Bernal" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <Input id="email" name="email" type="email" required placeholder="correo@ejemplo.com" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">Contraseña</label>
        <Input id="password" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Creando..." : "Crear familia"}</Button>
    </form>
  );
}
