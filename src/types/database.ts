export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type FamilyRole = "admin" | "member";

export type CategoryKind = "income" | "expense";

export type AppLayer = "finance" | "operations";
