import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const [usage, searches, toolkitUse, txns, prompts, toolkits] = await Promise.all([
        supabase.from("prompt_usage").select("prompt_id,action,created_at").limit(2000),
        supabase
          .from("searches")
          .select("query,results_count,created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("toolkit_usage").select("toolkit_id,created_at").limit(2000),
        supabase.from("transactions").select("amount,currency,status,created_at").limit(500),
        supabase.from("prompts").select("id,title,slug"),
        supabase.from("toolkits").select("id,name"),
      ]);
      if (usage.error) throw usage.error;

      const promptNames = new Map((prompts.data ?? []).map((p) => [p.id, p.title]));
      const toolkitNames = new Map((toolkits.data ?? []).map((t) => [t.id, t.name]));

      const tally = <T,>(rows: T[], key: (r: T) => string) => {
        const counts = new Map<string, number>();
        for (const r of rows) counts.set(key(r), (counts.get(key(r)) ?? 0) + 1);
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
      };

      const since = (days: number) => {
        const cutoff = Date.now() - days * 86_400_000;
        return (rows: { created_at: string }[]) =>
          rows.filter((r) => new Date(r.created_at).getTime() > cutoff).length;
      };
      const last7 = since(7);

      const succeeded = (txns.data ?? []).filter((t) => t.status === "success");

      return {
        totalUsage: (usage.data ?? []).length,
        copies: (usage.data ?? []).filter((u) => u.action === "copy").length,
        usage7: last7(usage.data ?? []),
        toolkitOpens: (toolkitUse.data ?? []).length,
        searchCount: (searches.data ?? []).length,
        revenue: succeeded.reduce((sum, t) => sum + Number(t.amount), 0),
        currency: succeeded[0]?.currency ?? "NGN",
        payments: succeeded.length,
        topPrompts: tally(usage.data ?? [], (u) => u.prompt_id)
          .slice(0, 8)
          .map(([id, count]) => ({ label: promptNames.get(id) ?? "Removed prompt", count })),
        topToolkits: tally(toolkitUse.data ?? [], (t) => t.toolkit_id)
          .slice(0, 6)
          .map(([id, count]) => ({ label: toolkitNames.get(id) ?? "Removed toolkit", count })),
        recentSearches: searches.data ?? [],
      };
    },
  });
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ledger-card p-5">
      <p className="label-caps text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Ranking({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="ledger-card p-5">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{r.label}</span>
              <span className="text-muted-foreground">{r.count}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-secondary">
              <div
                className="h-1.5 rounded-full bg-primary"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
      </div>
    </div>
  );
}

function AdminAnalytics() {
  const { data, isLoading } = useAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <section>
      <p className="eyebrow">Insight</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-foreground">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        How members are using prompts, toolkits and search.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Prompt opens" value={data?.totalUsage ?? 0} />
        <Stat label="Prompts copied" value={data?.copies ?? 0} />
        <Stat label="Last 7 days" value={data?.usage7 ?? 0} />
        <Stat
          label="Revenue collected"
          value={formatPrice(data?.revenue ?? 0, data?.currency ?? "NGN")}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Ranking title="Most used prompts" rows={data?.topPrompts ?? []} />
        <Ranking title="Busiest toolkits" rows={data?.topToolkits ?? []} />
      </div>

      <div className="ledger-card mt-6 p-5">
        <h2 className="font-display text-lg font-semibold text-foreground">Recent searches</h2>
        <div className="mt-4 divide-y divide-border">
          {(data?.recentSearches ?? []).map((s, i) => (
            <div key={`${s.query}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
              <span className="truncate text-sm text-foreground">{s.query}</span>
              <span className="text-xs text-muted-foreground">
                {s.results_count} results — {formatDate(s.created_at)}
              </span>
            </div>
          ))}
          {(data?.recentSearches ?? []).length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">No searches recorded yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
