import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AgentTabs } from "@/components/agent/AgentTabs";
import { Badge } from "@/components/Badge";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { upsertCriteria } from "@/lib/agent/actions";

export default async function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["agent", "admin"]);

  const supabase = createSupabaseServer();

  const { data: profile } = await supabase.from("profiles").select("id, full_name, role, created_at").eq("id", params.clientId).single();
  const { data: criteria } = await supabase.from("search_criteria").select("*").eq("client_id", params.clientId).maybeSingle();
  const { data: subs } = await supabase.from("subscriptions").select("*").eq("client_id", params.clientId).order("created_at", { ascending: false }).limit(5);
  const { data: reqs } = await supabase
    .from("contact_requests")
    .select("id, status, created_at, property_id, properties_public(title, city, zip)")
    .eq("client_id", params.clientId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!profile) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Client introuvable.</p>
        <Link className="text-sm" href="/app/agent/clients">← Retour</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-500">Navigation</div>
            <div className="mt-2"><AgentTabs active="clients" /></div>
          </div>
          <Link className="text-sm" href="/app/agent/clients">← Retour</Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{profile.full_name ?? "Client"}</h2>
            <div className="mt-1 text-xs text-zinc-500">ID: {profile.id}</div>
          </div>
          <Badge>{profile.role}</Badge>
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold">Abonnement</div>
          <div className="mt-2 space-y-2 text-sm text-zinc-700">
            {(subs ?? []).length ? (subs ?? []).map((s: any) => (
              <div key={s.id} className="rounded-xl bg-zinc-50 p-3">
                <div><span className="font-semibold">Statut:</span> {s.status}</div>
                <div><span className="font-semibold">Début:</span> {s.starts_at}</div>
                <div><span className="font-semibold">Fin:</span> {s.ends_at ?? "—"}</div>
              </div>
            )) : <div className="text-sm text-zinc-600">Aucun abonnement enregistré.</div>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Critères</h2>
        <p className="mt-1 text-sm text-zinc-600">Modifie les critères puis enregistre.</p>

        <form action={upsertCriteria} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input type="hidden" name="client_id" value={profile.id} />
          <div>
            <label className="text-sm font-medium">Ville</label>
            <Input name="city" defaultValue={criteria?.city ?? ""} placeholder="Paris" />
          </div>
          <div>
            <label className="text-sm font-medium">Budget max (€)</label>
            <Input name="max_price" defaultValue={criteria?.max_price ?? ""} placeholder="1500" />
          </div>
          <div>
            <label className="text-sm font-medium">Surface min (m²)</label>
            <Input name="min_surface" defaultValue={criteria?.min_surface ?? ""} placeholder="20" />
          </div>
          <div>
            <label className="text-sm font-medium">Pièces min</label>
            <Input name="min_rooms" defaultValue={criteria?.min_rooms ?? ""} placeholder="1" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Types (virgules)</label>
            <Input name="property_types" defaultValue={(criteria?.property_types ?? []).join(", ")} placeholder="studio, t2, t3" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Enregistrer critères</Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Historique des demandes</h2>
        <p className="mt-1 text-sm text-zinc-600">Demandes de coordonnées effectuées par ce client.</p>

        <div className="mt-4 space-y-3">
          {(reqs ?? []).length === 0 ? (
            <div className="text-sm text-zinc-600">Aucune demande.</div>
          ) : (
            (reqs ?? []).map((r: any) => (
              <div key={r.id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{r.properties_public?.title ?? "Bien"}</div>
                    <div className="text-xs text-zinc-500">{r.properties_public?.city ?? ""}{r.properties_public?.zip ? ` (${r.properties_public.zip})` : ""}</div>
                  </div>
                  <Badge>{r.status}</Badge>
                </div>
                <div className="mt-2 text-xs text-zinc-500">{r.created_at}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
