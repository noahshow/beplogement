import { redirect } from "next/navigation";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { PropertyCard, PropertyPublic } from "@/components/PropertyCard";
import { Button } from "@/components/Button";
import { getCoverUrl } from "@/lib/images";

async function getMatchedProperties(clientId: string) {
  const supabase = createSupabaseServer();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, ends_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const active = sub?.status === "active" && (!sub?.ends_at || new Date(sub.ends_at) >= new Date(new Date().toISOString().slice(0,10)));
  if (!active) return { active: false, criteria: null, properties: [] as PropertyPublic[] };

  const { data: criteria } = await supabase
    .from("search_criteria")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  // Fetch public properties
  const { data: props } = await supabase
    .from("properties_public")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const list = (props ?? []) as PropertyPublic[];

  // Fetch cover image path for each property (first image)
  const { data: images } = await supabase
    .from("property_images")
    .select("property_id, path, order_index")
    .order("order_index", { ascending: true });

  const coverById = new Map<string, string>();
  for (const img of images ?? []) {
    if (!coverById.has(img.property_id)) coverById.set(img.property_id, img.path);
  }

  // Apply criteria filtering in JS (MVP)
  const filtered = list.filter((p) => {
    if (!criteria) return true;
    if (criteria.city && p.city.toLowerCase() !== String(criteria.city).toLowerCase()) return false;
    if (criteria.min_price != null && p.price != null && p.price < criteria.min_price) return false;
    if (criteria.max_price != null && p.price != null && p.price > criteria.max_price) return false;
    if (criteria.min_surface != null && p.surface != null && p.surface < criteria.min_surface) return false;
    if (criteria.min_rooms != null && p.rooms != null && p.rooms < criteria.min_rooms) return false;
    const types = (criteria.property_types ?? []) as string[];
    if (types.length && p.type && !types.map(t=>t.toLowerCase()).includes(String(p.type).toLowerCase())) return false;
    return true;
  });

  // Signed cover urls
  const withCovers = await Promise.all(filtered.map(async (p) => {
    const coverPath = coverById.get(p.id) ?? null;
    const cover_url = await getCoverUrl(coverPath);
    return { ...p, cover_url };
  }));

  return { active: true, criteria, properties: withCovers };
}

export default async function ClientDashboard() {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["client"]);

  const { active, criteria, properties } = await getMatchedProperties(user.id);

  if (!active) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Abonnement inactif</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Ton abonnement n’est pas actif. Contacte l’agence pour réactiver l’accès.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Tes critères</h2>
        <div className="mt-3 text-sm text-zinc-700">
          <div><span className="font-semibold">Ville :</span> {criteria?.city ?? "—"}</div>
          <div><span className="font-semibold">Budget max :</span> {criteria?.max_price ?? "—"} €</div>
          <div><span className="font-semibold">Surface min :</span> {criteria?.min_surface ?? "—"} m²</div>
          <div><span className="font-semibold">Pièces min :</span> {criteria?.min_rooms ?? "—"}</div>
          <div><span className="font-semibold">Types :</span> {(criteria?.property_types?.length ? criteria.property_types.join(", ") : "—")}</div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Si tu veux modifier tes critères, contacte l’agence (MVP : modif côté agent).
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Logements disponibles ({properties.length})</h2>
          <div className="text-xs text-zinc-500">Mise à jour : quotidienne</div>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-sm text-zinc-600">
            Aucun logement ne correspond à tes critères pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard
                key={p.id}
                p={p}
                footer={
                  <form action={`/app/client/request/${p.id}`} method="post">
                    <Button type="submit" className="w-full">Demander coordonnées</Button>
                  </form>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
