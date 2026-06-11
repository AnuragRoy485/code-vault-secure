import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Lock, Sparkles, Timer, Eye, EyeOff, Zap, Shield, Globe2, Send,
  Copy, CheckCircle2, KeyRound, ExternalLink, Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createPaste } from "@/lib/paste.functions";
import {
  LANGUAGES, EXPIRATIONS, VISIBILITIES,
  expirationToDate, ANON_MAX_CHARS, AUTH_MAX_CHARS,
} from "@/lib/paste-constants";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "snip.ink — share code snippets with style" },
      { name: "description", content: "Create a beautiful, secure code paste with syntax highlighting, expiration, password protection, and version history." },
      { property: "og:title", content: "snip.ink — share code snippets with style" },
      { property: "og:description", content: "Beautiful, secure code sharing with syntax highlighting, private pastes, and version history." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const create = useServerFn(createPaste);
  const { user, isAuthenticated } = useAuth();
  const maxChars = isAuthenticated ? AUTH_MAX_CHARS : ANON_MAX_CHARS;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<string>("javascript");
  const [expiration, setExpiration] = useState<string>("1w");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");

  const [created, setCreated] = useState<{ id: string; delete_token: string | null } | null>(null);

  const mut = useMutation({
    mutationFn: async () => {
      return create({
        data: {
          title: title || undefined,
          content,
          language,
          password: usePassword && password ? password : null,
          expires_at: expirationToDate(expiration),
          visibility,
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Paste created");
      if (res.delete_token) {
        setCreated(res);
      } else {
        navigate({ to: "/p/$id", params: { id: res.id } });
      }
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create paste"),
  });

  if (created) {
    return <CreatedSuccess id={created.id} token={created.delete_token!} onContinue={() => navigate({ to: "/p/$id", params: { id: created.id } })} />;
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 bg-grid opacity-60" />
      <div className="absolute inset-0 -z-10 bg-radial-spot" />

      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {isAuthenticated ? `Welcome back, ${user?.user_metadata?.full_name || user?.email?.split("@")[0]}` : "Built for developers who share code all day"}
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Share code,{" "}
            <span className="bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent">
              securely & instantly.
            </span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Paste a snippet, pick a language, set an expiration or password, and get a clean shareable link in seconds.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Edge fast</span>
            <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> Encrypted at rest</span>
            <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5 text-primary" /> Global CDN</span>
          </div>
          {!isAuthenticated && (
            <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-xs">
              <span className="text-muted-foreground">
                <Link to="/auth" className="font-semibold text-primary hover:underline">Sign in</Link> to unlock private pastes, never-expire, 1M characters, edit history & a personal dashboard.
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border bg-surface/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <span className="h-3 w-3 rounded-full bg-[oklch(0.66_0.21_25)]"></span>
                <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_85)]"></span>
                <span className="h-3 w-3 rounded-full bg-[oklch(0.72_0.16_145)]"></span>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled paste"
                maxLength={200}
                className="border-0 bg-transparent font-mono text-sm focus-visible:ring-0 shadow-none px-2 min-w-0"
              />
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="// Paste your code here…"
            spellCheck={false}
            className="min-h-[320px] sm:min-h-[400px] resize-y rounded-none border-0 bg-transparent font-mono text-sm leading-6 focus-visible:ring-0 shadow-none p-4 sm:p-5"
          />

          <div className="grid gap-4 border-t border-border bg-surface/40 p-4 sm:p-5 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                <Timer className="h-3.5 w-3.5" /> Expiration
              </Label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPIRATIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value} disabled={e.requiresAuth && !isAuthenticated}>
                      {e.label}{e.requiresAuth && !isAuthenticated ? " (sign in)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                <Globe2 className="h-3.5 w-3.5" /> Visibility
              </Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "unlisted" | "private")}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISIBILITIES.map((v) => (
                    <SelectItem key={v.value} value={v.value} disabled={v.requiresAuth && !isAuthenticated}>
                      {v.label}{v.requiresAuth && !isAuthenticated ? " (sign in)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground leading-4">
                {VISIBILITIES.find((v) => v.value === visibility)?.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Password</span>
                <Switch checked={usePassword} onCheckedChange={setUsePassword} />
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!usePassword}
                  placeholder={usePassword ? "Set a password" : "Off"}
                  className="pr-10"
                />
                {usePassword && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="text-xs text-muted-foreground">
              {content.length.toLocaleString()} chars · max {maxChars.toLocaleString()}
              {content.length > maxChars && <span className="ml-2 text-destructive">over limit</span>}
            </div>
            <Button
              size="lg"
              disabled={!content.trim() || content.length > maxChars || mut.isPending}
              onClick={() => mut.mutate()}
              className="gap-2 shadow-[var(--shadow-glow)]"
            >
              <Send className="h-4 w-4" />
              {mut.isPending ? "Publishing…" : "Publish snippet"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CreatedSuccess({ id, token, onContinue }: { id: string; token: string; onContinue: () => void }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/p/${id}` : `/p/${id}`;
  const [saved, setSaved] = useState(false);

  function downloadToken() {
    const blob = new Blob(
      [`snip.ink delete token\n\nPaste URL: ${url}\nDelete token: ${token}\n\nKeep this safe — without it, this anonymous paste cannot be deleted.\n`],
      { type: "text/plain" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `snipink-${id}-delete-token.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Token downloaded");
  }

  function copyBoth() {
    navigator.clipboard.writeText(`URL: ${url}\nDelete token: ${token}`);
    toast.success("URL + token copied");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      <div className="rounded-2xl border border-primary/30 bg-card p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">Your paste is live</h1>
        </div>

        <div className="mt-6 space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Share URL</Label>
          <div className="flex gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => { navigator.clipboard.writeText(url); toast.success("URL copied"); }}
              aria-label="Copy URL"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
            <KeyRound className="h-4 w-4" /> Save this delete token — shown only once
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Without this token, this anonymous paste <strong>cannot</strong> be deleted. Copy it, download it, or sign in next time to manage pastes from your dashboard.
          </p>
          <div className="mt-3 flex gap-2">
            <Input readOnly value={token} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button
              variant="outline"
              size="icon"
              onClick={() => { navigator.clipboard.writeText(token); toast.success("Token copied"); }}
              aria-label="Copy token"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={copyBoth} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy URL + token
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadToken} className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download .txt
            </Button>
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
              className="h-4 w-4 rounded border-amber-500/50 accent-amber-500"
            />
            <span>I've saved my delete token somewhere safe</span>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Link to="/auth"><Button variant="outline">Create an account</Button></Link>
          <Button className="gap-1.5" onClick={onContinue} disabled={!saved}>
            <ExternalLink className="h-4 w-4" /> Open paste
          </Button>
        </div>
      </div>
    </div>
  );
}
