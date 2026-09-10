import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  component: AdminSubscriptions,
});

function AdminSubscriptions() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState("");
  const [months, setMonths] = useState("12");

  const { data: plans } = useQuery({
    queryKey: ["admin", "plan-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("id,name,price_amount,currency,grants_access")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: async () => {
      const [subs, profiles] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*, plan:subscription_plans(name,interval)")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,email,full_name"),
      ]);
      if (subs.error) throw subs.error;
      const people = new Map((profiles.data ?? []).map((p) => [p.id, p]));
      return (subs.data ?? []).map((s) => ({ ...s, person: people.get(s.user_id) ?? null }));
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
  };

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "cancelled" }) => {
      const patch =
        status === "active"
          ? { status, started_at: new Date().toISOString(), cancelled_at: null }
          : { status, cancelled_at: new Date().toISOString() };
      const { error } = await supabase.from("subscriptions").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subscription updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grant = useMutation({
    mutationFn: async () => {
      const target = email.trim().toLowerCase();
      if (!target) throw new Error("Enter the member's email");
      if (!planId) throw new Error("Choose a plan");
      const { data: person, error: personError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", target)
        .maybeSingle();
      if (personError) throw personError;
      if (!person) throw new Error("No member found with that email");
      const plan = (plans ?? []).find((p) => p.id === planId);
      const end = new Date();
      end.setMonth(end.getMonth() + Math.max(1, Number(months) || 1));
      const { error } = await supabase.from("subscriptions").insert({
        user_id: person.id,
        plan_id: planId,
        status: "active",
        amount: Number(plan?.price_amount ?? 0),
        currency: plan?.currency ?? "NGN",
        provider: "manual",
        started_at: new Date().toISOString(),
        current_period_end: end.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Access granted");
      setEmail("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section>
      <p className="eyebrow">Billing</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-foreground">Subscriptions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Grant or revoke paid access manually while card checkout is being connected.
      </p>

      <div className="ledger-card mt-6 grid gap-4 p-5 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Label htmlFor="grant-email">Member email</Label>
          <Input
            id="grant-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="grant-plan">Plan</Label>
          <select
            id="grant-plan"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select…</option>
            {(plans ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="grant-months">Months</Label>
          <Input
            id="grant-months"
            type="number"
            min={1}
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-4">
          <Button
            className="rounded-full"
            disabled={grant.isPending}
            onClick={() => grant.mutate()}
          >
            {grant.isPending ? "Granting…" : "Grant access"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <div className="ledger-card mt-6 divide-y divide-border">
          {(data ?? []).map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {s.person?.email ?? s.user_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.plan?.name ?? "No plan"} · {formatPrice(Number(s.amount), s.currency)} ·{" "}
                  {s.provider ?? "manual"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Started {formatDate(s.started_at)} · Ends {formatDate(s.current_period_end)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={s.status === "active" ? "outline" : "secondary"}
                  className="rounded-full"
                >
                  {s.status}
                </Badge>
                {s.status === "active" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id: s.id, status: "cancelled" })}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id: s.id, status: "active" })}
                  >
                    Activate
                  </Button>
                )}
              </div>
            </div>
          ))}
          {(data ?? []).length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No subscription records yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
