import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

async function countOf(table: string) {
  const { count, error } = await (supabase as unknown as { from: (t: string) => any })
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

function useCounts() {
  return useQuery({
    queryKey: ["admin", "counts"],
    queryFn: async () => {
      const [toolkits, categories, prompts, plans, faqs, subs, copies] = await Promise.all([
        countOf("toolkits"),
        countOf("toolkit_categories"),
        countOf("prompts"),
        countOf("subscription_plans"),
        countOf("faqs"),
        countOf("subscriptions"),
        countOf("prompt_usage"),
      ]);
      return { toolkits, categories, prompts, plans, faqs, subs, copies };
    },
  });
}

const links = [
  { to: "/admin/toolkits", label: "Toolkits", key: "toolkits" },
  { to: "/admin/categories", label: "Categories", key: "categories" },
  { to: "/admin/prompts", label: "Prompts", key: "prompts" },
  { to: "/admin/plans", label: "Plans", key: "plans" },
  { to: "/admin/faqs", label: "FAQs", key: "faqs" },
  { to: "/admin/subscriptions", label: "Subscriptions", key: "subs" },
] as const;


function AdminOverview() {
  const { data } = useCounts();

  return (
    <section>
      <p className="eyebrow">Content manager</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-foreground">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add toolkits, categories and prompts without touching code. Everything published here shows
        up instantly on the public site.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="ledger-card ledger-card-hover p-5">
            <p className="label-caps text-muted-foreground">{link.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-foreground">
              {data?.[link.key] ?? "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Manage {link.label.toLowerCase()}</p>
          </Link>
        ))}
        <div className="ledger-card p-5">
          <p className="label-caps text-muted-foreground">Activity</p>
          <p className="mt-2 text-sm text-foreground">{data?.subs ?? 0} subscription records</p>
          <p className="text-sm text-foreground">{data?.copies ?? 0} prompt copies tracked</p>
        </div>
      </div>
    </section>
  );
}
