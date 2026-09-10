-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.access_level AS ENUM ('free','pro');
CREATE TYPE public.difficulty_level AS ENUM ('beginner','intermediate','advanced');
CREATE TYPE public.content_status AS ENUM ('draft','published','archived');
CREATE TYPE public.subscription_status AS ENUM ('active','pending','expired','cancelled','failed');
CREATE TYPE public.transaction_status AS ENUM ('pending','success','failed','abandoned');
CREATE TYPE public.billing_interval AS ENUM ('free','monthly','annual');

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  suspended BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- SUBSCRIPTION PLANS
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  interval public.billing_interval NOT NULL DEFAULT 'monthly',
  features TEXT[] NOT NULL DEFAULT '{}',
  grants_access public.access_level NOT NULL DEFAULT 'free',
  usage_limit INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.subscription_plans FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin());
CREATE POLICY "plans admin write" ON public.subscription_plans FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  provider TEXT,
  provider_reference TEXT,
  started_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id, status);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs read own" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "subs admin write" ON public.subscriptions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  provider TEXT NOT NULL DEFAULT 'paystack',
  reference TEXT NOT NULL UNIQUE,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "txn read own" ON public.transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- TOOLKITS
CREATE TABLE public.toolkits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  audience TEXT,
  outcomes TEXT[] NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',
  icon TEXT,
  image_url TEXT,
  access_level public.access_level NOT NULL DEFAULT 'pro',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.toolkits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.toolkits TO authenticated;
GRANT ALL ON public.toolkits TO service_role;
ALTER TABLE public.toolkits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "toolkits public read" ON public.toolkits FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_admin());
CREATE POLICY "toolkits admin write" ON public.toolkits FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CATEGORIES
CREATE TABLE public.toolkit_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toolkit_id UUID NOT NULL REFERENCES public.toolkits(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (toolkit_id, slug)
);
CREATE INDEX categories_toolkit_idx ON public.toolkit_categories(toolkit_id, display_order);
GRANT SELECT ON public.toolkit_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.toolkit_categories TO authenticated;
GRANT ALL ON public.toolkit_categories TO service_role;
ALTER TABLE public.toolkit_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cats public read" ON public.toolkit_categories FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_admin());
CREATE POLICY "cats admin write" ON public.toolkit_categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PROMPTS
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toolkit_id UUID NOT NULL REFERENCES public.toolkits(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.toolkit_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  instructions TEXT,
  body TEXT NOT NULL DEFAULT '',
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  example_input TEXT,
  example_output TEXT,
  pro_tip TEXT,
  warning TEXT,
  difficulty public.difficulty_level NOT NULL DEFAULT 'beginner',
  tags TEXT[] NOT NULL DEFAULT '{}',
  access_level public.access_level NOT NULL DEFAULT 'pro',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (toolkit_id, slug)
);
CREATE INDEX prompts_toolkit_idx ON public.prompts(toolkit_id, display_order);
CREATE INDEX prompts_category_idx ON public.prompts(category_id);
CREATE INDEX prompts_tags_idx ON public.prompts USING GIN(tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts TO authenticated;
GRANT ALL ON public.prompts TO service_role;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prompts free read" ON public.prompts FOR SELECT TO authenticated
  USING (status = 'published' AND (access_level = 'free' OR public.has_active_subscription(auth.uid()) OR public.is_admin()));
CREATE POLICY "prompts admin write" ON public.prompts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Metadata-only view so locked prompts can still be listed publicly (no body/variables)
CREATE VIEW public.prompt_cards
WITH (security_invoker = false) AS
  SELECT p.id, p.toolkit_id, p.category_id, p.title, p.slug, p.description,
         p.difficulty, p.tags, p.access_level, p.is_featured, p.display_order,
         t.slug AS toolkit_slug, t.name AS toolkit_name,
         c.name AS category_name, c.slug AS category_slug, c.display_order AS category_order
  FROM public.prompts p
  JOIN public.toolkits t ON t.id = p.toolkit_id
  LEFT JOIN public.toolkit_categories c ON c.id = p.category_id
  WHERE p.status = 'published' AND t.status = 'published';
GRANT SELECT ON public.prompt_cards TO anon, authenticated;

-- FAVORITES
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, prompt_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites own" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- USAGE
CREATE TABLE public.prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX prompt_usage_idx ON public.prompt_usage(prompt_id, action);
GRANT SELECT, INSERT ON public.prompt_usage TO authenticated;
GRANT ALL ON public.prompt_usage TO service_role;
ALTER TABLE public.prompt_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage insert own" ON public.prompt_usage FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "usage read own" ON public.prompt_usage FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.toolkit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  toolkit_id UUID NOT NULL REFERENCES public.toolkits(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.toolkit_usage TO authenticated;
GRANT ALL ON public.toolkit_usage TO service_role;
ALTER TABLE public.toolkit_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tkusage insert own" ON public.toolkit_usage FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tkusage read own" ON public.toolkit_usage FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE TABLE public.searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.searches TO authenticated;
GRANT ALL ON public.searches TO service_role;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "searches insert own" ON public.searches FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "searches read admin" ON public.searches FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- BONUSES
CREATE TABLE public.bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toolkit_id UUID REFERENCES public.toolkits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'guide',
  description TEXT,
  url TEXT,
  access_level public.access_level NOT NULL DEFAULT 'pro',
  display_order INTEGER NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bonuses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonuses TO authenticated;
GRANT ALL ON public.bonuses TO service_role;
ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bonuses public read" ON public.bonuses FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_admin());
CREATE POLICY "bonuses admin write" ON public.bonuses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- FAQS
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs public read" ON public.faqs FOR SELECT TO anon, authenticated USING (is_published OR public.is_admin());
CREATE POLICY "faqs admin write" ON public.faqs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif own update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- SITE SETTINGS
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at triggers
CREATE TRIGGER t1 BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t2 BEFORE UPDATE ON public.toolkits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t3 BEFORE UPDATE ON public.toolkit_categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t4 BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t5 BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t6 BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t7 BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t8 BEFORE UPDATE ON public.bonuses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t9 BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();