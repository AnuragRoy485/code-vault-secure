import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User as UserIcon, FilesIcon, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function UserMenu() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="h-9 w-9" />;

  if (!user) {
    return (
      <Link to="/auth">
        <Button size="sm" className="gap-1.5 h-9 px-3">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Sign in</span>
        </Button>
      </Link>
    );
  }

  const initial = (user.user_metadata?.full_name || user.email || "U").slice(0, 1).toUpperCase();
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold text-sm shadow ring-2 ring-background hover:opacity-90 transition overflow-hidden"
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium truncate">
            {user.user_metadata?.full_name || "Signed in"}
          </span>
          <span className="text-xs font-normal text-muted-foreground truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/my" className="cursor-pointer">
            <FilesIcon className="h-4 w-4 mr-2" /> My pastes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/auth" className="cursor-pointer">
            <UserIcon className="h-4 w-4 mr-2" /> Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={async () => {
            await supabase.auth.signOut();
            toast.success("Signed out");
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
