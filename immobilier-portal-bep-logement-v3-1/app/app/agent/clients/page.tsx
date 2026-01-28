import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AgentTabs } from "@/components/agent/AgentTabs";
import { Badge } from "@/components/Badge";
import { CreateClientForm } from "@/components/agent/CreateClientForm";

export default async function AgentClientsPage() {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["agent", "admin"]);

  const supabase = createSupabaseServer();
  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-500">Navigation</div>
            <div className="mt-2"><AgentTabs active="clients" /></div>
          </div>
          <div className="text-xs text-zinc-500">{(clients ?? []).length} client(s)</div>
        </div>
      </div>

      <CreateClientForm />

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Clients</h2>
        <p className="mt-1 text-sm text-zinc-600">Accède à un client pour modifier ses critères et voir son historique.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {(clients ?? []).map((c) => (
            <Link key={c.id} href={`/app/agent/clients/${c.id}`} className="rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{c.full_name ?? "Client"}</div>
                  <div className="text-xs text-zinc-500">{c.id}</div>
                </div>
                <Badge>client</Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
