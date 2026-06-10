import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.string().min(1).max(500_000),
  language: z.string().trim().max(40).optional(),
  expires_in_seconds: z.number().int().min(60).max(60 * 60 * 24 * 365).optional(),
  password: z.string().max(200).optional(),
  is_listed: z.boolean().optional(),
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
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

export const Route = createFileRoute("/api/v1/paste")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return Response.json(
          {
            name: "snip.ink public API",
            version: "1.0",
            endpoints: {
              create: { method: "POST", path: "/api/v1/paste" },
              read: { method: "GET", path: "/api/v1/paste/{id}" },
            },
            example: {
              curl: `curl -X POST ${origin}/api/v1/paste -H 'Content-Type: application/json' -d '{"content":"console.log(1)","language":"javascript"}'`,
            },
          },
          { headers: cors },
        );
      },

      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
        }
        const parsed = Body.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Validation failed", issues: parsed.error.issues },
            { status: 400, headers: cors },
          );
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const expires_at = parsed.data.expires_in_seconds
          ? new Date(Date.now() + parsed.data.expires_in_seconds * 1000).toISOString()
          : null;
        const password_hash = parsed.data.password ? await sha256(parsed.data.password) : null;

        for (let i = 0; i < 5; i++) {
          const id = makeSlug(8);
          const { data, error } = await supabaseAdmin
            .from("pastes")
            .insert({
              id,
              title: parsed.data.title?.trim() || "Untitled",
              content: parsed.data.content,
              language: parsed.data.language || "plaintext",
              password_hash,
              is_listed: (parsed.data.is_listed ?? true) && !password_hash,
              expires_at,
            })
            .select("id")
            .single();
          if (!error && data) {
            const origin = new URL(request.url).origin;
            return Response.json(
              { id: data.id, url: `${origin}/p/${data.id}` },
              { status: 201, headers: cors },
            );
          }
          if (error && !error.message.includes("duplicate")) {
            return Response.json({ error: error.message }, { status: 500, headers: cors });
          }
        }
        return Response.json({ error: "Could not allocate id" }, { status: 500, headers: cors });
      },
    },
  },
});
