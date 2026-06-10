import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import hljs from "highlight.js";
import {
  Calendar, Copy, Download, Eye, Lock, Timer, Plus, FileCode, Pencil,
  Globe, Link2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getPaste } from "@/lib/paste.functions";
import { ShareButtons } from "@/components/share-buttons";
import { DeletePasteDialog } from "@/components/delete-paste-dialog";

export const Route = createFileRoute("/p/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Paste ${params.id} — snip.ink` },
      { name: "description", content: "A shared code snippet on snip.ink" },
      { property: "og:title", content: `Paste ${params.id} — snip.ink` },
      { property: "og:description", content: "A shared code snippet on snip.ink" },
    ],
  }),
  component: ViewPaste,
});

type PasteData = {
  id: string;
  title: string;
  language: string;
  content: string;
  expires_at: string | null;
  created_at: string;
  updated_at?: string;
  views: number;
  is_protected: boolean;
  visibility: "public" | "unlisted" | "private";
  is_owner: boolean;
};

function ViewPaste() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchFn = useServerFn(getPaste);

  const [paste, setPaste] = useState<PasteData | null>(null);
  const [needPassword, setNeedPassword] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);

  const mut = useMutation({
    mutationFn: async (password?: string) => fetchFn({ data: { id, password } }),
    onSuccess: (res) => {
      if (res.status === "ok") {
        setPaste(res.paste);
        setNeedPassword(false);
        setNotFound(false);
        setExpired(false);
      } else if (res.status === "password_required") setNeedPassword(true);
      else if (res.status === "password_invalid") toast.error("Incorrect password");
      else if (res.status === "expired") setExpired(true);
      else if (res.status === "not_found") setNotFound(true);
    },
    onError: () => toast.error("Failed to load paste"),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { mut.mutate(undefined); }, [id]);

  const highlighted = useMemo(() => {
    if (!paste) return "";
    try {
      const res =
        paste.language && paste.language !== "plaintext"
          ? hljs.highlight(paste.content, { language: paste.language, ignoreIllegals: true })
          : { value: escapeHtml(paste.content) };
      return res.value;
    } catch { return escapeHtml(paste.content); }
  }, [paste]);

  if (notFound) return <Centered title="Paste not found" subtitle="It may have been removed or never existed." />;
  if (expired) return <Centered title="This paste has expired" subtitle="The author set an expiration that has passed." />;

  if (needPassword) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold">Password protected</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the password to view this paste.</p>
        <form
          className="mt-6 w-full space-y-3 text-left"
          onSubmit={(e) => { e.preventDefault(); mut.mutate(pwInput); }}
        >
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} autoFocus />
          <Button type="submit" className="w-full" disabled={mut.isPending || !pwInput}>
            {mut.isPending ? "Checking…" : "Unlock"}
          </Button>
        </form>
      </div>
    );
  }

  if (!paste) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24">
        <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-[400px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://snip.ink/p/${paste.id}`;
  const createdLabel = new Date(paste.created_at).toLocaleString();
  const expiresLabel = paste.expires_at ? new Date(paste.expires_at).toLocaleString() : "Never";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 flex-wrap text-xs uppercase tracking-wider text-muted-foreground">
            <span className="inline-flex items-center gap-1"><FileCode className="h-3.5 w-3.5" /> {paste.language}</span>
            <VisibilityBadge v={paste.visibility} />
            {paste.is_protected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5">
                <Lock className="h-3 w-3" /> protected
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl break-words">
            {paste.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {createdLabel}</span>
            <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> Expires: {expiresLabel}</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {paste.views} views</span>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
          <ShareButtons url={shareUrl} title={paste.title} />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm" variant="outline"
              onClick={() => { navigator.clipboard.writeText(paste.content); toast.success("Code copied"); }}
            >
              <Copy className="h-4 w-4 mr-1.5" /> Copy
            </Button>
            <Button
              size="sm" variant="outline"
              onClick={() => downloadText(`${paste.id}.${extForLang(paste.language)}`, paste.content)}
            >
              <Download className="h-4 w-4 mr-1.5" /> Raw
            </Button>
            {paste.is_owner && (
              <Link to="/edit/$id" params={{ id: paste.id }}>
                <Button size="sm" variant="outline"><Pencil className="h-4 w-4 mr-1.5" /> Edit</Button>
              </Link>
            )}
            <DeletePasteDialog
              id={paste.id}
              isOwner={paste.is_owner}
              onDeleted={() => navigate({ to: "/" })}
            />
            <Link to="/">
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.66_0.21_25)]"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.16_85)]"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.72_0.16_145)]"></span>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {paste.language}
          </span>
        </div>
        <div className="grid grid-cols-[auto_1fr]">
          <pre
            aria-hidden
            className="select-none border-r border-border bg-surface/30 py-5 px-3 text-right font-mono text-xs leading-6 text-muted-foreground/70"
          >
            {paste.content.split("\n").map((_, i) => (i + 1).toString()).join("\n")}
          </pre>
          <pre className="overflow-x-auto py-5 px-4 sm:px-5 font-mono text-sm leading-6">
            <code className={`hljs language-${paste.language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
        </div>
      </div>
    </div>
  );
}

function VisibilityBadge({ v }: { v: "public" | "unlisted" | "private" }) {
  if (v === "public") return <Badge variant="secondary" className="gap-1"><Globe className="h-3 w-3" /> public</Badge>;
  if (v === "unlisted") return <Badge variant="outline" className="gap-1"><Link2 className="h-3 w-3" /> unlisted</Badge>;
  return <Badge className="gap-1 bg-primary/15 text-primary border-primary/30"><Lock className="h-3 w-3" /> private</Badge>;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function extForLang(l: string) {
  const map: Record<string, string> = {
    javascript: "js", typescript: "ts", tsx: "tsx", python: "py", go: "go",
    rust: "rs", java: "java", kotlin: "kt", swift: "swift", csharp: "cs",
    cpp: "cpp", php: "php", ruby: "rb", sql: "sql", bash: "sh", json: "json",
    yaml: "yml", html: "html", css: "css", markdown: "md", dockerfile: "Dockerfile",
    xml: "xml", plaintext: "txt",
  };
  return map[l] ?? "txt";
}

function Centered({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <Link to="/"><Button className="mt-6">Create a paste</Button></Link>
    </div>
  );
}
