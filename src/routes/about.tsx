import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, BookOpen, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Meridian — Honest AI Prompt Toolkits" },
      {
        name: "description",
        content:
          "Meridian builds structured AI prompt toolkits for scholarship applicants, students, job seekers and developers, with authenticity guardrails built into every prompt.",
      },
      { property: "og:title", content: "About Meridian" },
      {
        property: "og:description",
        content:
          "Why we build structured, honest prompt toolkits instead of generic AI prompt dumps.",
      },
    ],
  }),
  component: AboutPage,
});

const pillars = [
  {
    icon: BookOpen,
    title: "Reference-library structure",
    body: "Prompts are grouped into numbered categories that follow a real workflow, from discovery to submission, so you always know what to do next.",
  },
  {
    icon: Users,
    title: "Written for specific people",
    body: "Each toolkit targets one audience — scholarship applicants, Nigerian students, job seekers, developers — instead of trying to serve everyone at once.",
  },
  {
    icon: ShieldCheck,
    title: "Authenticity guardrails",
    body: "Our prompts never invent achievements, citations or experiences. They help you articulate what is true, and remind you to verify requirements at official sources.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 pt-14 pb-8">
        <p className="eyebrow">About</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Prompts that respect your real story
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Most prompt collections are long lists with no order and no accountability. Meridian is
          built like a reference library: every toolkit has a clear audience, a numbered set of
          categories, and prompts with instructions, examples, warnings and fill-in variables.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="ledger-card p-6">
              <p.icon className="size-5 text-primary" />
              <h2 className="mt-4 font-display text-base font-semibold text-foreground">
                {p.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>

        <section className="ledger-card mt-12 p-6">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Our integrity commitment
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• We do not help fabricate achievements, experiences or references.</li>
            <li>• We do not generate fake citations or invented research results.</li>
            <li>• We do not support plagiarism; drafts are starting points you must make your own.</li>
            <li>
              • We always tell you to confirm eligibility, deadlines and document requirements at the
              official source before submitting anything.
            </li>
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link to="/toolkits">Browse toolkits</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/pricing">See pricing</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
