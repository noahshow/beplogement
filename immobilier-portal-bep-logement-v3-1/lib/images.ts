import { createSupabaseServer } from "@/lib/supabase/server";

export async function getCoverUrl(path: string | null) {
  if (!path) return null;
  const supabase = createSupabaseServer();
  const { data } = await supabase.storage.from("property-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
