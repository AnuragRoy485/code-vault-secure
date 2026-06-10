import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-paste-password, x-delete-token",
};

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/public/v1/paste/$id")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      GET: async ({ request, params }) => {
        const id = (params.id ?? "").slice(0, 32);
        if (!id) return Response.json({ error: "Missing id" }, { status: 400, headers: cors });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row, error } = await supabaseAdmin
          .from("pastes")
          .select("id,title,language,content,password_hash,expires_at,created_at,views,visibility")
          .eq("id", id)
          .maybeSingle();

        if (error) return Response.json({ error: error.message }, { status: 500, headers: cors });
        if (!row || row.visibility === "private") {
          return Response.json({ error: "Not found" }, { status: 404, headers: cors });
        }
        if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
          return Response.json({ error: "Expired" }, { status: 410, headers: cors });
        }
        if (row.password_hash) {
          const pw = request.headers.get("x-paste-password");
          if (!pw) return Response.json({ error: "Password required", password_required: true }, { status: 401, headers: cors });
          if ((await sha256(pw)) !== row.password_hash) {
            return Response.json({ error: "Invalid password" }, { status: 403, headers: cors });
          }
        }

        return Response.json(
          {
            id: row.id, title: row.title, language: row.language, content: row.content,
            created_at: row.created_at, expires_at: row.expires_at, views: row.views,
            visibility: row.visibility,
          },
          { headers: cors },
        );
      },

      DELETE: async ({ request, params }) => {
        const id = (params.id ?? "").slice(0, 32);
        if (!id) return Response.json({ error: "Missing id" }, { status: 400, headers: cors });
        const token = request.headers.get("x-delete-token");
        if (!token) return Response.json({ error: "Missing x-delete-token header" }, { status: 401, headers: cors });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("pastes")
          .select("id,delete_token_hash")
          .eq("id", id)
          .maybeSingle();
        if (!row) return Response.json({ error: "Not found" }, { status: 404, headers: cors });
        if (!row.delete_token_hash || (await sha256(token)) !== row.delete_token_hash) {
          return Response.json({ error: "Invalid token" }, { status: 403, headers: cors });
        }
        const { error: delErr } = await supabaseAdmin.from("pastes").delete().eq("id", id);
        if (delErr) return Response.json({ error: delErr.message }, { status: 500, headers: cors });
        return Response.json({ ok: true }, { headers: cors });
      },
    },
  },
});
