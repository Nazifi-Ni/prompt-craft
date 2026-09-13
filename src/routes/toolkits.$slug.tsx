import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Gift, Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PromptCard } from "@/components/prompt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "@/hooks/useAuth";
import { bonusesQuery, categoriesQuery, promptCardsQuery, toolkitQuery } from "@/lib/queries";
import { isPromptPro, isToolkitPro } from "@/lib/access";

export const Route = createFileRoute("/toolkits/$slug")({
  head: ({ params }) => {
    const pretty = params.slug.replace(/-/g, " ");
    const title = `${pretty} toolkit — Meridian`;
    const description = `Structured, fill-in AI prompts in the ${pretty} toolkit. Browse categories, open a prompt and copy a customised version.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ToolkitDetail,
});

function ToolkitDetail() {
  const { slug } = Route.useParams();
  const { isPro } = useAccount();
  const { data: toolkit, isLoading } = useQuery(toolkitQuery(slug));
  const { data: categories } = useQuery(categoriesQuery(toolkit?.id));
  const { data: prompts } = useQuery(promptCardsQuery(toolkit?.id));
  const { data: bonuses } = useQuery(bonusesQuery(toolkit?.id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-6xl space-y-4 px-5 py-14">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    );
  }

  if (!toolkit) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-5 py-24 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Toolkit not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This toolkit may have been unpublished.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/toolkits">Back to directory</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const grouped = (categories ?? []).map((cat) => ({
    category: cat,
    items: (prompts ?? []).filter((p) => p.category_id === cat.id),
  }));
  const uncategorised = (prompts ?? []).filter((p) => !p.category_id);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-10 pb-8">
        <Link
          to="/toolkits"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All toolkits
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="eyebrow">{toolkit.audience ?? "Toolkit"}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
              {toolkit.name}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {toolkit.description ?? toolkit.short_description}
            </p>
            {(toolkit.outcomes ?? []).length > 0 && (
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {toolkit.outcomes.map((o) => (
                  <li key={o} className="flex gap-2 text-sm text-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    {o}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="ledger-card h-fit p-6">
            <div className="flex items-center justify-between">
              <p className="label-caps">Access</p>
              <Badge variant={isPro ? "outline" : "secondary"} className="rounded-full">
                {isPro ? "Pro active" : (isToolkitPro(toolkit) ? "Pro only" : "Free tier")}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {isPro
                ? "Every prompt in this toolkit is unlocked on your account."
                : (isToolkitPro(toolkit)
                    ? "This toolkit is exclusively for Pro members. Upgrade to Pro to unlock."
                    : "Free prompts are open to all members. Upgrade to Pro to unlock the full library.")}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {!isPro && (
                <Button asChild className="rounded-full">
                  <Link to="/pricing">View plans</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/dashboard">Your dashboard</Link>
              </Button>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
              <div>
                <dt className="label-caps">Categories</dt>
                <dd className="mt-1 font-semibold text-foreground">{(categories ?? []).length}</dd>
              </div>
              <div>
                <dt className="label-caps">Prompts</dt>
                <dd className="mt-1 font-semibold text-foreground">{(prompts ?? []).length}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <div className="mt-14 space-y-12">
          {grouped
            .filter((c) => c.items.length > 0)
            .map((category) => (
            <section key={category.category.id}>
              <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <span className="font-display font-bold">{category.category.display_order}</span>
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {category.category.name}
                  </h2>
                  {category.category.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{category.category.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {category.items.map((p, i) => (
                  <PromptCard key={p.id} prompt={p} index={i} unlocked={isPro} />
                ))}
              </div>
            </section>
          ))}

          {uncategorised.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">More prompts</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {uncategorised.map((p, i) => (
                  <PromptCard key={p.id} prompt={p} index={i} unlocked={isPro} />
                ))}
              </div>
            </section>
          )}

          {(bonuses ?? []).length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground">Bonus resources</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {(bonuses ?? []).map((b) => {
                  const locked = b.access_level === "pro" && !isPro;
                  return (
                    <div key={b.id} className="ledger-card flex items-start gap-3 p-5">
                      {locked ? (
                        <Lock className="mt-0.5 size-4 text-muted-foreground" />
                      ) : (
                        <Gift className="mt-0.5 size-4 text-accent" />
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
                        {!locked && b.url && (
                          <a
                            href={b.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm font-semibold text-primary"
                          >
                            Open resource
                          </a>
                        )}
                        {locked && (
                          <Link to="/pricing" className="mt-2 inline-block text-sm font-semibold text-primary">
                            Unlock with Pro
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
