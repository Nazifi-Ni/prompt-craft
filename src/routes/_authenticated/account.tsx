import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account settings — Meridian" },
      {
        name: "description",
        content: "Update your Meridian profile details and review your notifications.",
      },
      { property: "og:title", content: "Account settings — Meridian" },
      { property: "og:description", content: "Manage your Meridian profile." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAccount();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, email: user.email ?? null });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile updated.");
      void refetch();
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pt-12 pb-8">
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">Your profile</h1>

        <div className="ledger-card mt-8 space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Member since {formatDate(profile?.created_at)}
          </p>
          <Button onClick={save} disabled={saving} className="rounded-full">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <h2 className="mt-12 font-display text-xl font-semibold text-foreground">Notifications</h2>
        <div className="mt-4 space-y-3">
          {(notifications ?? []).map((n) => (
            <div key={n.id} className="ledger-card p-5">
              <p className="text-sm font-semibold text-foreground">{n.title}</p>
              {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
            </div>
          ))}
          {(notifications ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
