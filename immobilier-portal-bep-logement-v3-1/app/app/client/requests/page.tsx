import { redirect } from "next/navigation";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { Badge } from "@/components/Badge";

export default async function ClientRequests() {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["client"]);

  const supabase = createSupabaseServer();
  const { data: reqs } = await supabase
    .from("contact_requests")
    .select("id, status, created_at, property_id, properties_public (title, city, zip)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const { data: contacts } = await supabase
    .from("approved_owner_contacts")
    .select("property_id, owner_name, owner_phone, owner_email")
    .eq("client_id", user.id);

  const contactsByProperty = new Map<string, any>();
  for (const c of contacts ?? []) contactsByProperty.set(c.property_id, c);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mes demandes</h2>
          <p className="mt-1 text-sm text-zinc-600">Quand l’agence accepte, les coordonnées s’affichent ici.</p>
        </div>
        <Link className="text-sm" href="/app/client">← Retour aux biens</Link>
      </div>

      <div className="mt-6 space-y-3">
        {(reqs ?? []).length === 0 ? (
          <div className="text-sm text-zinc-600">Aucune demande pour le moment.</div>
        ) : (
          (reqs ?? []).map((r: any) => {
            const p = r.properties_public;
            const contact = contactsByProperty.get(r.property_id);
            return (
              <div key={r.id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{p?.title ?? "Bien"}</div>
                    <div className="text-xs text-zinc-500">{p?.city ?? ""}{p?.zip ? ` (${p.zip})` : ""}</div>
                  </div>
                  <Badge>{r.status}</Badge>
                </div>

                {r.status === "approved" && contact ? (
                  <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm">
                    <div><span className="font-semibold">Propriétaire :</span> {contact.owner_name ?? "—"}</div>
                    <div><span className="font-semibold">Téléphone :</span> {contact.owner_phone ?? "—"}</div>
                    <div><span className="font-semibold">Email :</span> {contact.owner_email ?? "—"}</div>
                  </div>
                ) : r.status === "rejected" ? (
                  <div className="mt-3 text-sm text-zinc-600">Demande refusée par l’agence.</div>
                ) : (
                  <div className="mt-3 text-sm text-zinc-600">En attente de validation.</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
