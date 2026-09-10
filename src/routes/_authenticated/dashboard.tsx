import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookMarked, Heart, Sparkles, User } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToolkitCard } from "@/components/toolkit-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "@/hooks/useAuth";
import { favoritesQuery, toolkitsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Meridian dashboard" },
      {
        name: "description",
        content:
          "Your Meridian workspace: toolkits, saved prompts, recent activity and subscription status.",
      },
      { property: "og:title", content: "Your Meridian dashboard" },
      { property: "og:description", content: "Toolkits, favourites and subscription in one place." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isPro, isAdmin } = useAccount();
  const { data: toolkits, isLoading } = useQuery(toolkitsQuery());
  const { data: favorites } = useQuery(favoritesQuery(user?.id));

  const { data: usage } = useQuery({
    queryKey: ["usage-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("prompt_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const stats = [
    { icon: BookMarked, label: "Toolkits available", value: (toolkits ?? []).length },
    { icon: Heart, label: "Saved prompts", value: (favorites ?? []).length },
    { icon: Sparkles, label: "Prompts copied", value: usage ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-12 pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
              Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {isPro
                ? "Your Pro access is active — the full prompt library is unlocked."
                : "You're on the free tier. Open prompts are available now; Pro unlocks everything."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={isPro ? "outline" : "secondary"} className="rounded-full">
              {isPro ? "Pro" : "Free"}
            </Badge>
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/admin">Admin</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="ledger-card p-5">
              <s.icon className="size-4 text-primary" />
              <p className="mt-3 font-display text-2xl font-semibold text-foreground tabular-nums">
                {s.value}
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/favorites">
              <Heart className="size-4" /> Favourites
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/account">
              <User className="size-4" /> Account
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/subscription">Subscription</Link>
          </Button>
        </div>

        <h2 className="mt-14 font-display text-xl font-semibold text-foreground">Your toolkits</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-[14px]" />
            ))}
          {(toolkits ?? []).map((t) => (
            <ToolkitCard key={t.id} toolkit={t} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
