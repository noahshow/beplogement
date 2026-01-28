import { redirect } from "next/navigation";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { AgentTabs } from "@/components/agent/AgentTabs";

export default async function AgentOwnersPage() {
  const { user, role } = await getUserWithRole();
  if (!user) redirect("/login");
  assertRole(role, ["agent", "admin"]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-zinc-500">Navigation</div>
            <div className="mt-2"><AgentTabs active="owners" /></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Propriétaires</h2>
        <p className="mt-2 text-sm text-zinc-600">
          (MVP) Aujourd’hui, les coordonnées propriétaires sont stockées sur chaque logement.
          Si tu veux un vrai espace propriétaire (compte + accès + gestion de ses logements), je te le mets en V4 :
          on ajoutera un rôle <code>owner</code> et un lien logement → propriétaire.
        </p>
      </div>
    </div>
  );
}
