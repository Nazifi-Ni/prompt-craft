import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function useMembers() {
  return useQuery({
    queryKey: ["admin", "members"],
    queryFn: async () => {
      const [profiles, roles, subs] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,email,suspended,last_login_at,created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("subscriptions").select("user_id,status,current_period_end"),
      ]);
      if (profiles.error) throw profiles.error;
      const roleMap = new Map<string, string[]>();
      for (const r of roles.data ?? []) {
        roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
      }
      const proSet = new Set(
        (subs.data ?? [])
          .filter(
            (s) =>
              s.status === "active" &&
              (!s.current_period_end || new Date(s.current_period_end) > new Date()),
          )
          .map((s) => s.user_id),
      );
      return (profiles.data ?? []).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) ?? [],
        isPro: proSet.has(p.id),
      }));
    },
  });
}

function AdminUsers() {
  const { data, isLoading } = useMembers();
  const [term, setTerm] = useState("");
  const queryClient = useQueryClient();

  const suspend = useMutation({
    mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => {
      const { error } = await supabase.from("profiles").update({ suspended }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data ?? []).filter((m) => {
    const q = term.trim().toLowerCase();
    if (!q) return true;
    return (m.email ?? "").toLowerCase().includes(q) || (m.full_name ?? "").toLowerCase().includes(q);
  });

  return (
    <section>
      <p className="eyebrow">People</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-foreground">Members</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everyone who has signed up, with their access level and account status.
      </p>

      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search by name or email"
        className="mt-6 max-w-sm"
      />

      {isLoading ? (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="ledger-card mt-6 divide-y divide-border">
          {rows.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {m.full_name ?? "Unnamed member"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.email ?? "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joined {formatDate(m.created_at)} · Last seen {formatDate(m.last_login_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {m.roles.includes("admin") && (
                  <Badge variant="outline" className="rounded-full">
                    Admin
                  </Badge>
                )}
                <Badge variant={m.isPro ? "outline" : "secondary"} className="rounded-full">
                  {m.isPro ? "Pro" : "Free"}
                </Badge>
                {m.suspended && (
                  <Badge variant="destructive" className="rounded-full">
                    Suspended
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={suspend.isPending}
                  onClick={() => suspend.mutate({ id: m.id, suspended: !m.suspended })}
                >
                  {m.suspended ? "Restore" : "Suspend"}
                </Button>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No members match that search.</p>
          )}
        </div>
      )}
    </section>
  );
}
