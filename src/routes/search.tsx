import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PromptCard } from "@/components/prompt-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "@/hooks/useAuth";
import { searchPromptCardsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search AI Prompts — Meridian" },
      {
        name: "description",
        content:
          "Search every structured prompt across the Meridian toolkits by title, topic or keyword and open the fill-in workspace.",
      },
      { property: "og:title", content: "Search AI Prompts — Meridian" },
      {
        property: "og:description",
        content: "Find the right structured prompt across all Meridian toolkits in seconds.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const { user, isPro } = useAccount();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 350);
    return () => clearTimeout(id);
  }, [term]);

  const { data, isFetching } = useQuery(searchPromptCardsQuery(debounced));

  useEffect(() => {
    if (!user || debounced.trim().length < 2 || !data) return;
    void supabase
      .from("searches")
      .insert({ user_id: user.id, query: debounced.trim(), results_count: data.length });
  }, [user, debounced, data]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pt-14 pb-8">
        <p className="eyebrow">Search</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Find a prompt
        </h1>

        <div className="relative mt-6">
          <SearchIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Try “personal statement”, “CV”, “interview”, “API”"
            className="h-12 rounded-full pl-10"
            aria-label="Search prompts"
          />
        </div>

        <div className="mt-8 grid gap-3">
          {isFetching &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-[14px]" />
            ))}
          {!isFetching &&
            (data ?? []).map((p) => <PromptCard key={p.id} prompt={p} unlocked={isPro} />)}
          {!isFetching && debounced.trim().length > 1 && (data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No prompts matched “{debounced}”. Try a broader keyword.
            </p>
          )}
          {debounced.trim().length <= 1 && (
            <p className="text-sm text-muted-foreground">
              Type at least two characters to search the library.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
