import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AgentTabs } from "@/components/agent/AgentTabs";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import { updateProperty, setPropertyStatus } from "@/lib/agent/actions";
import { Badge } from "@/components/Badge";

export default async function EditPropertyPage({ params }: { params: { propertyId: string } }) {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["agent", "admin"]);

  const supabase = createSupabaseServer();
  const { data: prop, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.propertyId)
    .single();

  if (error || !prop) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-700">Logement introuvable.</p>
        <Link className="text-sm" href="/app/agent/properties">← Retour</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-500">Navigation</div>
            <div className="mt-2"><AgentTabs active="properties" /></div>
          </div>
          <Link className="text-sm" href="/app/agent/properties">← Retour</Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Modifier logement</h2>
            <p className="mt-1 text-sm text-zinc-600">{prop.city}{prop.zip ? ` (${prop.zip})` : ""}</p>
          </div>
          <Badge>{prop.status}</Badge>
        </div>

        <form action={updateProperty} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input type="hidden" name="property_id" value={prop.id} />

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Titre</label>
            <Input name="title" required defaultValue={prop.title ?? ""} />
          </div>

          <div>
            <label className="text-sm font-medium">Ville</label>
            <Input name="city" required defaultValue={prop.city ?? ""} />
          </div>
          <div>
            <label className="text-sm font-medium">Code postal</label>
            <Input name="zip" defaultValue={prop.zip ?? ""} />
          </div>

          <div>
            <label className="text-sm font-medium">Prix (€)</label>
            <Input name="price" defaultValue={prop.price ?? ""} />
          </div>
          <div>
            <label className="text-sm font-medium">Surface (m²)</label>
            <Input name="surface" defaultValue={prop.surface ?? ""} />
          </div>

          <div>
            <label className="text-sm font-medium">Pièces</label>
            <Input name="rooms" defaultValue={prop.rooms ?? ""} />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <Input name="type" defaultValue={prop.type ?? ""} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea name="description" rows={5} defaultValue={prop.description ?? ""} />
          </div>

          <div>
            <label className="text-sm font-medium">Nom propriétaire</label>
            <Input name="owner_name" defaultValue={prop.owner_name ?? ""} />
          </div>
          <div>
            <label className="text-sm font-medium">Téléphone propriétaire</label>
            <Input name="owner_phone" defaultValue={prop.owner_phone ?? ""} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Email propriétaire</label>
            <Input name="owner_email" defaultValue={prop.owner_email ?? ""} />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Statut</label>
            <select name="status" defaultValue={prop.status ?? "active"} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm">
              <option value="active">active</option>
              <option value="rented">rented</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button type="submit">Enregistrer modifications</Button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Actions rapides</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={setPropertyStatus}>
              <input type="hidden" name="property_id" value={prop.id} />
              <input type="hidden" name="status" value="archived" />
              <Button type="submit" variant="secondary">Archiver</Button>
            </form>
            <form action={setPropertyStatus}>
              <input type="hidden" name="property_id" value={prop.id} />
              <input type="hidden" name="status" value="active" />
              <Button type="submit" variant="secondary">Remettre actif</Button>
            </form>
            <form action={setPropertyStatus}>
              <input type="hidden" name="property_id" value={prop.id} />
              <input type="hidden" name="status" value="rented" />
              <Button type="submit" variant="secondary">Marquer loué</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
