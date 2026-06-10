import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, FileCode, Clock, Eye, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchPastes } from "@/lib/paste.functions";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Browse pastes — snip.ink" },
      { name: "description", content: "Discover and search public code snippets shared on snip.ink." },
      { property: "og:title", content: "Browse pastes — snip.ink" },
      { property: "og:description", content: "Discover and search public code snippets shared on snip.ink." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const fn = useServerFn(searchPastes);
  const { data, isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => fn({ data: { q, limit: 30 } }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Browse pastes</h1>
        <p className="mt-2 text-muted-foreground">Recently shared public snippets. Search by title.</p>
      </div>

      <div className="relative mt-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles…"
          maxLength={100}
          className="h-12 pl-11 text-base shadow-[var(--shadow-card)]"
        />
      </div>

      <div className="mt-8 space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {!isLoading && data?.results.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted-foreground">
            No pastes found. <Link to="/" className="text-primary underline-offset-4 hover:underline">Create the first one</Link>.
          </div>
        )}

        {data?.results.map((p) => (
          <Link
            key={p.id}
            to="/p/$id"
            params={{ id: p.id }}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-[var(--shadow-glow)]"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <FileCode className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{p.title}</div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="font-mono">{p.language}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views}</span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link to="/">
          <Button variant="outline">Create new paste</Button>
        </Link>
      </div>
    </div>
  );
}
