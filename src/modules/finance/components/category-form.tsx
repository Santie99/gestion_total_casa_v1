"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function CategoryForm({ familyId, kind }: { familyId: string; kind: "income" | "expense" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      setError("Escribe el nombre de la categoría.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("categories").insert({
      family_id: familyId,
      name,
      kind,
      layer: "finance",
    });

    if (error) {
      setError(error.message.includes("duplicate") ? "Esa categoría ya existe." : error.message);
      setLoading(false);
      return;
    }

    form.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${kind}-category-name`}>
          Nueva categoría
        </label>
        <Input id={`${kind}-category-name`} name="name" placeholder={kind === "income" ? "Salario" : "Servicios"} />
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" variant="outline" disabled={loading}>
        {loading ? "Creando..." : "Crear categoría"}
      </Button>
    </form>
  );
}
