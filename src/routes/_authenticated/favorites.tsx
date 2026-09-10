import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PromptCard } from "@/components/prompt-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "@/hooks/useAuth";
import { favoritesQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({
    meta: [
      { title: "Saved prompts — Meridian" },
      {
        name: "description",
        content: "Every prompt you've saved in Meridian, ready to open and reuse.",
      },
      { property: "og:title", content: "Saved prompts — Meridian" },
      { property: "og:description", content: "Your personal shortlist of structured AI prompts." },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, isPro } = useAccount();
  const { data: favorites, isLoading } = useQuery(favoritesQuery(user?.id));
  const ids = (favorites ?? []).map((f) => f.prompt_id);

  const { data: cards } = useQuery({
    queryKey: ["favorite-cards", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("prompt_cards").select("*").in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pt-12 pb-8">
        <p className="eyebrow">Favourites</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">Saved prompts</h1>

        <div className="mt-8 grid gap-3">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[14px]" />)}
          {(cards ?? []).map((p) => (
            <PromptCard key={p.id} prompt={p} unlocked={isPro} />
          ))}
          {!isLoading && ids.length === 0 && (
            <div className="ledger-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't saved any prompts yet. Tap “Save” inside a prompt workspace.
              </p>
              <Button asChild className="mt-5 rounded-full">
                <Link to="/toolkits">Browse toolkits</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
