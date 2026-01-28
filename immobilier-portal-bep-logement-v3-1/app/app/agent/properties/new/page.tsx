import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { AgentTabs } from "@/components/agent/AgentTabs";
import { createProperty } from "@/lib/agent/actions";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";

export default async function NewPropertyPage() {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["agent", "admin"]);

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
        <h2 className="text-lg font-semibold">Créer un nouveau logement</h2>
        <p className="mt-1 text-sm text-zinc-600">Ajoute un logement + photos + coordonnées propriétaire (sensibles).</p>

        <form action={createProperty} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" encType="multipart/form-data">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Titre</label>
            <Input name="title" required placeholder="T2 lumineux proche métro" />
          </div>

          <div>
            <label className="text-sm font-medium">Ville</label>
            <Input name="city" required placeholder="Paris" />
          </div>
          <div>
            <label className="text-sm font-medium">Code postal</label>
            <Input name="zip" placeholder="75011" />
          </div>

          <div>
            <label className="text-sm font-medium">Prix (€)</label>
            <Input name="price" placeholder="1500" />
          </div>
          <div>
            <label className="text-sm font-medium">Surface (m²)</label>
            <Input name="surface" placeholder="35" />
          </div>

          <div>
            <label className="text-sm font-medium">Pièces</label>
            <Input name="rooms" placeholder="2" />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <Input name="type" placeholder="t2" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea name="description" rows={4} placeholder="Description du logement..." />
          </div>

          <div>
            <label className="text-sm font-medium">Nom propriétaire</label>
            <Input name="owner_name" placeholder="Mme Dupont" />
          </div>
          <div>
            <label className="text-sm font-medium">Téléphone propriétaire</label>
            <Input name="owner_phone" placeholder="+33 6 ..." />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Email propriétaire</label>
            <Input name="owner_email" placeholder="proprietaire@email.com" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Photos</label>
            <input className="block w-full text-sm" name="images" type="file" accept="image/*" multiple />
            <div className="mt-1 text-xs text-zinc-500">Tu peux sélectionner plusieurs images.</div>
          </div>

          <div className="md:col-span-2">
            <Button type="submit">Créer le logement</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
