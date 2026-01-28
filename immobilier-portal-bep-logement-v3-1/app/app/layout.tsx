import { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { getUserWithRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, fullName } = await getUserWithRole();
  if (!user) redirect("/login");

  return (
    <Container>
      <div className="mt-6">
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-zinc-500">Connecté en tant que</div>
            <div className="text-lg font-semibold">{fullName ?? user.email}</div>
            <div className="text-sm text-zinc-600">Rôle : <span className="font-semibold">{role}</span></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-200" href="/app">
              Accueil
            </Link>
            {role === "client" ? (
              <>
                <Link className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-200" href="/app/client">
                  Biens
                </Link>
                <Link className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-200" href="/app/client/requests">
                  Mes demandes
                </Link>
              </>
            ) : (
              <>
                <Link className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-200" href="/app/agent/properties">
                  Tableau agent
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </Container>
  );
}
