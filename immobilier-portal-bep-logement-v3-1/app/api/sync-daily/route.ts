import { NextResponse } from "next/server";

/**
 * Endpoint placeholder pour un sync quotidien (à appeler via cron).
 * Exemple :
 * curl -X POST https://ton-site.vercel.app/api/sync-daily -H "x-sync-secret: ..."
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-sync-secret");
  if (!secret || secret !== process.env.DAILY_SYNC_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // TODO:
  // - récupérer un CSV / feed
  // - upsert dans properties
  // - archiver ceux qui ont disparu
  return NextResponse.json({ ok: true, message: "Sync placeholder (à implémenter selon votre source d'offres)." });
}
