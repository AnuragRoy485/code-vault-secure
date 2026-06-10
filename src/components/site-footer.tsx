import { Code2, Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/40 mt-24">
      <div className="mx-auto max-w-6xl px-4 py-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">snip.ink</span>
          <span>— share code with elegance.</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/api/v1/paste" className="hover:text-foreground transition-colors">API</a>
          <a href="/search" className="hover:text-foreground transition-colors">Browse</a>
          <span className="inline-flex items-center gap-1">
            built with <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
          </span>
        </div>
      </div>
    </footer>
  );
}
