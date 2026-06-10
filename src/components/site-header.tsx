import { Link } from "@tanstack/react-router";
import { Moon, Sun, Search, Plus, Code2, Github } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[0_8px_24px_-12px_var(--primary)]">
            <Code2 className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">snip.ink</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              share code, fast
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Link to="/search">
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Browse</span>
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New paste</span>
            </Button>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
          >
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Github className="h-4 w-4" />
            </Button>
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="h-9 w-9"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </nav>
      </div>
    </header>
  );
}
