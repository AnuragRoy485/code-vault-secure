import { Link } from "@tanstack/react-router";
import { Moon, Sun, Search, Plus, Code2, Github } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/" className="group flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[0_8px_24px_-12px_var(--primary)]">
            <Code2 className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-display text-base sm:text-lg font-bold tracking-tight truncate">snip.ink</div>
            <div className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              share code, fast
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-1.5">
          <Link to="/search">
            <Button variant="ghost" size="sm" className="gap-2 h-9 px-2 sm:px-3" aria-label="Browse pastes">
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">Browse</span>
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 h-9 px-2 sm:px-3" aria-label="New paste">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">New</span>
            </Button>
          </Link>
          <a
            href="https://github.com/AnuragRoy485"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Follow Anurag Roy on GitHub"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 px-2 sm:px-3 border-primary/30 hover:border-primary/60 hover:bg-primary/10"
            >
              <Github className="h-4 w-4" />
              <span className="hidden lg:inline">Follow on GitHub</span>
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
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
