import { redirect } from "next/navigation";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AgentTabs } from "@/components/agent/AgentTabs";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { decideRequest } from "@/lib/agent/actions";

export default async function AgentRequestsPage() {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["agent", "admin"]);

  const supabase = createSupabaseServer();
  const { data: requests } = await supabase
    .from("contact_requests")
    .select("id, status, created_at, client_id, property_id, profiles!contact_requests_client_id_fkey(full_name), properties_public(title, city, zip)")
    .order("created_at", { ascending: false })
    .limit(300);

  const pending = (requests ?? []).filter((r: any) => r.status === "pending");
  const decided = (requests ?? []).filter((r: any) => r.status !== "pending");

  const card = (r: any) => (
    <div key={r.id} className="rounded-2xl border border-zinc-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{r.properties_public?.title ?? "Bien"}</div>
          <div className="text-xs text-zinc-500">
            Client : {r.profiles?.full_name ?? r.client_id} · {r.properties_public?.city ?? ""}{r.properties_public?.zip ? ` (${r.properties_public.zip})` : ""}
          </div>
        </div>
        <Badge>{r.status}</Badge>
      </div>

      {r.status === "pending" ? (
        <form action={decideRequest} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="request_id" value={r.id} />
          <Button name="decision" value="approved" type="submit">Accepter</Button>
          <Button name="decision" value="rejected" variant="secondary" type="submit">Refuser</Button>
        </form>
      ) : (
        <div className="mt-3 text-sm text-zinc-600">Décision enregistrée.</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-500">Navigation</div>
            <div className="mt-2"><AgentTabs active="requests" /></div>
          </div>
          <div className="text-xs text-zinc-500">{(requests ?? []).length} demande(s)</div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">En attente</h2>
        <div className="mt-4 space-y-3">
          {pending.length ? pending.map(card) : <div className="text-sm text-zinc-600">Aucune demande en attente.</div>}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Historique</h2>
        <div className="mt-4 space-y-3">
          {decided.length ? decided.map(card) : <div className="text-sm text-zinc-600">Aucune demande traitée.</div>}
        </div>
      </div>
    </div>
  );
}
