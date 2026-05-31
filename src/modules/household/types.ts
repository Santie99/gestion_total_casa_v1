export type Family = {
  id: string;
  name: string;
  created_at: string;
};

export type FamilyMemberRole = "admin" | "member";

export type FamilyMember = {
  id: string;
  family_id: string;
  user_id: string | null;
  full_name: string;
  role: FamilyMemberRole;
  is_active: boolean;
  created_at: string;
};

export type FamilyMemberFormValues = {
  full_name: string;
  role: FamilyMemberRole;
};