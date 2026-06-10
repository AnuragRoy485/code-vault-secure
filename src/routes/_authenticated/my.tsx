import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Eye, Pencil, Trash2, ExternalLink, Search, Globe, Lock, Link2,
  Plus, Loader2,
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { listMyPastes, deletePaste } from "@/lib/paste.functions";

export const Route = createFileRoute("/_authenticated/my")({
  head: () => ({ meta: [{ title: "My pastes — snip.ink" }] }),
  component: MyPastes,
});

function MyPastes() {
  const [q, setQ] = useState("");
  const fetchList = useServerFn(listMyPastes);
  const removeFn = useServerFn(deletePaste);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-pastes", q],
    queryFn: () => fetchList({ data: { q } }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.results ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">My pastes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage, edit, and delete the pastes you've created.
          </p>
        </div>
        <Link to="/">
          <Button className="gap-1.5"><Plus className="h-4 w-4" /> New paste</Button>
        </Link>
      </div>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title…"
          className="pl-9 h-11"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid place-items-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <p className="text-muted-foreground">No pastes yet.</p>
            <Link to="/">
              <Button className="mt-4 gap-1.5"><Plus className="h-4 w-4" /> Create your first paste</Button>
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to="/p/$id"
                        params={{ id: r.id }}
                        className="font-semibold truncate hover:text-primary"
                      >
                        {r.title || "Untitled"}
                      </Link>
                      <VisibilityBadge v={r.visibility as "public" | "unlisted" | "private"} />
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {r.language}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {r.views}</span>
                      <span>Updated {formatDistanceToNowStrict(new Date(r.updated_at))} ago</span>
                      {r.expires_at && (
                        <span>Expires {formatDistanceToNowStrict(new Date(r.expires_at))}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Link to="/p/$id" params={{ id: r.id }}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </Button>
                    </Link>
                    <Link to="/edit/$id" params={{ id: r.id }}>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this paste?</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{r.title}" will be permanently removed. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => remove.mutate(r.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function VisibilityBadge({ v }: { v: "public" | "unlisted" | "private" }) {
  if (v === "public")
    return <Badge variant="secondary" className="gap-1"><Globe className="h-3 w-3" /> Public</Badge>;
  if (v === "unlisted")
    return <Badge variant="outline" className="gap-1"><Link2 className="h-3 w-3" /> Unlisted</Badge>;
  return <Badge className="gap-1 bg-primary/15 text-primary border-primary/30"><Lock className="h-3 w-3" /> Private</Badge>;
}
