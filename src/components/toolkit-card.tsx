import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";
import { isToolkitPro } from "@/lib/access";

export function ToolkitCard({ toolkit }: { toolkit: Tables<"toolkits"> }) {
  const pro = isToolkitPro(toolkit);

  return (
    <Link
      to="/toolkits/$slug"
      params={{ slug: toolkit.slug }}
      className="ledger-card ledger-card-hover group flex flex-col p-6 hover:ledger-card-hover-on"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="label-caps">{toolkit.audience ?? "Toolkit"}</p>
        {pro ? (
          <Badge variant="secondary" className="gap-1 rounded-full text-[11px]">
            <Lock className="size-3" /> Pro
          </Badge>
        ) : (
          <Badge className="rounded-full bg-accent text-[11px] text-accent-foreground">Free access</Badge>
        )}
      </div>
      <h3 className="mt-3 font-display text-xl leading-snug font-semibold text-foreground">
        {toolkit.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {toolkit.short_description ?? toolkit.description}
      </p>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        Open toolkit
        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
