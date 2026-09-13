import { Link } from "@tanstack/react-router";
import { Lock, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";
import { isPromptPro } from "@/lib/access";

export function PromptCard({
  prompt,
  index,
  unlocked,
}: {
  prompt: Tables<"prompt_cards">;
  index?: number;
  unlocked: boolean;
}) {
  const isPro = isPromptPro(prompt);
  const locked = isPro && !unlocked;

  return (
    <Link
      to="/prompts/$slug"
      params={{ slug: prompt.slug ?? "" }}
      className="ledger-card ledger-card-hover flex gap-4 p-5 hover:ledger-card-hover-on"
    >
      {typeof index === "number" && (
        <span className="font-display text-sm font-semibold text-muted-foreground tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm leading-snug font-semibold text-foreground">{prompt.title}</h3>
          <Badge
            variant={locked ? "secondary" : "outline"}
            className="shrink-0 gap-1 rounded-full text-[10px]"
          >
            {locked ? <Lock className="size-2.5" /> : <Unlock className="size-2.5" />}
            {locked ? "Pro" : "Open"}
          </Badge>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {prompt.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prompt.difficulty && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium tracking-wide text-secondary-foreground uppercase">
              {prompt.difficulty}
            </span>
          )}
          {(prompt.tags ?? []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
