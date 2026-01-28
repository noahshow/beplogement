"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Container } from "@/components/Container";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <Container>
      <div className="mx-auto mt-10 max-w-md">
        <div className="mb-4 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-700 p-[1px] shadow-sm">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
  <div className="h-11 w-11 overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200">
    <Image src="/logo.png" alt="BEP Logement" width={44} height={44} className="h-11 w-11 object-contain p-1" />
  </div>
  <div>
    <h1 className="text-xl font-semibold">BEP Logement</h1>
    <p className="mt-0.5 text-sm text-zinc-600">Portail abonnés</p>
  </div>
</div>
<p className="mt-4 text-sm text-zinc-600">
  Connecte-toi pour voir les logements correspondant à tes critères et demander les coordonnées propriétaires.
</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="client@email.com" required />
            </div>

            <div>
              <label className="text-sm font-medium">Mot de passe</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
            </div>

            {error ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

            <Button disabled={loading} type="submit" className="w-full">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 text-xs text-zinc-500">
            Astuce : le premier agent/admin se crée dans Supabase, puis on lui assigne un rôle dans la table <code>profiles</code>.
          </div>
        </div>
        </div>
      </div>
    </Container>
  );
}
