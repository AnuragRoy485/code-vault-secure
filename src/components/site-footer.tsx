import { Code2, Heart, Github } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/40 mt-16 sm:mt-24">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">snip.ink</span>
          <span className="hidden sm:inline">— share code with elegance.</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a href="/api/public/v1/paste" className="hover:text-foreground transition-colors">API</a>
          <a href="/search" className="hover:text-foreground transition-colors">Browse</a>
          <a
            href="https://github.com/AnuragRoy485"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Github className="h-3.5 w-3.5" /> GitHub
          </a>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            Built with <Heart className="h-3.5 w-3.5 text-primary fill-primary animate-pulse" /> by{" "}
            <a
              href="https://anuragroy.tech"
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold text-foreground hover:text-primary transition-colors underline decoration-primary/40 underline-offset-4"
            >
              Anurag Roy
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
