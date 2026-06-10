import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Lock,
  Sparkles,
  Timer,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Globe2,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPaste } from "@/lib/paste.functions";
import { LANGUAGES, EXPIRATIONS, expirationToDate } from "@/lib/paste-constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "snip.ink — share code snippets with style" },
      {
        name: "description",
        content:
          "Create a beautiful, secure code paste with syntax highlighting, expiration, and password protection.",
      },
      { property: "og:title", content: "snip.ink — share code snippets with style" },
      {
        property: "og:description",
        content:
          "Create a beautiful, secure code paste with syntax highlighting, expiration, and password protection.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const create = useServerFn(createPaste);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<string>("javascript");
  const [expiration, setExpiration] = useState<string>("1w");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isListed, setIsListed] = useState(true);

  const mut = useMutation({
    mutationFn: async () => {
      return create({
        data: {
          title: title || undefined,
          content,
          language,
          password: usePassword && password ? password : null,
          expires_at: expirationToDate(expiration),
          is_listed: isListed,
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Paste created");
      navigate({ to: "/p/$id", params: { id: res.id } });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create paste");
    },
  });

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 bg-grid opacity-60" />
      <div className="absolute inset-0 -z-10 bg-radial-spot" />

      <section className="mx-auto max-w-6xl px-4 pt-12 pb-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built for developers who share code all day
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
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border bg-surface/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[oklch(0.66_0.21_25)]"></span>
                <span className="h-3 w-3 rounded-full bg-[oklch(0.78_0.16_85)]"></span>
                <span className="h-3 w-3 rounded-full bg-[oklch(0.72_0.16_145)]"></span>
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled paste"
                maxLength={200}
                className="border-0 bg-transparent font-mono text-sm focus-visible:ring-0 shadow-none px-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Editor */}
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="// Paste your code here…"
              spellCheck={false}
              className="min-h-[360px] resize-y rounded-none border-0 bg-transparent font-mono text-sm leading-6 focus-visible:ring-0 shadow-none p-5"
            />
          </div>

          {/* Options */}
          <div className="grid gap-4 border-t border-border bg-surface/40 p-4 sm:p-5 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                <Timer className="h-3.5 w-3.5" /> Expiration
              </Label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Password
                </span>
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

            <div className="space-y-1.5">
              <Label className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Globe2 className="h-3.5 w-3.5" /> Visibility
                </span>
                <Switch
                  checked={isListed && !usePassword}
                  disabled={usePassword}
                  onCheckedChange={setIsListed}
                />
              </Label>
              <p className="text-xs text-muted-foreground leading-5">
                {usePassword
                  ? "Password-protected pastes are unlisted automatically."
                  : isListed
                  ? "Discoverable in public search."
                  : "Unlisted — only people with the link."}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border bg-surface/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="text-xs text-muted-foreground">
              {content.length.toLocaleString()} chars · max 1,000,000
            </div>
            <Button
              size="lg"
              disabled={!content.trim() || mut.isPending}
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
