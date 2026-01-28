"use client";

import { useFormState } from "react-dom";
import { createClientAccount } from "@/lib/agent/actions";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

type State = { ok?: boolean; error?: string; userId?: string } | null;

export function CreateClientForm() {
  const [state, formAction] = useFormState<State, FormData>(async (_prev, formData) => {
    const res = await createClientAccount(formData);
    return res as any;
  }, null);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Créer un client</h2>
      <p className="mt-1 text-sm text-zinc-600">Crée un compte abonné (email + mot de passe).</p>

      <form action={formAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Email</label>
          <Input name="email" type="email" required placeholder="client@email.com" />
        </div>
        <div>
          <label className="text-sm font-medium">Mot de passe</label>
          <Input name="password" type="text" required placeholder="min 6 caractères" />
        </div>
        <div>
          <label className="text-sm font-medium">Nom</label>
          <Input name="full_name" type="text" placeholder="(optionnel)" />
        </div>

        <div className="md:col-span-4">
          <Button type="submit">Créer le compte</Button>
        </div>
      </form>

      {state?.ok ? (
        <div className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
          ✅ Compte créé. ID: <span className="font-mono text-xs">{state.userId}</span>
        </div>
      ) : state?.error ? (
        <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          ❌ {state.error}
        </div>
      ) : (
        <div className="mt-3 text-xs text-zinc-500">
          ⚠️ Nécessite la variable Vercel <code>SUPABASE_SERVICE_ROLE_KEY</code>.
        </div>
      )}
    </div>
  );
}
