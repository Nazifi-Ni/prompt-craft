import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { plansQuery } from "@/lib/queries";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/subscription")({
  head: () => ({
    meta: [
      { title: "Your subscription — Meridian" },
      {
        name: "description",
        content: "Review your Meridian plan, billing history and Pro access status.",
      },
      { property: "og:title", content: "Your subscription — Meridian" },
      { property: "og:description", content: "Plan status and billing history." },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { user, isPro } = useAccount();
  const { data: plans } = useQuery(plansQuery());

  const { data: subs } = useQuery({
    queryKey: ["subscriptions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, plan:subscription_plans(name,interval)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: txns } = useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const active = (subs ?? []).find((s) => s.status === "active");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pt-12 pb-8">
        <p className="eyebrow">Billing</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
          Your subscription
        </h1>

        <div className="ledger-card mt-8 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {active?.plan?.name ?? "Free tier"}
            </h2>
            <Badge variant={isPro ? "outline" : "secondary"} className="rounded-full">
              {isPro ? "Active" : "No paid plan"}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {active
              ? `Renews or expires ${formatDate(active.current_period_end)}.`
              : "Upgrade to unlock every prompt across all toolkits."}
          </p>
          {!active && (
            <Button asChild className="mt-5 rounded-full">
              <Link to="/pricing">See plans</Link>
            </Button>
          )}
        </div>

        <div className="ledger-card mt-6 border-accent/40 p-6">
          <p className="label-caps">Checkout status</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Card checkout runs through Paystack or Flutterwave with server-side verification before
            any subscription is activated. Payment keys are not configured for this workspace yet, so
            self-serve upgrades are disabled — an admin can activate Pro on your account in the
            meantime.
          </p>
        </div>

        <h2 className="mt-12 font-display text-xl font-semibold text-foreground">
          Available plans
        </h2>
        <div className="mt-4 space-y-3">
          {(plans ?? []).map((p) => (
            <div key={p.id} className="ledger-card flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(Number(p.price_amount), p.currency)} · {p.interval}
                </p>
              </div>
              <Badge variant="outline" className="rounded-full">
                {p.grants_access === "pro" ? "Pro access" : "Free access"}
              </Badge>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-display text-xl font-semibold text-foreground">
          Payment history
        </h2>
        <div className="mt-4 space-y-3">
          {(txns ?? []).map((t) => (
            <div key={t.id} className="ledger-card flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {formatPrice(Number(t.amount), t.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.provider} · {formatDate(t.created_at)}
                </p>
              </div>
              <Badge variant="outline" className="rounded-full">
                {t.status}
              </Badge>
            </div>
          ))}
          {(txns ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
