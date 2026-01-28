import Link from "next/link";

export function AgentTabs({ active }: { active: "properties" | "clients" | "owners" | "requests" }) {
  const tab = (key: typeof active, label: string, href: string) => {
    const is = active === key;
    return (
      <Link
        href={href}
        className={
          "rounded-xl px-3 py-2 text-sm font-semibold transition " +
          (is ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200")
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tab("properties", "Logements", "/app/agent/properties")}
      {tab("clients", "Clients", "/app/agent/clients")}
      {tab("owners", "Propriétaires", "/app/agent/owners")}
      {tab("requests", "Demandes", "/app/agent/requests")}
    </div>
  );
}
