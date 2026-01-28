import Image from "next/image";
import { Badge } from "@/components/Badge";

export type PropertyPublic = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  zip: string | null;
  price: number | null;
  surface: number | null;
  rooms: number | null;
  type: string | null;
  status: "active" | "rented" | "archived";
  created_at: string;
  updated_at: string;
  cover_url?: string | null;
};

export function PropertyCard({ p, footer }: { p: PropertyPublic; footer?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative aspect-[16/9] bg-zinc-100">
        {p.cover_url ? (
          <Image src={p.cover_url} alt={p.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            Pas de photo
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{p.title}</div>
            <div className="text-xs text-zinc-500">{p.city}{p.zip ? ` (${p.zip})` : ""}</div>
          </div>
          <Badge>{p.status}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-700">
          {p.price !== null && <Badge>{p.price} €</Badge>}
          {p.surface !== null && <Badge>{p.surface} m²</Badge>}
          {p.rooms !== null && <Badge>{p.rooms} pièce(s)</Badge>}
          {p.type && <Badge>{p.type}</Badge>}
        </div>

        {p.description ? (
          <p className="mt-3 line-clamp-3 text-sm text-zinc-700">{p.description}</p>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">Aucune description</p>
        )}

        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
