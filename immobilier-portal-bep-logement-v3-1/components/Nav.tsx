import Link from "next/link";
import Image from "next/image";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Container } from "@/components/Container";

export async function Nav() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="border-b border-zinc-200 bg-white">
      <Container>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="BEP Logement" width={36} height={36} className="h-9 w-9 rounded-2xl bg-white object-contain p-1 ring-1 ring-zinc-200" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">{process.env.NEXT_PUBLIC_APP_NAME ?? "Portail Abonnés"}</div>
              <div className="text-xs text-zinc-500">Espace abonnés & agence</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <Link className="text-zinc-700 hover:text-zinc-900" href="/app">Tableau de bord</Link>
                <form action="/auth/signout" method="post">
                  <button className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-200">
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <Link className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800" href="/login">
                Connexion
              </Link>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
