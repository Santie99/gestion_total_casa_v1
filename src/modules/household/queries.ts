import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentFamily() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member, error } = await supabase
    .from("family_members")
    .select("id, full_name, role, family_id, families(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!member) redirect("/register");

  const family = Array.isArray(member.families) ? member.families[0] : member.families;

  return {
    user,
    memberId: member.id as string,
    memberName: member.full_name as string,
    role: member.role as string,
    familyId: member.family_id as string,
    familyName: family?.name as string,
  };
}
