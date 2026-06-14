import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

const CreateInput = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.string().min(1, "Content required").max(1_000_000),
  language: z.string().trim().max(40).default("plaintext"),
  password: z.string().max(200).optional().nullable(),
  expires_at: z.string().datetime().nullable().optional(),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
});

const GetInput = z.object({
  id: z.string().trim().min(1).max(32),
  password: z.string().max(200).optional().nullable(),
});

const SearchInput = z.object({
  q: z.string().trim().max(100).default(""),
  limit: z.number().int().min(1).max(50).default(20),
});

const DeleteInput = z.object({
  id: z.string().trim().min(1).max(32),
  token: z.string().max(128).optional().nullable(),
});

const UpdateInput = z.object({
  id: z.string().trim().min(1).max(32),
  title: z.string().trim().max(200).optional(),
  content: z.string().min(1).max(1_000_000),
  language: z.string().trim().max(40).default("plaintext"),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  expires_at: z.string().datetime().nullable().optional(),
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

function makeToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getOptionalUserId(): Promise<string | null> {
  try {
    const auth = getRequestHeader("authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    const token = auth.slice(7);
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL!;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const c = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data, error } = await c.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export const createPaste = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => CreateInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await getOptionalUserId();

    if (data.visibility === "private" && !userId) {
      throw new Error("Sign in to create a private paste");
    }
    if (!userId && data.content.length > 100_000) {
      throw new Error("Anonymous pastes are limited to 100,000 characters. Sign in for the full 1M limit.");
    }

    let content_hash_for_log: string | null = null;
    let ip_for_log: string | null = null;
    if (!userId) {
      const ip = (getRequestIP({ xForwardedFor: true }) ?? "unknown").slice(0, 64);
      const content_hash = await sha256(data.content);
      ip_for_log = ip;
      content_hash_for_log = content_hash;
      await enforceAnonLimits(supabaseAdmin, ip, content_hash);
    }

    const password_hash = data.password ? await sha256(data.password) : null;
    const delete_token = userId ? null : makeToken();
    const delete_token_hash = delete_token ? await sha256(delete_token) : null;

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
          visibility: data.visibility,
          is_listed: data.visibility === "public" && !password_hash,
          expires_at: data.expires_at ?? null,
          owner_id: userId,
          delete_token_hash,
        })
        .select("id")
        .single();
      if (!error && row) return { id: row.id, delete_token };
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
    const userId = await getOptionalUserId();
    const { data: row, error } = await supabaseAdmin
      .from("pastes")
      .select("id,title,language,content,password_hash,expires_at,created_at,updated_at,views,visibility,owner_id")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { status: "not_found" as const };

    if (row.visibility === "private" && row.owner_id !== userId) {
      return { status: "not_found" as const };
    }

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
        updated_at: row.updated_at,
        views: (row.views ?? 0) + 1,
        is_protected: !!row.password_hash,
        visibility: row.visibility as "public" | "unlisted" | "private",
        is_owner: !!userId && row.owner_id === userId,
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
      .eq("visibility", "public")
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

export const deletePaste = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => DeleteInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await getOptionalUserId();
    const { data: row, error } = await supabaseAdmin
      .from("pastes")
      .select("id,owner_id,delete_token_hash")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Paste not found");

    let allowed = false;
    if (userId && row.owner_id === userId) allowed = true;
    if (!allowed && data.token && row.delete_token_hash) {
      const h = await sha256(data.token);
      if (h === row.delete_token_hash) allowed = true;
    }
    if (!allowed) throw new Error("You don't have permission to delete this paste");

    const { error: delErr } = await supabaseAdmin.from("pastes").delete().eq("id", data.id);
    if (delErr) throw new Error(delErr.message);
    return { ok: true };
  });

export const updatePaste = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => UpdateInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await getOptionalUserId();
    if (!userId) throw new Error("Sign in required");

    const { data: row, error } = await supabaseAdmin
      .from("pastes")
      .select("id,owner_id,title,content,language")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Paste not found");
    if (row.owner_id !== userId) throw new Error("Not your paste");

    // Snapshot previous version
    const { data: vrow } = await supabaseAdmin
      .from("paste_versions")
      .select("version")
      .eq("paste_id", data.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (vrow?.version ?? 0) + 1;

    await supabaseAdmin.from("paste_versions").insert({
      paste_id: data.id,
      version: nextVersion,
      title: row.title,
      content: row.content,
      language: row.language,
    });

    const { error: updErr } = await supabaseAdmin
      .from("pastes")
      .update({
        title: data.title?.trim() || "Untitled",
        content: data.content,
        language: data.language,
        visibility: data.visibility,
        is_listed: data.visibility === "public",
        expires_at: data.expires_at ?? null,
      })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);
    return { ok: true, version: nextVersion };
  });

export const listMyPastes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ q: z.string().trim().max(100).optional() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await getOptionalUserId();
    if (!userId) throw new Error("Sign in required");

    let q = supabaseAdmin
      .from("pastes")
      .select("id,title,language,visibility,views,created_at,updated_at,expires_at")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (data.q) q = q.ilike("title", `%${data.q.replace(/[%_]/g, "")}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { results: rows ?? [] };
  });

export const getPasteVersions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1).max(32) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = await getOptionalUserId();
    if (!userId) throw new Error("Sign in required");

    const { data: paste } = await supabaseAdmin
      .from("pastes")
      .select("owner_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!paste || paste.owner_id !== userId) throw new Error("Not allowed");

    const { data: rows, error } = await supabaseAdmin
      .from("paste_versions")
      .select("version,title,content,language,created_at")
      .eq("paste_id", data.id)
      .order("version", { ascending: false });
    if (error) throw new Error(error.message);
    return { versions: rows ?? [] };
  });
