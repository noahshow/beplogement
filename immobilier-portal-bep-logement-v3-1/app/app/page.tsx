import { redirect } from "next/navigation";
import { getUserWithRole } from "@/lib/auth";

export default async function AppIndex() {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  if (role === "client") redirect("/app/client");
  if (role === "agent" || role === "admin") redirect("/app/agent");
  redirect("/login");
}
