import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToolkitCard } from "@/components/toolkit-card";
import { ReferralBanner } from "@/components/referral-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toolkitsQuery } from "@/lib/queries";

export const Route = createFileRoute("/toolkits/")({
  head: () => ({
    meta: [
      { title: "All AI Prompt Toolkits — Promptcraft" },
      {
        name: "description",
        content:
          "Browse every Promptcraft toolkit: scholarships, Nigerian students, job seekers, small business, web developers, researchers, interviews and content creation.",
      },
      { property: "og:title", content: "All AI Prompt Toolkits — Promptcraft" },
      {
        property: "og:description",
        content: "Every specialised prompt library in the Promptcraft collection, in one directory.",
      },
    ],
  }),
  component: ToolkitsPage,
});

function ToolkitsPage() {
  const { data, isLoading, error } = useQuery(toolkitsQuery());
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  const filteredToolkits = useMemo(() => {
    if (!data) return [];
    return data.filter((t) => {
      if (featuredOnly && !t.is_featured) return false;
      if (freeOnly && t.access_level !== "free") return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = t.name?.toLowerCase().includes(term);
        const matchesDesc = t.short_description?.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term);
        const matchesAudience = t.audience?.toLowerCase().includes(term);
        if (!matchesName && !matchesDesc && !matchesAudience) return false;
      }
      return true;
    });
  }, [data, searchTerm, featuredOnly, freeOnly]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-14 pb-8">
        <p className="eyebrow">Directory</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
          Every toolkit in the library
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Each toolkit is a curated set of categories and structured prompts for one specific
          audience. Free prompts are open to every signed-in member; Pro unlocks the full library.
        </p>

        <ReferralBanner />

        <div className="mt-8 flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search toolkits by name or audience..."
              className="h-10 rounded-full pl-10"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="featured" 
                checked={featuredOnly}
                onCheckedChange={(c) => setFeaturedOnly(c === true)}
              />
              <Label htmlFor="featured" className="text-sm font-medium">Featured only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="free" 
                checked={freeOnly}
                onCheckedChange={(c) => setFreeOnly(c === true)}
              />
              <Label htmlFor="free" className="text-sm font-medium">Free access only</Label>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-[14px]" />
            ))}
          {(!isLoading && !error && filteredToolkits.length > 0) &&
            filteredToolkits.map((t) => (
              <ToolkitCard key={t.id} toolkit={t} />
            ))}
        </div>

        {error && (
          <p className="mt-8 text-sm text-destructive">
            We couldn't load the toolkits. Please refresh and try again.
          </p>
        )}
        {!isLoading && !error && filteredToolkits.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            {data && data.length > 0 ? "No toolkits match your filters." : "No toolkits published yet."}
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
