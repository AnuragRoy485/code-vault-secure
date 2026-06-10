import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, ArrowLeft, History, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { LANGUAGES, VISIBILITIES } from "@/lib/paste-constants";
import { getPaste, updatePaste, getPasteVersions } from "@/lib/paste.functions";

export const Route = createFileRoute("/_authenticated/edit/$id")({
  head: ({ params }) => ({ meta: [{ title: `Edit ${params.id} — snip.ink` }] }),
  component: EditPaste,
});

function EditPaste() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchFn = useServerFn(getPaste);
  const updFn = useServerFn(updatePaste);
  const verFn = useServerFn(getPasteVersions);

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [loaded, setLoaded] = useState(false);

  const { data: pasteRes, isLoading } = useQuery({
    queryKey: ["edit-paste", id],
    queryFn: () => fetchFn({ data: { id } }),
  });

  useEffect(() => {
    if (pasteRes?.status === "ok" && !loaded) {
      const p = pasteRes.paste;
      setTitle(p.title);
      setLanguage(p.language);
      setContent(p.content);
      setVisibility(p.visibility);
      setLoaded(true);
    }
  }, [pasteRes, loaded]);

  const save = useMutation({
    mutationFn: () =>
      updFn({
        data: { id, title, content, language, visibility, expires_at: null },
      }),
    onSuccess: () => {
      toast.success("Saved");
      navigate({ to: "/p/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (pasteRes?.status !== "ok") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold">Can't edit this paste</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may not exist, be expired, or you may not be the owner.
        </p>
        <Link to="/my"><Button className="mt-6">Back to my pastes</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/my">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> My pastes
          </Button>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <History className="h-4 w-4" /> History
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Version history</SheetTitle>
            </SheetHeader>
            <VersionsPanel id={id} fetchVersions={verFn} />
          </SheetContent>
        </Sheet>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border bg-surface/60 p-3 sm:flex-row sm:items-center">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="font-mono"
          />
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "unlisted" | "private")}>
            <SelectTrigger className="sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VISIBILITIES.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[420px] resize-y border-0 font-mono text-sm leading-6 rounded-none focus-visible:ring-0 p-5"
          spellCheck={false}
        />
        <div className="flex items-center justify-between border-t border-border bg-surface/60 p-3">
          <span className="text-xs text-muted-foreground">{content.length.toLocaleString()} chars</span>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !content.trim()} className="gap-1.5">
            <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function VersionsPanel({
  id,
  fetchVersions,
}: {
  id: string;
  fetchVersions: ReturnType<typeof useServerFn<typeof getPasteVersions>>;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["versions", id],
    queryFn: () => fetchVersions({ data: { id } }),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground mt-4">Loading…</p>;
  const versions = data?.versions ?? [];
  if (versions.length === 0)
    return <p className="text-sm text-muted-foreground mt-4">No prior versions yet — saving this paste creates a snapshot.</p>;
  return (
    <ul className="mt-4 space-y-3">
      {versions.map((v) => (
        <li key={v.version} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">v{v.version} · {v.title}</span>
            <span className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</span>
          </div>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-surface/60 p-2 font-mono text-xs">{v.content.slice(0, 800)}{v.content.length > 800 ? "…" : ""}</pre>
        </li>
      ))}
    </ul>
  );
}
