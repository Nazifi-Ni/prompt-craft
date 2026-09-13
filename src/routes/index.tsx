import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToolkitCard } from "@/components/toolkit-card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqsQuery, plansQuery, toolkitsQuery } from "@/lib/queries";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meridian — Smart AI Prompt Toolkits" },
      {
        name: "description",
        content:
          "AI prompt toolkits tailored for students, job seekers, and professionals. Just fill in your details and let our smart templates do the heavy lifting.",
      },
      { property: "og:title", content: "Meridian — Smart AI Prompt Toolkits" },
      {
        property: "og:description",
        content:
          "AI prompt toolkits tailored for students, job seekers, and professionals.",
      },
    ],
  }),
  component: Home,
});

const pillars = [
  {
    icon: BookOpen,
    title: "Expertly crafted for you",
    body: "Every prompt comes with clear instructions, helpful tips, and practical examples to guide you step by step.",
  },
  {
    icon: Wand2,
    title: "Just fill in the blanks",
    body: "Simply answer a few quick questions, and our system will automatically assemble the perfect, personalized prompt for you.",
  },
  {
    icon: ShieldCheck,
    title: "Authentic and accurate",
    body: "We help you highlight your real achievements. Our prompts are designed to help you tell your true story in the best way possible.",
  },
];

function Home() {
  const toolkits = useQuery(toolkitsQuery());
  const plans = useQuery(plansQuery());
  const faqs = useQuery(faqsQuery());

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-6xl px-5 pt-16 pb-12 sm:pt-24">
          <p className="eyebrow">AI prompt toolkits</p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-[1.08] font-semibold text-foreground sm:text-6xl">
            AI prompts built to solve real problems.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Meridian is a curated library of specialized AI prompt toolkits for scholarships, studies,
            job hunting, and business. Every prompt is carefully tested and ready to use.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/toolkits">
                Browse toolkits <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>

          <dl className="mt-14 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
            {[
              { k: "Toolkits", v: toolkits.data?.length ?? "—" },
              { k: "Tested prompts", v: "150+" },
              { k: "Focus", v: "Your Real Story" },
            ].map((s) => (
              <div key={s.k}>
                <dt className="label-caps">{s.k}</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-5 sm:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.title} className="ledger-card p-6">
                <p.icon className="size-5 text-accent" />
                <h3 className="mt-4 text-base font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The library</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                Featured toolkits
              </h2>
            </div>
            <Link
              to="/toolkits"
              className="hidden text-sm font-semibold text-primary hover:underline sm:block"
            >
              View all
            </Link>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(toolkits.data ?? []).slice(0, 6).map((t) => (
              <ToolkitCard key={t.id} toolkit={t} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <p className="eyebrow">Membership</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            Simple, transparent pricing
          </h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-3">
            {(plans.data ?? []).map((plan) => (
              <div key={plan.id} className="ledger-card flex flex-col p-6">
                <p className="label-caps">{plan.name}</p>
                <p className="mt-3 font-display text-3xl font-semibold text-foreground">
                  {formatPrice(Number(plan.price_amount), plan.currency)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    /{plan.interval === "free" ? "forever" : plan.interval}
                  </span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 rounded-full" variant="outline">
                  <Link to="/pricing">Choose {plan.name}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        {(faqs.data ?? []).length > 0 && (
          <section className="mx-auto max-w-3xl px-5 py-12">
            <p className="eyebrow">Questions</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              Frequently asked
            </h2>
            <Accordion type="single" collapsible className="mt-6">
              {(faqs.data ?? []).map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left text-base font-medium">
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
