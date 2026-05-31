"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMember } from "../types";

export function MemberList({ members, currentMemberId }: { members: FamilyMember[]; currentMemberId: string }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleMember(member: FamilyMember) {
    setUpdatingId(member.id);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("family_members")
      .update({ is_active: !member.is_active })
      .eq("id", member.id);

    if (error) {
      setError(error.message);
      setUpdatingId(null);
      return;
    }

    setUpdatingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div key={member.id} className="flex flex-col gap-3 rounded-2xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{member.full_name}</span>
              {member.id === currentMemberId ? <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">actual</span> : null}
              {!member.is_active ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">inactivo</span> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {member.role === "admin" ? "Administrador" : "Miembro"} · {member.user_id ? "con login" : "miembro interno"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={updatingId === member.id || member.id === currentMemberId}
            onClick={() => toggleMember(member)}
          >
            {member.is_active ? "Desactivar" : "Reactivar"}
          </Button>
        </div>
      ))}
      {members.length === 0 ? <p className="text-sm text-muted-foreground">No hay miembros creados.</p> : null}
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
