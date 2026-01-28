import { createSupabaseServer } from "@/lib/supabase/server";

export type AppRole = "client" | "agent" | "admin";

export async function getUserWithRole() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as AppRole | null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (error) return { user, role: null as AppRole | null };

  return { user, role: profile.role as AppRole, fullName: profile.full_name as string | null };
}

export function assertRole(role: AppRole | null, allowed: AppRole[]) {
  if (!role || !allowed.includes(role)) {
    const err = new Error("FORBIDDEN");
    // @ts-ignore
    err.code = "FORBIDDEN";
    throw err;
  }
}
