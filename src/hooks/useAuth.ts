import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export type AccountState = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isPro: boolean;
};

export function useAccount(): AccountState {
  const { user, loading } = useSession();

  const { data } = useQuery({
    queryKey: ["account-state", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [roles, subs] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        supabase
          .from("subscriptions")
          .select("status,current_period_end")
          .eq("user_id", user!.id)
          .eq("status", "active"),
      ]);
      const isAdmin = (roles.data ?? []).some((r) => r.role === "admin");
      const isPro = (subs.data ?? []).some(
        (s) => !s.current_period_end || new Date(s.current_period_end) > new Date(),
      );
      return { isAdmin, isPro };
    },
  });

  return {
    user,
    loading,
    isAdmin: data?.isAdmin ?? false,
    isPro: (data?.isPro ?? false) || (data?.isAdmin ?? false),
  };
}
