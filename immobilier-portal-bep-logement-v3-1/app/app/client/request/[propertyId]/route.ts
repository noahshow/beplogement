import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getUserWithRole, assertRole } from "@/lib/auth";

export async function POST(_: Request, { params }: { params: { propertyId: string } }) {
  const { user, role } = await getUserWithRole();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  assertRole(role, ["client"]);

  const supabase = createSupabaseServer();
  const { error } = await supabase.from("contact_requests").insert({
    client_id: user.id,
    property_id: params.propertyId,
    status: "pending",
  });

  // Ignore duplicates (unique constraint)
  if (error && !String(error.message).toLowerCase().includes("duplicate")) {
    return NextResponse.redirect(new URL("/app/client/requests?e=1", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  }

  return NextResponse.redirect(new URL("/app/client/requests", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
