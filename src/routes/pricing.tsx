import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqsQuery, plansQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/format";
import { useAccount } from "@/hooks/useAuth";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing & Pro Access — Meridian Prompt Toolkits" },
      {
        name: "description",
        content:
          "Simple pricing for Meridian. Start free, upgrade to Pro monthly or annually to unlock every structured AI prompt across all toolkits.",
      },
      { property: "og:title", content: "Pricing & Pro Access — Meridian" },
      {
        property: "og:description",
        content: "Start free, upgrade to Pro to unlock every structured prompt in the library.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { data: plans, isLoading } = useQuery(plansQuery());
  const { data: faqs } = useQuery(faqsQuery());
  const { user, isPro } = useAccount();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-14 pb-8">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          One membership, the whole library
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every plan is configured in the admin dashboard, so pricing and features stay current
          without a code change. Free members can use open prompts; Pro unlocks everything.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-[14px]" />
            ))}
          {(plans ?? []).map((plan) => (
            <div
              key={plan.id}
              className={`ledger-card flex flex-col p-6 ${
                plan.grants_access === "pro" && plan.interval === "monthly"
                  ? "ring-1 ring-primary/30"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-foreground">{plan.name}</h2>
                {plan.grants_access === "pro" && (
                  <Badge className="rounded-full bg-accent text-[11px] text-accent-foreground">
                    Pro access
                  </Badge>
                )}
              </div>
              <p className="mt-3 font-display text-3xl font-semibold text-foreground">
                {formatPrice(Number(plan.price_amount), plan.currency)}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {plan.interval === "monthly" ? "/month" : plan.interval === "annual" ? "/year" : ""}
                </span>
              </p>
              {plan.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
              )}
              <ul className="mt-5 flex-1 space-y-2">
                {(plan.features ?? []).map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 rounded-full" variant={plan.grants_access === "pro" ? "default" : "outline"}>
                {user ? (
                  <Link to="/subscription">
                    {isPro && plan.grants_access === "pro" ? "Manage plan" : "Choose plan"}
                  </Link>
                ) : (
                  <Link to="/auth">Create an account</Link>
                )}
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Payments are processed by Paystack or Flutterwave with server-side verification. If
          checkout is not yet configured for this workspace, you'll see a notice on the subscription
          page.
        </p>

        {(faqs ?? []).length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Billing questions
            </h2>
            <Accordion type="single" collapsible className="mt-5">
              {(faqs ?? []).map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left text-sm font-semibold">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
