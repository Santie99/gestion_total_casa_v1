"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

export function MemberForm({ familyId }: { familyId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = String(formData.get("full_name") ?? "").trim();
    const role = String(formData.get("role") ?? "member");

    if (!fullName) {
      setError("Escribe el nombre del miembro.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("family_members").insert({
      family_id: familyId,
      user_id: null,
      full_name: fullName,
      role,
      is_active: true,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    form.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-full-name">Nombre completo</label>
        <Input id="member-full-name" name="full_name" placeholder="Ej.: Papá" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="member-role">Rol interno</label>
        <Select id="member-role" name="role" defaultValue="member">
          <option value="member">Miembro</option>
          <option value="admin">Administrador</option>
        </Select>
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={loading}>{loading ? "Creando..." : "Crear miembro"}</Button>
    </form>
  );
}
