import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Heart, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import { favoritesQuery, promptCardBySlugQuery, promptQuery } from "@/lib/queries";
import { fillTemplate, parseVariables } from "@/lib/format";

export const Route = createFileRoute("/prompts/$slug")({
  head: ({ params }) => {
    const pretty = params.slug.replace(/-/g, " ");
    const title = `${pretty} — AI prompt workspace | Meridian`;
    const description = `Fill in your own details and copy a customised version of the “${pretty}” prompt from the Meridian library.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PromptWorkspace,
});

function PromptWorkspace() {
  const { slug } = Route.useParams();
  const { user, isPro } = useAccount();
  const queryClient = useQueryClient();
  const { data: full, isLoading } = useQuery(promptQuery(slug));
  const { data: card } = useQuery(promptCardBySlugQuery(slug));
  const { data: favorites } = useQuery(favoritesQuery(user?.id));
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const variables = useMemo(() => parseVariables(full?.variables), [full?.variables]);
  const output = useMemo(
    () => (full?.body ? fillTemplate(full.body, values) : ""),
    [full?.body, values],
  );

  const favorite = (favorites ?? []).find((f) => f.prompt_id === full?.id);

  async function generateAnswer() {
    if (!output || isGenerating) return;
    setIsGenerating(true);
    setAiResponse(null);
    try {
      const { generateAnswerFn } = await import("@/server/ai.server");
      const res = await generateAnswerFn({ data: { prompt: output } });
      setAiResponse(res.answer);
      toast.success("Answer generated successfully!");
      if (user && full) {
        void supabase
          .from("prompt_usage")
          .insert({ user_id: user.id, prompt_id: full.id, action: "generate" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate answer. Please check your AI API key.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Prompt copied. Paste it into your AI assistant.");
      if (user && full) {
        void supabase
          .from("prompt_usage")
          .insert({ user_id: user.id, prompt_id: full.id, action: "copy" });
      }
    } catch {
      toast.error("Couldn't copy. Select the text and copy manually.");
    }
  }

  async function toggleFavorite() {
    if (!user || !full) return;
    if (favorite) {
      await supabase.from("favorites").delete().eq("id", favorite.id);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, prompt_id: full.id });
    }
    void queryClient.invalidateQueries({ queryKey: ["favorites", user.id] });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-6xl space-y-4 px-5 py-14">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  // RLS hides premium bodies: metadata exists but the full row does not.
  if (!full) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-5 pt-16 pb-20 text-center">
          <div className="ledger-card p-8">
            <Lock className="mx-auto size-6 text-muted-foreground" />
            <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
              {card?.title ?? "This prompt is locked"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {card?.description ??
                "This prompt is part of the Pro library."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {user ? (
                <Button asChild className="rounded-full">
                  <Link to="/pricing">Unlock with Pro</Link>
                </Button>
              ) : (
                <Button asChild className="rounded-full">
                  <Link to="/auth">Sign in to continue</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/toolkits">Browse toolkits</Link>
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-10 pb-8">
        <Link
          to="/toolkits/$slug"
          params={{ slug: full.toolkit?.slug ?? "" }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {full.toolkit?.name ?? "Toolkit"}
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="eyebrow">{full.category?.name ?? "Prompt"}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
              {full.title}
            </h1>
            {full.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {full.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full">
                {full.difficulty}
              </Badge>
              <Badge variant={full.access_level === "pro" ? "secondary" : "outline"} className="rounded-full">
                {full.access_level === "pro" ? "Pro" : "Free"}
              </Badge>
              {(full.tags ?? []).map((t) => (
                <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
          {user && (
            <Button variant="outline" className="rounded-full" onClick={toggleFavorite}>
              <Heart className={`size-4 ${favorite ? "fill-current text-primary" : ""}`} />
              {favorite ? "Saved" : "Save"}
            </Button>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="ledger-card h-fit p-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Your details</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Fill these in and the prompt updates instantly.
            </p>
            <div className="mt-5 space-y-4">
              {variables.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  This prompt has no variables — copy it as is.
                </p>
              )}
              {variables.map((v) => (
                <div key={v.name} className="space-y-1.5">
                  <Label htmlFor={v.name}>
                    {v.label ?? v.name}
                    {v.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {v.type === "textarea" ? (
                    <Textarea
                      id={v.name}
                      rows={4}
                      placeholder={v.placeholder}
                      value={values[v.name] ?? ""}
                      onChange={(e) => setValues((s) => ({ ...s, [v.name]: e.target.value }))}
                    />
                  ) : v.type === "select" && (v.options ?? []).length > 0 ? (
                    <Select
                      value={values[v.name] ?? ""}
                      onValueChange={(val) => setValues((s) => ({ ...s, [v.name]: val }))}
                    >
                      <SelectTrigger id={v.name}>
                        <SelectValue placeholder={v.placeholder ?? "Choose one"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(v.options ?? []).map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={v.name}
                      placeholder={v.placeholder}
                      value={values[v.name] ?? ""}
                      onChange={(e) => setValues((s) => ({ ...s, [v.name]: e.target.value }))}
                    />
                  )}
                  {v.help && <p className="text-xs text-muted-foreground">{v.help}</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="ledger-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Your prompt
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    className="rounded-full" 
                    onClick={generateAnswer}
                    disabled={isGenerating}
                  >
                    <Sparkles className={`size-4 ${isGenerating ? 'animate-pulse text-primary' : ''}`} />
                    {isGenerating ? "Generating..." : "Generate Answer with AI"}
                  </Button>
                  <Button className="rounded-full" onClick={copyPrompt}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copied" : "Copy prompt"}
                  </Button>
                </div>
              </div>
              <pre className="mt-4 max-h-[28rem] overflow-auto rounded-xl bg-secondary p-4 text-sm leading-relaxed whitespace-pre-wrap text-secondary-foreground">
                {output}
              </pre>

              {aiResponse && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="size-5 text-primary" />
                    <h3 className="font-display font-semibold text-foreground">AI Response</h3>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert bg-primary/5 rounded-xl p-4">
                    <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 m-0 text-foreground">{aiResponse}</pre>
                  </div>
                </div>
              )}
            </div>

            {full.instructions && (
              <div className="ledger-card p-6">
                <p className="label-caps">How to use it</p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {full.instructions}
                </p>
              </div>
            )}
            {full.example_output && (
              <div className="ledger-card p-6">
                <p className="label-caps">Example output</p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {full.example_output}
                </p>
              </div>
            )}
            {full.pro_tip && (
              <div className="ledger-card border-accent/40 p-6">
                <p className="label-caps">Pro tip</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{full.pro_tip}</p>
              </div>
            )}
            {full.warning && (
              <div className="ledger-card border-destructive/40 p-6">
                <p className="label-caps text-destructive">Integrity warning</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{full.warning}</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
