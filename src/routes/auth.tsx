import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create your Meridian account" },
      {
        name: "description",
        content:
          "Sign in to Meridian to open prompt workspaces, save favourites and manage your Pro subscription.",
      },
      { property: "og:title", content: "Sign in to Meridian" },
      {
        property: "og:description",
        content: "Access your prompt toolkits, favourites and subscription.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user) {
      // Check for pending referral before navigating away
      const pendingRef = localStorage.getItem('meridian_ref');
      if (pendingRef) {
        supabase.rpc('process_referral', { ref_code: pendingRef })
          .then(() => localStorage.removeItem('meridian_ref'))
          .catch(console.error)
          .finally(() => navigate({ to: "/dashboard", replace: true }));
      } else {
        navigate({ to: "/dashboard", replace: true });
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Capture referral code from URL if present
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('meridian_ref', ref);
      setMode("signup"); // Default to signup if referred
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
        
        // Process referral immediately if auto-signed in (no email confirmation)
        const pendingRef = localStorage.getItem('meridian_ref');
        if (pendingRef) {
          await supabase.rpc('process_referral', { ref_code: pendingRef });
          localStorage.removeItem('meridian_ref');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        
        // Process referral for existing users too if they clicked a link!
        const pendingRef = localStorage.getItem('meridian_ref');
        if (pendingRef) {
          await supabase.rpc('process_referral', { ref_code: pendingRef });
          localStorage.removeItem('meridian_ref');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 pt-14 pb-16">
        <p className="eyebrow">{mode === "signin" ? "Welcome back" : "Get started"}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
          {mode === "signin" ? "Sign in to Meridian" : "Create your account"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Free members get open prompts, favourites and a dashboard. Pro unlocks the full library.
        </p>

        <form onSubmit={onSubmit} className="ledger-card mt-8 space-y-4 p-6">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Amina Bello"
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 text-sm font-medium text-primary"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <Link to="/" className="mt-3 text-sm text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
      </main>
    </div>
  );
}
