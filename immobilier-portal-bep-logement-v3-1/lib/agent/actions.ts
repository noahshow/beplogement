"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getUserWithRole, assertRole } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const CreateClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1).max(100).optional(),
});

export async function createClientAccount(formData: FormData) {
  const { role } = await getUserWithRole();
  assertRole(role, ["agent", "admin"]);

  const parsed = CreateClientSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    full_name: String(formData.get("full_name") ?? "") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map(i => i.message).join(", ") };
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (error || !data.user) return { ok: false, error: error?.message ?? "Erreur création user" };

  const supabase = createSupabaseServer();
  const { error: pErr } = await supabase.from("profiles").insert({
    id: data.user.id,
    role: "client",
    full_name: parsed.data.full_name ?? null,
  });

  if (pErr) return { ok: false, error: pErr.message };

  // Create default subscription + empty criteria
 const starts = new Date();
const ends = new Date(starts);
ends.setMonth(ends.getMonth() + 5);

await supabase.from("subscriptions").insert({
  client_id: data.user.id,
  status: "active",
  paid_amount_eur: 210,
  starts_at: starts.toISOString().slice(0,10),
  ends_at: ends.toISOString().slice(0,10),
});

  await supabase.from("search_criteria").insert({ client_id: data.user.id, city: null });

  revalidatePath("/app/agent");
  return { ok: true, userId: data.user.id };
}

const CriteriaSchema = z.object({
  client_id: z.string().uuid(),
  city: z.string().optional(),
  max_price: z.coerce.number().int().optional().nullable(),
  min_surface: z.coerce.number().int().optional().nullable(),
  min_rooms: z.coerce.number().int().optional().nullable(),
  property_types: z.string().optional(), // comma-separated
});

export async function upsertCriteria(formData: FormData) {
  const { role } = await getUserWithRole();
  assertRole(role, ["agent", "admin"]);

  const parsed = CriteriaSchema.safeParse({
    client_id: String(formData.get("client_id") ?? ""),
    city: String(formData.get("city") ?? "") || undefined,
    max_price: formData.get("max_price") ? Number(formData.get("max_price")) : null,
    min_surface: formData.get("min_surface") ? Number(formData.get("min_surface")) : null,
    min_rooms: formData.get("min_rooms") ? Number(formData.get("min_rooms")) : null,
    property_types: String(formData.get("property_types") ?? "") || undefined,
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join(", ") };

  const types = parsed.data.property_types
    ? parsed.data.property_types.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const supabase = createSupabaseServer();
  const { error } = await supabase.from("search_criteria").upsert({
    client_id: parsed.data.client_id,
    city: parsed.data.city ?? null,
    max_price: parsed.data.max_price ?? null,
    min_surface: parsed.data.min_surface ?? null,
    min_rooms: parsed.data.min_rooms ?? null,
    property_types: types,
  }, { onConflict: "client_id" });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/agent");
  return { ok: true };
}

const PropertySchema = z.object({
  title: z.string().min(1),
  city: z.string().min(1),
  zip: z.string().optional(),
  price: z.coerce.number().int().optional().nullable(),
  surface: z.coerce.number().int().optional().nullable(),
  rooms: z.coerce.number().int().optional().nullable(),
  type: z.string().optional(),
  description: z.string().optional(),
  owner_name: z.string().optional(),
  owner_phone: z.string().optional(),
  owner_email: z.string().email().optional().or(z.literal("")),
});

export async function createProperty(formData: FormData) {
  const { role } = await getUserWithRole();
  assertRole(role, ["agent", "admin"]);

  const parsed = PropertySchema.safeParse({
    title: String(formData.get("title") ?? ""),
    city: String(formData.get("city") ?? ""),
    zip: String(formData.get("zip") ?? "") || undefined,
    price: formData.get("price") ? Number(formData.get("price")) : null,
    surface: formData.get("surface") ? Number(formData.get("surface")) : null,
    rooms: formData.get("rooms") ? Number(formData.get("rooms")) : null,
    type: String(formData.get("type") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    owner_name: String(formData.get("owner_name") ?? "") || undefined,
    owner_phone: String(formData.get("owner_phone") ?? "") || undefined,
    owner_email: String(formData.get("owner_email") ?? "") || "",
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join(", ") };

  const supabase = createSupabaseServer();
  const { data, error } = await supabase.from("properties").insert({
    title: parsed.data.title,
    city: parsed.data.city,
    zip: parsed.data.zip ?? null,
    price: parsed.data.price ?? null,
    surface: parsed.data.surface ?? null,
    rooms: parsed.data.rooms ?? null,
    type: parsed.data.type ?? null,
    description: parsed.data.description ?? null,
    owner_name: parsed.data.owner_name ?? null,
    owner_phone: parsed.data.owner_phone ?? null,
    owner_email: parsed.data.owner_email || null,
    status: "active",
  }).select("id").single();

  if (error || !data) return { ok: false, error: error?.message ?? "Erreur création bien" };

  // Handle images
  const files = formData.getAll("images") as File[];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f || typeof f.arrayBuffer !== "function" || f.size === 0) continue;

    const bytes = new Uint8Array(await f.arrayBuffer());
    const ext = f.type.includes("png") ? "png" : (f.type.includes("webp") ? "webp" : "jpg");
    const path = `${data.id}/${Date.now()}_${i}.${ext}`;

    const up = await supabase.storage.from("property-images").upload(path, bytes, {
      contentType: f.type || "image/jpeg",
      upsert: false,
    });

    if (!up.error) {
      await supabase.from("property_images").insert({
        property_id: data.id,
        path,
        order_index: i,
      });
    }
  }

  revalidatePath("/app/agent");
  return { ok: true, propertyId: data.id };
}

const DecideSchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export async function decideRequest(formData: FormData) {
  const { user, role } = await getUserWithRole();
  assertRole(role, ["agent", "admin"]);
  if (!user) return { ok: false, error: "Not authenticated" };

  const parsed = DecideSchema.safeParse({
    request_id: String(formData.get("request_id") ?? ""),
    decision: String(formData.get("decision") ?? "") as any,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join(", ") };

  const supabase = createSupabaseServer();
  const { error } = await supabase.from("contact_requests").update({
    status: parsed.data.decision,
    decided_by: user.id,
    decided_at: new Date().toISOString(),
  }).eq("id", parsed.data.request_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/agent");
  revalidatePath("/app/client/requests");
  return { ok: true };
}

const UpdatePropertySchema = z.object({
  property_id: z.string().uuid(),
  title: z.string().min(1),
  city: z.string().min(1),
  zip: z.string().optional(),
  price: z.coerce.number().int().optional().nullable(),
  surface: z.coerce.number().int().optional().nullable(),
  rooms: z.coerce.number().int().optional().nullable(),
  type: z.string().optional(),
  description: z.string().optional(),
  owner_name: z.string().optional(),
  owner_phone: z.string().optional(),
  owner_email: z.string().email().optional().or(z.literal("")),
  status: z.enum(["active","rented","archived"]).optional(),
});

export async function updateProperty(formData: FormData) {
  const { role } = await getUserWithRole();
  assertRole(role, ["agent", "admin"]);

  const parsed = UpdatePropertySchema.safeParse({
    property_id: String(formData.get("property_id") ?? ""),
    title: String(formData.get("title") ?? ""),
    city: String(formData.get("city") ?? ""),
    zip: String(formData.get("zip") ?? "") || undefined,
    price: formData.get("price") ? Number(formData.get("price")) : null,
    surface: formData.get("surface") ? Number(formData.get("surface")) : null,
    rooms: formData.get("rooms") ? Number(formData.get("rooms")) : null,
    type: String(formData.get("type") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    owner_name: String(formData.get("owner_name") ?? "") || undefined,
    owner_phone: String(formData.get("owner_phone") ?? "") || undefined,
    owner_email: String(formData.get("owner_email") ?? "") || "",
    status: (String(formData.get("status") ?? "") || undefined) as any,
  });

  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join(", ") };

  const supabase = createSupabaseServer();
  const { error } = await supabase.from("properties").update({
    title: parsed.data.title,
    city: parsed.data.city,
    zip: parsed.data.zip ?? null,
    price: parsed.data.price ?? null,
    surface: parsed.data.surface ?? null,
    rooms: parsed.data.rooms ?? null,
    type: parsed.data.type ?? null,
    description: parsed.data.description ?? null,
    owner_name: parsed.data.owner_name ?? null,
    owner_phone: parsed.data.owner_phone ?? null,
    owner_email: parsed.data.owner_email || null,
    status: parsed.data.status ?? undefined,
  }).eq("id", parsed.data.property_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/agent/properties");
  revalidatePath(`/app/agent/properties/${parsed.data.property_id}`);
  return { ok: true };
}

const SetPropertyStatusSchema = z.object({
  property_id: z.string().uuid(),
  status: z.enum(["active","rented","archived"]),
});

export async function setPropertyStatus(formData: FormData) {
  const { role } = await getUserWithRole();
  assertRole(role, ["agent", "admin"]);

  const parsed = SetPropertyStatusSchema.safeParse({
    property_id: String(formData.get("property_id") ?? ""),
    status: String(formData.get("status") ?? "") as any,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => i.message).join(", ") };

  const supabase = createSupabaseServer();
  const { error } = await supabase.from("properties").update({ status: parsed.data.status }).eq("id", parsed.data.property_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/agent/properties");
  revalidatePath(`/app/agent/properties/${parsed.data.property_id}`);
  return { ok: true };
}
