import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { useAccount } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/toolkits", label: "Toolkits" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/prompts", label: "Prompts" },
  { to: "/admin/plans", label: "Plans" },
  { to: "/admin/subscriptions", label: "Subscriptions" },
  { to: "/admin/users", label: "Members" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/faqs", label: "FAQs" },
  { to: "/admin/settings", label: "Settings" },
] as const;


export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading } = useAccount();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pt-10 pb-20">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !isAdmin ? (
          <div className="ledger-card p-8">
            <p className="eyebrow">Restricted</p>
            <h1 className="mt-3 font-display text-2xl font-semibold text-foreground">
              Admin access required
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account does not have the admin role, so the content manager is unavailable.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        ) : (
          <>
            <nav className="mb-8 flex flex-wrap gap-1.5">
              {tabs.map((tab) => (
                <Link
                  key={tab.to}
                  to={tab.to}
                  activeOptions={{ exact: tab.to === "/admin" }}
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-foreground" }}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
            <Outlet />
          </>
        )}
      </main>
    </div>
  );
}
