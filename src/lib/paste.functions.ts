import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CreateInput = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.string().min(1, "Content required").max(1_000_000),
  language: z.string().trim().max(40).default("plaintext"),
  password: z.string().max(200).optional().nullable(),
  expires_at: z.string().datetime().nullable().optional(),
  is_listed: z.boolean().default(true),
});

const GetInput = z.object({
  id: z.string().trim().min(1).max(32),
  password: z.string().max(200).optional().nullable(),
});

const SearchInput = z.object({
  q: z.string().trim().max(100).default(""),
  limit: z.number().int().min(1).max(50).default(20),
});

async function sha256(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function makeSlug(len = 8): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export const createPaste = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CreateInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password_hash = data.password ? await sha256(data.password) : null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const id = makeSlug(8);
      const { data: row, error } = await supabaseAdmin
        .from("pastes")
        .insert({
          id,
          title: data.title?.trim() || "Untitled",
          content: data.content,
          language: data.language || "plaintext",
          password_hash,
          is_listed: data.is_listed && !password_hash,
          expires_at: data.expires_at ?? null,
        })
        .select("id")
        .single();
      if (!error && row) return { id: row.id };
      if (error && !error.message.includes("duplicate")) {
        throw new Error(error.message);
      }
    }
    throw new Error("Could not allocate a unique paste id");
  });

export const getPaste = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => GetInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("pastes")
      .select("id,title,language,content,password_hash,expires_at,created_at,views,is_listed")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { status: "not_found" as const };

    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return { status: "expired" as const };
    }

    if (row.password_hash) {
      if (!data.password) {
        return {
          status: "password_required" as const,
          meta: { id: row.id, title: row.title, language: row.language, created_at: row.created_at },
        };
      }
      const hash = await sha256(data.password);
      if (hash !== row.password_hash) {
        return { status: "password_invalid" as const };
      }
    }

    // best-effort view increment
    void supabaseAdmin
      .from("pastes")
      .update({ views: (row.views ?? 0) + 1 })
      .eq("id", row.id)
      .then(() => undefined);

    return {
      status: "ok" as const,
      paste: {
        id: row.id,
        title: row.title,
        language: row.language,
        content: row.content,
        expires_at: row.expires_at,
        created_at: row.created_at,
        views: (row.views ?? 0) + 1,
        is_protected: !!row.password_hash,
      },
    };
  });

export const searchPastes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SearchInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();
    let query = supabaseAdmin
      .from("pastes")
      .select("id,title,language,created_at,expires_at,views")
      .eq("is_listed", true)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.q) {
      query = query.ilike("title", `%${data.q.replace(/[%_]/g, "")}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { results: rows ?? [] };
  });
