import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AgentTabs } from "@/components/agent/AgentTabs";
import { Badge } from "@/components/Badge";

export default async function AgentPropertiesPage() {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["agent", "admin"]);

  const supabase = createSupabaseServer();
  const { data: props } = await supabase
    .from("properties_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-500">Navigation</div>
            <div className="mt-2"><AgentTabs active="properties" /></div>
          </div>
          <Link className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800" href="/app/agent/properties/new">
            + Créer un nouveau logement
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Logements</h2>
            <p className="mt-1 text-sm text-zinc-600">Clique sur un logement pour le modifier.</p>
          </div>
          <div className="text-xs text-zinc-500">{(props ?? []).length} logement(s)</div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {(props ?? []).map((p: any) => (
            <Link key={p.id} href={`/app/agent/properties/${p.id}`} className="rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{p.title}</div>
                  <div className="text-xs text-zinc-500">{p.city}{p.zip ? ` (${p.zip})` : ""}</div>
                </div>
                <Badge>{p.status}</Badge>
              </div>
              <div className="mt-2 text-xs text-zinc-600">
                {p.price ? `${p.price} €` : "—"} · {p.surface ? `${p.surface} m²` : "—"} · {p.rooms ? `${p.rooms} pièces` : "—"} {p.type ? `· ${p.type}` : ""}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
