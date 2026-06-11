import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogIn, UserPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — snip.ink" },
      { name: "description", content: "Sign in or create an account to save and manage your pastes on snip.ink." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/my" });
  }, [user, loading, navigate]);

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/my" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/my",
            data: { full_name: name },
          },
        });
        if (error) throw error;
        // Auto sign-in after signup (email confirmation disabled)
        if (!data.session) {
          const { error: siErr } = await supabase.auth.signInWithPassword({ email, password });
          if (siErr) throw siErr;
        }
        toast.success("Account created — you're signed in");
        navigate({ to: "/my" });
      }
    } catch (err) {
      toast.error((err as Error).message || "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto flex max-w-md flex-col px-4 py-12 sm:py-20">
      <div className="absolute inset-0 -z-10 bg-radial-spot opacity-60" />
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="text-center">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            {tab === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "signin"
              ? "Sign in to manage your pastes, edit them, and unlock more."
              : "Get a dashboard, private pastes, edit history, and 1M-char snippets."}
          </p>
        </div>

        <div className="mt-6" />


        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">
              <LogIn className="h-3.5 w-3.5 mr-1.5" /> Sign in
            </TabsTrigger>
            <TabsTrigger value="signup">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Sign up
            </TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-4">
            <EmailForm
              busy={busy}
              onSubmit={withEmail}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              label="Sign in"
            />
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <EmailForm
              busy={busy}
              onSubmit={withEmail}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              label="Create account"
              showName
              name={name}
              setName={setName}
            />
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to use snip.ink responsibly. <Link to="/" className="underline">Back to home</Link>.
        </p>
      </div>
    </div>
  );
}

function EmailForm(props: {
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  label: string;
  showName?: boolean;
  name?: string;
  setName?: (v: string) => void;
}) {
  return (
    <form onSubmit={props.onSubmit} className="space-y-3">
      {props.showName && (
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={props.name ?? ""}
            onChange={(e) => props.setName?.(e.target.value)}
            placeholder="Your name"
          />
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={props.email}
          onChange={(e) => props.setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete={props.label === "Sign in" ? "current-password" : "new-password"}
          value={props.password}
          onChange={(e) => props.setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full h-10" disabled={props.busy}>
        {props.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : props.label}
      </Button>
    </form>
  );
}

