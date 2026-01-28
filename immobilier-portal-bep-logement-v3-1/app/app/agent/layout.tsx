import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { AgentTabs } from "@/components/agent/AgentTabs";

export default async function AgentLayout({ children }: { children: ReactNode }) {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["agent", "admin"]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="text-sm text-zinc-500">Espace agence</div>
        {/* The active tab is set inside each page */}
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
