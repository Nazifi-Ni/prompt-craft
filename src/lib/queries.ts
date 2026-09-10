import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function unwrap<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw error;
  return (data ?? []) as T;
}

export const toolkitsQuery = () =>
  queryOptions({
    queryKey: ["toolkits"],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("toolkits")
          .select("*")
          .eq("status", "published")
          .order("display_order"),
      ),
  });

export const toolkitQuery = (slug: string) =>
  queryOptions({
    queryKey: ["toolkit", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("toolkits")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const categoriesQuery = (toolkitId: string | undefined) =>
  queryOptions({
    queryKey: ["categories", toolkitId],
    enabled: !!toolkitId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("toolkit_categories")
          .select("*")
          .eq("toolkit_id", toolkitId!)
          .eq("status", "published")
          .order("display_order"),
      ),
  });

/** Non-sensitive prompt metadata — readable by anyone (locked-card UI). */
export const promptCardsQuery = (toolkitId: string | undefined) =>
  queryOptions({
    queryKey: ["prompt-cards", toolkitId],
    enabled: !!toolkitId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("prompt_cards")
          .select("*")
          .eq("toolkit_id", toolkitId!)
          .order("category_order")
          .order("display_order"),
      ),
  });

export const plansQuery = () =>
  queryOptions({
    queryKey: ["plans"],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("display_order"),
      ),
  });

export const faqsQuery = () =>
  queryOptions({
    queryKey: ["faqs"],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("faqs")
          .select("*")
          .eq("is_published", true)
          .order("display_order"),
      ),
  });

export const bonusesQuery = (toolkitId: string | undefined) =>
  queryOptions({
    queryKey: ["bonuses", toolkitId],
    enabled: !!toolkitId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("bonuses")
          .select("*")
          .eq("toolkit_id", toolkitId!)
          .eq("status", "published")
          .order("display_order"),
      ),
  });

/** Full prompt — RLS returns it only for free prompts, subscribers or admins. */
export const promptQuery = (slug: string) =>
  queryOptions({
    queryKey: ["prompt", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*, toolkit:toolkits(name,slug), category:toolkit_categories(name,slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const promptCardBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["prompt-card", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_cards")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const favoritesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("favorites")
          .select("id,prompt_id,created_at")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false }),
      ),
  });

export const searchPromptCardsQuery = (term: string) =>
  queryOptions({
    queryKey: ["search", term],
    enabled: term.trim().length > 1,
    queryFn: async () =>
      unwrap(
        await supabase
          .from("prompt_cards")
          .select("*")
          .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
          .limit(40),
      ),
  });

export const siteSettingsQuery = () =>
  queryOptions({
    queryKey: ["site_settings"],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("site_settings")
          .select("*")
      ),
  });
