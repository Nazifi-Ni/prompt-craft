import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing & Pro Access — Promptcraft Prompt Toolkits" },
      {
        name: "description",
        content:
          "Simple pricing for Promptcraft. Start free, upgrade to Pro monthly or annually to unlock every structured AI prompt across all toolkits.",
      },
      { property: "og:title", content: "Pricing & Pro Access — Promptcraft" },
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
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  useEffect(() => {
    // Load Paystack script securely (check if exists to support React Strict Mode)
    if (!document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleCheckout = (plan: any) => {
    if (plan.price_amount <= 0 || plan.grants_access === 'free') {
      toast.error("This plan is free. No checkout required.");
      return;
    }

    if (!(window as any).PaystackPop) {
      toast.error("Payment gateway is still loading. Please try again in a moment.");
      return;
    }

    setIsCheckoutLoading(true);
    
    try {
      const amountInKobo = Math.round(Number(plan.price_amount) * 100);
      
      const handler = (window as any).PaystackPop.setup({
        key: 'pk_live_c7841dbfe0abb4fe3e61556c9d525cb159fafe31',
        email: user?.email || "customer@promptcraft.com",
        amount: amountInKobo,
        currency: plan.currency || 'NGN',
        callback: function(response: any) {
          (async () => {
            try {
              const { error } = await supabase.rpc('activate_subscription_after_payment', {
                plan_id: plan.id,
                reference: response.reference,
                amount: plan.price_amount
              });
              
              if (error) throw error;
              
              toast.success("Payment successful! Pro activated.");
              queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
              queryClient.invalidateQueries({ queryKey: ["transactions"] });
              queryClient.invalidateQueries({ queryKey: ["account-state"] });
              router.invalidate();
              router.navigate({ to: "/subscription" });
            } catch (error: any) {
              console.error(error);
              toast.error("Payment succeeded, but activation failed. Please contact support with reference: " + response.reference);
            } finally {
              setIsCheckoutLoading(false);
            }
          })();
        },
        onClose: function() {
          setIsCheckoutLoading(false);
          toast.error("Payment cancelled.");
        }
      });
      handler.openIframe();
    } catch (err: any) {
      console.error(err);
      setIsCheckoutLoading(false);
      toast.error(`Error: ${err.message || String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-14 pb-8">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          One membership, the whole library
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Start for free to explore our essential templates. Upgrade to Pro to unlock our complete, expertly crafted library of prompts across all categories.
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
              {user ? (
                isPro && plan.grants_access === "pro" ? (
                  <Button asChild className="mt-6 rounded-full" variant="outline">
                    <Link to="/subscription">Manage plan</Link>
                  </Button>
                ) : (
                  <Button 
                    className="mt-6 rounded-full" 
                    variant={plan.grants_access === "pro" ? "default" : "outline"}
                    disabled={isCheckoutLoading}
                    onClick={() => plan.grants_access === "pro" ? handleCheckout(plan) : undefined}
                    asChild={plan.grants_access === "free"}
                  >
                    {plan.grants_access === "free" ? (
                      <Link to="/subscription">Current Plan</Link>
                    ) : (
                      "Choose plan"
                    )}
                  </Button>
                )
              ) : (
                <Button asChild className="mt-6 rounded-full" variant={plan.grants_access === "pro" ? "default" : "outline"}>
                  <Link to="/auth">Create an account</Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Payments are securely processed via Paystack or Flutterwave.
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
