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
-- Split anon vs authenticated read policies so anon never evaluates admin helpers
DROP POLICY "toolkits public read" ON public.toolkits;
CREATE POLICY "toolkits anon read" ON public.toolkits FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "toolkits auth read" ON public.toolkits FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());

DROP POLICY "cats public read" ON public.toolkit_categories;
CREATE POLICY "cats anon read" ON public.toolkit_categories FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "cats auth read" ON public.toolkit_categories FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());

DROP POLICY "plans public read" ON public.subscription_plans;
CREATE POLICY "plans anon read" ON public.subscription_plans FOR SELECT TO anon USING (is_active);
CREATE POLICY "plans auth read" ON public.subscription_plans FOR SELECT TO authenticated USING (is_active OR public.is_admin());

DROP POLICY "faqs public read" ON public.faqs;
CREATE POLICY "faqs anon read" ON public.faqs FOR SELECT TO anon USING (is_published);
CREATE POLICY "faqs auth read" ON public.faqs FOR SELECT TO authenticated USING (is_published OR public.is_admin());

DROP POLICY "bonuses public read" ON public.bonuses;
CREATE POLICY "bonuses anon read" ON public.bonuses FOR SELECT TO anon USING (status = 'published');
CREATE POLICY "bonuses auth read" ON public.bonuses FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());

-- Internal helpers must not be callable by signed-out visitors
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_active_subscription(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO authenticated, service_role;
-- PLANS
INSERT INTO public.subscription_plans (name, slug, description, price_amount, currency, interval, features, grants_access, usage_limit, display_order) VALUES
('Free','free','Explore the platform with sample prompts.',0,'NGN','free',
 ARRAY['Browse every toolkit overview','Access all free sample prompts','Prompt workspace on free prompts','Up to 10 prompt generations / month'],'free',10,1),
('Pro','pro','Full access to every premium toolkit and prompt.',4500,'NGN','monthly',
 ARRAY['All premium toolkits','Full prompt library','Unlimited prompt workspace','Unlimited favorites','Bonus guides and templates','New toolkits as they launch'],'pro',NULL,2),
('Annual','annual','Everything in Pro, billed yearly at a discount.',38000,'NGN','annual',
 ARRAY['Everything in Pro','2 months free vs monthly','Priority support','Early access to new toolkits'],'pro',NULL,3);

-- TOOLKITS
INSERT INTO public.toolkits (name, slug, short_description, description, audience, outcomes, features, icon, access_level, is_featured, display_order, seo_title, seo_description) VALUES
('Scholarship AI Toolkit','scholarship-ai-toolkit',
 '100+ prompts for scholarship research, essays, CVs, interviews and applications.',
 'A complete, step-by-step prompt system for building a scholarship application that actually sounds like you. Work through discovery, profile analysis, personal statements, essays, short answers, your CV, recommendation letters, application review, interviews and final submission.',
 'Undergraduate and postgraduate scholarship applicants, especially students applying from Nigeria and other African countries to local and international funding schemes.',
 ARRAY['Find scholarships that actually match your profile','Write a personal statement in your own voice','Answer common essay and short-answer questions with structure','Build a scholarship-ready CV','Brief your referees properly','Walk into the interview prepared'],
 ARRAY['10 guided categories','Variable-driven prompt workspace','Example inputs and outputs','Pro tips and integrity warnings','Bonus checklists and templates'],
 'graduation-cap','pro',true,1,
 'Scholarship AI Toolkit — 100+ Prompts for Winning Applications',
 'A guided library of AI prompts for scholarship discovery, personal statements, essays, CVs, recommendation letters and interview preparation.'),
('Student AI Toolkit','student-ai-toolkit',
 'Prompts for learning, assignments, research, presentations and academic productivity.',
 'Study smarter, not longer. Prompts that help you understand hard topics, plan assignments, revise for exams, structure research and present your work clearly.',
 'University and secondary school students who want AI to support real learning rather than replace it.',
 ARRAY['Understand difficult topics faster','Plan and structure assignments','Revise with active recall','Build clear presentations'],
 ARRAY['Study-plan generators','Concept explainers','Assignment planners','Revision and exam prep'],
 'book-open','pro',true,2,
 'Student AI Toolkit — Study, Research and Assignment Prompts',
 'AI prompts for learning, assignments, research, revision and academic productivity.'),
('Developer AI Toolkit','developer-ai-toolkit',
 'Prompts for coding, debugging, project planning, documentation and development.',
 'A working developer''s prompt library: scope a feature, debug faster, review your own code, write documentation people actually read, and plan projects properly.',
 'Web developers, students learning to code, and engineers who want AI to speed up real delivery work.',
 ARRAY['Debug faster with structured prompts','Plan features before you build','Write documentation and tests','Review your own code critically'],
 ARRAY['Debugging workflows','Architecture planning','Code review checklists','Documentation generators'],
 'code','pro',true,3,
 'Developer AI Toolkit — Coding, Debugging and Documentation Prompts',
 'AI prompts for debugging, project planning, code review and technical documentation.'),
('Job Seeker AI Toolkit','job-seeker-ai-toolkit',
 'Prompts for CVs, cover letters, LinkedIn, applications and interview preparation.',
 'Everything you need to move from "applying everywhere" to "getting interviews": tailored CVs, honest cover letters, a sharper profile, and interview answers you can actually deliver.',
 'Graduates and professionals actively applying for roles.',
 ARRAY['Tailor your CV to each role','Write cover letters that sound human','Prepare structured interview answers','Follow up professionally'],
 ARRAY['CV tailoring','Cover letters','Interview drills','Follow-up templates'],
 'briefcase','pro',false,4,
 'Job Seeker AI Toolkit — CV, Cover Letter and Interview Prompts',
 'AI prompts for CV tailoring, cover letters, applications and interview preparation.');

-- SCHOLARSHIP CATEGORIES
INSERT INTO public.toolkit_categories (toolkit_id, name, slug, description, display_order)
SELECT t.id, v.name, v.slug, v.descr, v.ord
FROM public.toolkits t, (VALUES
 ('Scholarship Discovery & Research','discovery','Find relevant opportunities and understand eligibility.',1),
 ('Understanding Your Profile','profile','Audit your strengths, gaps and story before you write.',2),
 ('Personal Statements','personal-statements','Build authentic and compelling personal statements.',3),
 ('Scholarship Essays','essays','Handle common scholarship essay questions.',4),
 ('Short-Answer Questions','short-answers','Say a lot in very few words.',5),
 ('CV & Résumé','cv','Shape experience into a clear, credible scholarship CV.',6),
 ('Recommendation & References','references','Brief your referees so they can write well.',7),
 ('Application Review','review','Stress-test your application before you send it.',8),
 ('Scholarship Interview Preparation','interviews','Prepare answers you can actually deliver.',9),
 ('Final Submission & Follow-Up','submission','Submit cleanly and follow up professionally.',10)
) AS v(name, slug, descr, ord)
WHERE t.slug = 'scholarship-ai-toolkit';

-- OTHER TOOLKIT CATEGORIES
INSERT INTO public.toolkit_categories (toolkit_id, name, slug, description, display_order)
SELECT t.id, v.name, v.slug, v.descr, v.ord
FROM public.toolkits t, (VALUES
 ('Learning & Understanding','learning','Break down hard topics into something you can hold.',1),
 ('Assignments & Writing','assignments','Plan, structure and improve written work.',2),
 ('Research','research','Find, read and synthesise sources properly.',3),
 ('Exams & Revision','revision','Revise with active recall and spaced practice.',4)
) AS v(name, slug, descr, ord)
WHERE t.slug = 'student-ai-toolkit';

INSERT INTO public.toolkit_categories (toolkit_id, name, slug, description, display_order)
SELECT t.id, v.name, v.slug, v.descr, v.ord
FROM public.toolkits t, (VALUES
 ('Planning & Architecture','planning','Scope and design before you write code.',1),
 ('Debugging','debugging','Find the actual cause, not the first guess.',2),
 ('Code Review & Refactoring','review','Raise the quality bar on your own work.',3),
 ('Documentation','documentation','Write docs people actually read.',4)
) AS v(name, slug, descr, ord)
WHERE t.slug = 'developer-ai-toolkit';

INSERT INTO public.toolkit_categories (toolkit_id, name, slug, description, display_order)
SELECT t.id, v.name, v.slug, v.descr, v.ord
FROM public.toolkits t, (VALUES
 ('CV & Résumé','cv','Tailor your CV to the role in front of you.',1),
 ('Cover Letters','cover-letters','Write letters that sound like a person.',2),
 ('Applications & Outreach','outreach','Apply and follow up without being ignored.',3),
 ('Interviews','interviews','Prepare structured, honest answers.',4)
) AS v(name, slug, descr, ord)
WHERE t.slug = 'job-seeker-ai-toolkit';

-- PROMPTS
INSERT INTO public.prompts (toolkit_id, category_id, title, slug, description, purpose, instructions, body, variables, example_input, example_output, pro_tip, warning, difficulty, tags, access_level, is_featured, display_order)
SELECT t.id, c.id, v.title, v.slug, v.descr, v.purpose, v.instructions, v.body, v.vars::jsonb, v.ex_in, v.ex_out, v.tip, v.warn, v.diff::public.difficulty_level, v.tags, v.acc::public.access_level, v.feat, v.ord
FROM public.toolkits t
JOIN public.toolkit_categories c ON c.toolkit_id = t.id
JOIN (VALUES
-- DISCOVERY
('discovery','Scholarship Opportunity Finder','scholarship-opportunity-finder',
 'Generate a shortlist of scholarships that genuinely fit your course, level and nationality.',
 'Stop applying blindly. Narrow the field to opportunities where you are actually eligible.',
 'Fill in your details, generate the prompt, then verify every scholarship you are given on its official website.',
 'Act as a scholarship research adviser. I am a [NATIONALITY] student planning to study [COURSE] at [LEVEL] level, starting around [START_YEAR]. My preferred study destinations are [DESTINATIONS]. My current academic standing is [ACADEMIC_STANDING] and my approximate budget gap is [BUDGET_GAP].

Give me a shortlist of scholarship types and named schemes I should investigate. For each one, list: the scheme name, who funds it, typical eligibility, what it covers, roughly when applications open, and one reason it fits my profile. Rank them from most to least realistic for me. Flag any where my profile is likely too weak, and say what would need to change.

Do not invent scholarships or deadlines. Where you are unsure, say so and tell me exactly what to search for on official sources.',
 '[{"key":"NATIONALITY","label":"Your nationality","type":"text","placeholder":"Nigerian","required":true},{"key":"COURSE","label":"Course / field of study","type":"text","placeholder":"Computer Engineering","required":true},{"key":"LEVEL","label":"Study level","type":"select","options":["Undergraduate","Master''s","PhD"],"required":true},{"key":"START_YEAR","label":"Intended start year","type":"text","placeholder":"2027","required":true},{"key":"DESTINATIONS","label":"Preferred destinations","type":"text","placeholder":"UK, Canada, Germany","required":true},{"key":"ACADEMIC_STANDING","label":"Academic standing","type":"text","placeholder":"Second Class Upper, 4.2/5.0 CGPA","required":true},{"key":"BUDGET_GAP","label":"Funding gap","type":"text","placeholder":"Full tuition and living costs","required":false}]',
 'Nigerian · Computer Engineering · Master''s · 2027 · UK, Canada, Germany · 4.2/5.0 CGPA · full funding needed',
 'A ranked shortlist covering Chevening, Commonwealth Master''s, DAAD and named university scholarships, each with eligibility notes and a realism rating for your profile.',
 'Run this once per destination country instead of all at once — you will get far more specific results.',
 'Always confirm eligibility, deadlines and covered costs on the official scheme website. AI can be out of date.',
 'beginner', ARRAY['discovery','research','eligibility'], 'free', true, 1),

('discovery','Eligibility Gap Checker','eligibility-gap-checker',
 'Paste a scholarship''s requirements and find out honestly where you fall short.',
 'Know before you spend two weeks writing whether you are actually eligible.',
 'Copy the official eligibility criteria into the field below.',
 'Act as a scholarship eligibility assessor. Here are the official requirements for [SCHOLARSHIP_NAME]:

[REQUIREMENTS]

Here is my profile:
[MY_PROFILE]

Go through the requirements one by one. For each, mark it MET, PARTIALLY MET, NOT MET or UNCLEAR, and explain briefly why. Then give me an overall verdict: should I apply, apply with caveats, or not apply this cycle? If there are gaps I could realistically close before the deadline of [DEADLINE], list them as concrete actions.

Be blunt. Do not tell me I qualify if I do not.',
 '[{"key":"SCHOLARSHIP_NAME","label":"Scholarship name","type":"text","required":true},{"key":"REQUIREMENTS","label":"Official eligibility requirements","type":"textarea","placeholder":"Paste from the official page","required":true},{"key":"MY_PROFILE","label":"Your profile","type":"textarea","placeholder":"Degree, CGPA, work experience, nationality, age...","required":true},{"key":"DEADLINE","label":"Application deadline","type":"text","placeholder":"12 November 2027","required":false}]',
 'Chevening requirements pasted + a profile with 1 year work experience',
 'A requirement-by-requirement verdict showing the work-experience hours as the one gap, with a plan to close it.',
 'Paste the requirements verbatim. Summarising them is where mistakes creep in.',
 'Eligibility rules change every cycle. Verify against the current official page.',
 'beginner', ARRAY['discovery','eligibility'], 'free', false, 2),

('discovery','Deadline & Document Planner','deadline-document-planner',
 'Turn a list of target scholarships into a dated action plan.',
 'Avoid the classic failure: a great application submitted two days late.',
 'List your target scholarships and their deadlines, one per line.',
 'Act as an application project manager. Today''s date is [TODAY]. These are the scholarships I am applying to, with their deadlines:

[SCHOLARSHIP_LIST]

For each one, work backwards from the deadline and build a schedule covering: document gathering, first draft, referee request, revision, final review and submission. Assume referees need at least three weeks'' notice. Then merge everything into one combined weekly plan so I can see my real workload. Flag any weeks that are overloaded and suggest what to drop or start earlier.',
 '[{"key":"TODAY","label":"Today''s date","type":"text","required":true},{"key":"SCHOLARSHIP_LIST","label":"Scholarships and deadlines","type":"textarea","placeholder":"Chevening — 5 Nov\\nCommonwealth — 18 Dec","required":true}]',
 'Three scholarships with deadlines across two months',
 'A week-by-week plan with referee requests front-loaded and two overloaded weeks flagged.',
 'Add your exam timetable to the list so the plan respects your real availability.',
 NULL,
 'beginner', ARRAY['planning','deadlines'], 'pro', false, 3),

-- PROFILE
('profile','Profile Strength Audit','profile-strength-audit',
 'Get an honest read on how competitive your profile is, and what to strengthen.',
 'See your application the way a selection panel will see it.',
 'Be specific and factual. Vague inputs produce vague, useless feedback.',
 'Act as a scholarship selection panel member with ten years of experience. Assess my profile for [SCHOLARSHIP_NAME] honestly.

Academic record: [ACADEMICS]
Work / internship experience: [EXPERIENCE]
Leadership and community involvement: [LEADERSHIP]
Awards and recognition: [AWARDS]
Career goal: [CAREER_GOAL]

Give me: (1) my three genuine strengths and why a panel would value them, (2) my three biggest weaknesses, (3) what an average competitive applicant for this scheme looks like and how I compare, (4) the two highest-impact things I could realistically do in the next three months.

Be direct rather than encouraging. I need an accurate read, not reassurance.',
 '[{"key":"SCHOLARSHIP_NAME","label":"Target scholarship","type":"text","required":true},{"key":"ACADEMICS","label":"Academic record","type":"textarea","required":true},{"key":"EXPERIENCE","label":"Work / internship experience","type":"textarea","required":false},{"key":"LEADERSHIP","label":"Leadership & community involvement","type":"textarea","required":false},{"key":"AWARDS","label":"Awards and recognition","type":"textarea","required":false},{"key":"CAREER_GOAL","label":"Career goal","type":"textarea","required":true}]',
 'A profile with strong grades but thin leadership evidence',
 'A panel-style assessment naming grades as the strength, leadership as the gap, and two concrete three-month actions.',
 'Run this before you write anything. It changes what you choose to write about.',
 'Do not add achievements you do not have in order to get a better score. The feedback is only useful if the input is true.',
 'intermediate', ARRAY['profile','self-assessment'], 'free', true, 1),

('profile','Experience Inventory Builder','experience-inventory-builder',
 'Mine your own history for the stories your application needs.',
 'Most applicants forget half of what they have actually done.',
 'Dump everything, unfiltered. Editing comes later.',
 'Act as an application coach helping me build an experience inventory. Here is everything I can remember doing over the last [TIMEFRAME]:

[RAW_EXPERIENCES]

Organise this into categories: academic, leadership, service, technical, personal resilience. For each item, write one line on what skill it demonstrates and which type of scholarship question it could answer. Then tell me which three items are strongest and which are too weak to use. Finally, ask me five questions that might surface experiences I have forgotten.

Work only from what I have given you. Do not invent or embellish anything.',
 '[{"key":"TIMEFRAME","label":"Timeframe to cover","type":"text","placeholder":"the last 4 years","required":true},{"key":"RAW_EXPERIENCES","label":"Everything you can remember","type":"textarea","placeholder":"Class rep, church tech team, final year project, tutoring...","required":true}]',
 'An unstructured list of 12 activities',
 'A categorised inventory with skills mapped to question types, plus five prompting questions.',
 'Answer the five follow-up questions and re-run — the second pass is usually much richer.',
 'Never invent volunteering or roles. Fabricated experience is the fastest way to lose an award.',
 'beginner', ARRAY['profile','stories'], 'pro', false, 2),

-- PERSONAL STATEMENTS
('personal-statements','Leadership Story Builder','leadership-story-builder',
 'Transform a genuine leadership experience into a strong scholarship story.',
 'Turn something you actually did into a structured, believable narrative.',
 'Answer each field with real detail. The prompt is only as good as your specifics.',
 'Act as a scholarship application coach. Help me turn a real leadership experience into a compelling, honest story of no more than [WORD_LIMIT] words.

The experience: [EXPERIENCE]
The problem I faced: [PROBLEM]
The action I personally took: [ACTION]
The result: [RESULT]
What I learned: [LEARNING]

Write it in first person, in a natural voice, using situation-action-result structure. Emphasise what I personally did rather than what the group did. End with the learning, connected to why I am applying for this scholarship. Keep the language plain — no inflated adjectives.

Then list three questions a sceptical panel might ask about this story so I can prepare.

Do not add any detail I have not given you.',
 '[{"key":"EXPERIENCE","label":"Leadership experience","type":"textarea","placeholder":"I led a study group of eight students...","required":true},{"key":"PROBLEM","label":"What problem did you face?","type":"textarea","required":true},{"key":"ACTION","label":"What action did you personally take?","type":"textarea","required":true},{"key":"RESULT","label":"What was the result?","type":"textarea","required":true},{"key":"LEARNING","label":"What did you learn?","type":"textarea","required":true},{"key":"WORD_LIMIT","label":"Word limit","type":"number","placeholder":"250","required":true}]',
 'Study group of eight students, tutor left mid-semester, shared calendar and split syllabus, six of eight improved, learned consistency beats grand gestures.',
 'A 250-word first-person narrative in situation-action-result form, plus three likely panel follow-up questions.',
 'Write the ugly version in the fields first. The prompt does the shaping — you supply the truth.',
 'Do not exaggerate your role or the outcome. Panels interview on these stories.',
 'advanced', ARRAY['personal statement','leadership','storytelling'], 'free', true, 1),

('personal-statements','Personal Statement Skeleton','personal-statement-skeleton',
 'Get a paragraph-by-paragraph outline before you write a single sentence.',
 'Structure first. Most weak statements are weak because they have no shape.',
 'Give the prompt your goal and your two or three strongest experiences.',
 'Act as a personal statement editor. I am applying for [SCHOLARSHIP_NAME] to study [COURSE] at [LEVEL] level. The statement limit is [WORD_LIMIT] words.

My career goal: [CAREER_GOAL]
Why this field: [MOTIVATION]
My strongest experiences: [KEY_EXPERIENCES]
What the scholarship says it values: [SCHEME_VALUES]

Build a paragraph-by-paragraph skeleton. For each paragraph give: its job in the argument, the specific content it should carry, a target word count, and the one sentence it must land. Make the whole thing add up to a single coherent argument for why funding me is a good decision. Do not write the statement itself — only the skeleton.',
 '[{"key":"SCHOLARSHIP_NAME","label":"Scholarship name","type":"text","required":true},{"key":"COURSE","label":"Course","type":"text","required":true},{"key":"LEVEL","label":"Level","type":"select","options":["Undergraduate","Master''s","PhD"],"required":true},{"key":"WORD_LIMIT","label":"Word limit","type":"number","placeholder":"500","required":true},{"key":"CAREER_GOAL","label":"Career goal","type":"textarea","required":true},{"key":"MOTIVATION","label":"Why this field","type":"textarea","required":true},{"key":"KEY_EXPERIENCES","label":"Strongest experiences","type":"textarea","required":true},{"key":"SCHEME_VALUES","label":"What the scheme says it values","type":"textarea","required":false}]',
 'Chevening, MSc Data Science, 500 words, goal of building health data systems in Nigeria',
 'A six-paragraph skeleton with word budgets and one required landing sentence each.',
 'Copy the scheme''s own wording into the values field — mirroring their language legitimately helps.',
 NULL,
 'intermediate', ARRAY['personal statement','structure'], 'pro', true, 2),

('personal-statements','Voice & Authenticity Check','voice-authenticity-check',
 'Check whether your draft still sounds like you, or like a template.',
 'Selection panels read thousands of these. Generic writing disappears.',
 'Paste your current draft in full.',
 'Act as an admissions reader who has read 5,000 personal statements. Here is my draft:

[DRAFT]

Do four things. First, highlight every sentence that could appear in anyone''s statement and explain why it is generic. Second, identify the sentences that are genuinely mine and worth keeping. Third, point out anywhere the tone becomes inflated, over-formal or performative. Fourth, give me five specific questions whose answers would make this draft more concrete.

Do not rewrite the statement. I want to keep my own voice.',
 '[{"key":"DRAFT","label":"Your current draft","type":"textarea","placeholder":"Paste your full draft","required":true}]',
 'A 500-word draft opening with "From a young age I have always been passionate about..."',
 'A line-by-line critique separating generic filler from authentic detail, plus five sharpening questions.',
 'Run this after every major revision, not just once.',
 'Do not ask AI to rewrite the whole statement. Panels can tell, and your own voice is the asset.',
 'advanced', ARRAY['personal statement','editing','authenticity'], 'pro', false, 3),

-- ESSAYS
('essays','Scholarship Essay Planner','scholarship-essay-planner',
 'Decode what an essay question is really asking before you answer it.',
 'Half of all weak essays answer a question that was never asked.',
 'Paste the essay question exactly as written.',
 'Act as a scholarship essay coach. The question is:

"[ESSAY_QUESTION]"

The word limit is [WORD_LIMIT] words. The scholarship is [SCHOLARSHIP_NAME].

First, tell me what this question is actually assessing beneath the surface wording. Second, list the three or four things a strong answer must contain. Third, list the most common ways applicants get this question wrong. Fourth, given my background — [MY_BACKGROUND] — suggest two possible angles and say which is stronger and why. Do not write the essay.',
 '[{"key":"ESSAY_QUESTION","label":"Essay question","type":"textarea","required":true},{"key":"WORD_LIMIT","label":"Word limit","type":"number","required":true},{"key":"SCHOLARSHIP_NAME","label":"Scholarship name","type":"text","required":true},{"key":"MY_BACKGROUND","label":"Your background","type":"textarea","required":true}]',
 '"Describe a time you influenced others" · 300 words',
 'An analysis showing the question tests influence without authority, plus two candidate angles ranked.',
 'Do this for every essay question, even the ones that look obvious.',
 NULL,
 'intermediate', ARRAY['essays','planning'], 'free', false, 1),

('essays','Impact Essay Builder','impact-essay-builder',
 'Answer "how will you use this opportunity" with something specific and credible.',
 'Panels fund plans, not intentions.',
 'The more concrete your plan field, the better this works.',
 'Act as a scholarship essay coach. Help me draft an answer of no more than [WORD_LIMIT] words to a question about the impact I intend to make.

The question: [ESSAY_QUESTION]
The problem I care about: [PROBLEM]
Why it matters where I am from: [CONTEXT]
What I have already done about it: [PRIOR_WORK]
What this course would give me that I lack: [SKILL_GAP]
What I would do in the first two years after graduating: [PLAN]

Write a draft that is specific and measured rather than grand. Prefer concrete actions over ambitions. Ground every claim in something I have actually told you. Where my plan is too vague to be credible, say so in a note at the end instead of inventing detail.',
 '[{"key":"ESSAY_QUESTION","label":"Essay question","type":"textarea","required":true},{"key":"WORD_LIMIT","label":"Word limit","type":"number","required":true},{"key":"PROBLEM","label":"The problem you care about","type":"textarea","required":true},{"key":"CONTEXT","label":"Why it matters where you are from","type":"textarea","required":true},{"key":"PRIOR_WORK","label":"What you have already done","type":"textarea","required":true},{"key":"SKILL_GAP","label":"What the course gives you","type":"textarea","required":true},{"key":"PLAN","label":"First two years after graduating","type":"textarea","required":true}]',
 'Rural clinic record-keeping, a volunteer digitisation project, MSc in health informatics, plan to build an open records tool',
 'A grounded 400-word impact answer plus a note flagging the funding model as the vague part of the plan.',
 'Name real institutions, regions and numbers wherever you honestly can.',
 'Do not promise outcomes you cannot deliver. Overclaiming reads as naive.',
 'advanced', ARRAY['essays','impact'], 'pro', true, 2),

-- SHORT ANSWERS
('short-answers','Short-Answer Compressor','short-answer-compressor',
 'Cut an answer to the word limit without losing what matters.',
 '150-word limits punish waffle. This finds the essential 150.',
 'Paste your over-length answer and the target limit.',
 'Act as a ruthless editor. Here is my answer, currently [CURRENT_LENGTH] words:

[ANSWER]

The question was: [QUESTION]
The hard limit is [WORD_LIMIT] words.

Cut it to the limit. Preserve specifics, numbers and my own phrasing. Remove throat-clearing, restatements of the question, and abstract claims. Show me the cut version, then a short list of exactly what you removed and why, so I can put anything back that I disagree with.',
 '[{"key":"QUESTION","label":"The question","type":"textarea","required":true},{"key":"ANSWER","label":"Your current answer","type":"textarea","required":true},{"key":"CURRENT_LENGTH","label":"Current word count","type":"number","required":false},{"key":"WORD_LIMIT","label":"Target word limit","type":"number","required":true}]',
 'A 280-word answer cut to 150',
 'A 150-word version plus a list of the removed clauses and the reason for each cut.',
 'Always review what was cut. Editors sometimes remove the one detail that made you memorable.',
 NULL,
 'beginner', ARRAY['short answers','editing'], 'free', false, 1),

('short-answers','Why This University Answer','why-this-university-answer',
 'Give a specific, researched answer instead of flattery.',
 '"World-class faculty" tells a panel nothing.',
 'Do the research first — the prompt cannot invent it for you.',
 'Act as an admissions adviser. Help me answer, in [WORD_LIMIT] words, why I want to study [COURSE] at [UNIVERSITY].

Specific things I have found about the programme: [RESEARCH]
My goal: [CAREER_GOAL]
My relevant background: [BACKGROUND]

Write an answer that connects specific features of this programme to specific things I need. Use only the research I have given you. If what I have given you is too thin to make a convincing answer, say so and tell me exactly what to go and look up.',
 '[{"key":"COURSE","label":"Course","type":"text","required":true},{"key":"UNIVERSITY","label":"University","type":"text","required":true},{"key":"WORD_LIMIT","label":"Word limit","type":"number","required":true},{"key":"RESEARCH","label":"What you found about the programme","type":"textarea","placeholder":"Modules, labs, named academics, projects","required":true},{"key":"CAREER_GOAL","label":"Career goal","type":"textarea","required":true},{"key":"BACKGROUND","label":"Relevant background","type":"textarea","required":true}]',
 'Two named modules, one research group, and a goal in health informatics',
 'A 150-word answer tying the named research group directly to the applicant''s goal.',
 'Two named modules and one named academic beats three paragraphs of praise.',
 'Never claim to admire a professor''s work you have not read.',
 'intermediate', ARRAY['short answers','fit'], 'pro', false, 2),

-- CV
('cv','Scholarship CV Rebuilder','scholarship-cv-rebuilder',
 'Convert a job-style CV into a scholarship-style academic CV.',
 'A scholarship CV is not a job CV. The emphasis is different.',
 'Paste your current CV content as plain text.',
 'Act as an academic CV adviser. Here is my current CV:

[CURRENT_CV]

I am applying for [SCHOLARSHIP_NAME] to study [COURSE].

Restructure this as a scholarship CV. Foreground education, research, academic achievement, leadership and service; compress unrelated work history. Rewrite each bullet to lead with an action and end with a concrete result, using only facts already in my CV. Tell me which sections to add, which to cut, and what order they should appear in. At the end, list any gaps a panel would notice.',
 '[{"key":"CURRENT_CV","label":"Your current CV","type":"textarea","required":true},{"key":"SCHOLARSHIP_NAME","label":"Scholarship name","type":"text","required":true},{"key":"COURSE","label":"Course","type":"text","required":true}]',
 'A two-page job CV heavy on retail work',
 'A restructured academic CV outline with rewritten bullets and a note on the missing research section.',
 'Keep it to two pages unless the scheme says otherwise.',
 'Never add qualifications, dates or results that are not already true in your CV.',
 'intermediate', ARRAY['cv','resume'], 'free', false, 1),

('cv','Achievement Bullet Sharpener','achievement-bullet-sharpener',
 'Turn duty-based bullets into result-based ones.',
 '"Responsible for..." wastes the most valuable line on the page.',
 'Paste the bullets you want to improve, one per line.',
 'Act as a CV editor. Rewrite these bullets so each one leads with a strong action verb and ends with a measurable or observable result:

[BULLETS]

Where a bullet has no result attached, do not invent one — instead ask me the specific question that would let me supply it. Keep each bullet under [MAX_WORDS] words. Return the rewritten bullets and the list of questions separately.',
 '[{"key":"BULLETS","label":"Your current bullets","type":"textarea","required":true},{"key":"MAX_WORDS","label":"Max words per bullet","type":"number","placeholder":"20","required":true}]',
 'Six duty-based bullets from a class rep role',
 'Six rewritten bullets and four questions asking for the missing numbers.',
 'Answer the questions and re-run. The second pass is where CVs get strong.',
 NULL,
 'beginner', ARRAY['cv','editing'], 'pro', false, 2),

-- REFERENCES
('references','Referee Briefing Pack','referee-briefing-pack',
 'Give your referee everything they need to write a strong, specific letter.',
 'Busy referees write generic letters when you give them nothing to work with.',
 'Send the output to your referee at least three weeks before the deadline.',
 'Act as an application adviser. Draft a briefing note I can send to my referee, [REFEREE_NAME], who knows me as [RELATIONSHIP].

The scholarship: [SCHOLARSHIP_NAME]
What the scheme values: [SCHEME_VALUES]
The deadline: [DEADLINE]
Things they personally witnessed me do: [SHARED_EXPERIENCES]
Qualities I hope they can speak to: [QUALITIES]

Write a short, polite, well-organised note that gives them concrete reminders and makes their job easy. Include a bulleted list of specific incidents they could cite. Do not write the reference letter itself, and do not put words in their mouth — frame everything as reminders they may or may not choose to use.',
 '[{"key":"REFEREE_NAME","label":"Referee name","type":"text","required":true},{"key":"RELATIONSHIP","label":"How they know you","type":"text","placeholder":"My final year project supervisor","required":true},{"key":"SCHOLARSHIP_NAME","label":"Scholarship","type":"text","required":true},{"key":"SCHEME_VALUES","label":"What the scheme values","type":"textarea","required":false},{"key":"DEADLINE","label":"Deadline","type":"text","required":true},{"key":"SHARED_EXPERIENCES","label":"What they personally witnessed","type":"textarea","required":true},{"key":"QUALITIES","label":"Qualities you hope they mention","type":"textarea","required":true}]',
 'A project supervisor, six shared milestones, deadline in five weeks',
 'A polite briefing email with a reminder list of six specific incidents.',
 'Attach your CV and personal statement draft to the same email.',
 'Never draft the letter for your referee to sign. Many schemes treat that as misconduct.',
 'intermediate', ARRAY['references','letters'], 'pro', false, 1),

-- REVIEW
('review','Full Application Stress Test','full-application-stress-test',
 'Have your whole application reviewed as a sceptical panel would review it.',
 'Find the weak seam before the panel does.',
 'Paste your key documents together. Longer input gives a much better review.',
 'Act as a scholarship selection panel member reviewing my application for [SCHOLARSHIP_NAME]. Here is what I am submitting:

Personal statement: [PERSONAL_STATEMENT]
Key essay answers: [ESSAYS]
CV summary: [CV_SUMMARY]

Review it as a panel would. Give me: (1) the overall impression in three sentences, (2) the single strongest element, (3) the three weakest points and exactly why, (4) any contradictions or unsupported claims across documents, (5) the questions a panel would probe at interview, (6) a score out of 10 with your reasoning.

Be critical rather than kind. If you would not fund me, say so and explain what would change your mind.',
 '[{"key":"SCHOLARSHIP_NAME","label":"Scholarship","type":"text","required":true},{"key":"PERSONAL_STATEMENT","label":"Personal statement","type":"textarea","required":true},{"key":"ESSAYS","label":"Key essay answers","type":"textarea","required":false},{"key":"CV_SUMMARY","label":"CV summary","type":"textarea","required":true}]',
 'A full application package for a Master''s scheme',
 'A panel-style review with a 6.5/10 score, three named weaknesses and five likely interview probes.',
 'Run this twice: once mid-draft, once the week before submission.',
 'A high AI score is not a prediction of success. Use the criticisms, ignore the number.',
 'advanced', ARRAY['review','feedback'], 'pro', true, 1),

('review','Consistency Checker','consistency-checker',
 'Catch contradictions between your CV, statement and essays.',
 'Panels notice when your dates and stories do not line up.',
 'Paste all documents together, clearly labelled.',
 'Act as a meticulous application auditor. Here are my documents:

[DOCUMENTS]

Cross-check them for: conflicting dates, inconsistent job or role titles, the same story told with different details, claims in one document unsupported by another, and tone shifts that suggest different authors. List every issue you find with the exact conflicting text quoted. Do not comment on quality — only consistency.',
 '[{"key":"DOCUMENTS","label":"All documents (labelled)","type":"textarea","required":true}]',
 'CV + personal statement + two essays',
 'A list of four inconsistencies with the conflicting lines quoted side by side.',
 'Run this last, after every document is final.',
 NULL,
 'intermediate', ARRAY['review','proofing'], 'pro', false, 2),

-- INTERVIEWS
('interviews','Interview Question Generator','interview-question-generator',
 'Generate the questions this specific panel is likely to ask you.',
 'Generic interview prep prepares you for a generic interview.',
 'Paste your submitted application so questions target what you actually wrote.',
 'Act as a scholarship interview panel preparing to interview me for [SCHOLARSHIP_NAME]. This is what I submitted:

[APPLICATION_SUMMARY]

Generate 15 questions you would genuinely ask, grouped into: motivation, academic fit, the specific claims in my application, my career plan, and challenge questions designed to test whether my story holds up. For each question, add one line on what you are really assessing. Mark the three questions I am least likely to have prepared for.',
 '[{"key":"SCHOLARSHIP_NAME","label":"Scholarship","type":"text","required":true},{"key":"APPLICATION_SUMMARY","label":"Your submitted application","type":"textarea","required":true}]',
 'A submitted Chevening application',
 '15 targeted questions grouped by theme, with the three riskiest flagged.',
 'Record yourself answering the three flagged questions out loud.',
 NULL,
 'intermediate', ARRAY['interview','preparation'], 'free', true, 1),

('interviews','Answer Structure Drill','answer-structure-drill',
 'Turn a rambling answer into a structured 90-second response.',
 'Interviews reward structure far more than eloquence.',
 'Speak your answer, transcribe it roughly, then paste it in.',
 'Act as an interview coach. Here is the question and my rough spoken answer:

Question: [QUESTION]
My answer: [MY_ANSWER]

Restructure it into a 90-second spoken answer using situation, action, result, reflection. Keep my own words and examples wherever possible. Mark where I should pause. Then tell me the two things I said that weakened the answer and the one detail I should have led with. Give me the final version as speaking notes, not as an essay.',
 '[{"key":"QUESTION","label":"Interview question","type":"textarea","required":true},{"key":"MY_ANSWER","label":"Your rough answer","type":"textarea","required":true}]',
 'A rambling two-minute answer about a group project',
 'A 90-second structured version in speaking-note form, plus two weakening habits named.',
 'Never memorise the output word for word. Learn the shape, keep your own words.',
 'Reciting a scripted answer is obvious to panels. Use this for structure only.',
 'advanced', ARRAY['interview','delivery'], 'pro', false, 2),

-- SUBMISSION
('submission','Final Submission Checklist','final-submission-checklist',
 'Generate a submission-day checklist tailored to your scheme.',
 'Nothing is worse than a strong application rejected on a technicality.',
 'Paste the scheme''s submission instructions.',
 'Act as an application administrator. Here are the submission requirements for [SCHOLARSHIP_NAME]:

[REQUIREMENTS]

I am submitting on [SUBMIT_DATE]. Build a final checklist covering documents, formats, file names, word limits, referee status, portal steps and confirmation. Order it so anything involving other people comes first. Flag every item that cannot be fixed after submission. Add the three most common technical reasons applications get disqualified for schemes like this.',
 '[{"key":"SCHOLARSHIP_NAME","label":"Scholarship","type":"text","required":true},{"key":"REQUIREMENTS","label":"Submission requirements","type":"textarea","required":true},{"key":"SUBMIT_DATE","label":"Planned submission date","type":"text","required":true}]',
 'Portal instructions with a PDF-only rule and two referee slots',
 'An ordered checklist with the referee items first and three irreversible steps flagged.',
 'Submit 48 hours early. Portals crash on deadline day, every year.',
 NULL,
 'beginner', ARRAY['submission','checklist'], 'free', false, 1),

('submission','Professional Follow-Up Note','professional-follow-up-note',
 'Write a short, appropriate follow-up or thank-you message.',
 'Follow up without being annoying.',
 'Pick the situation and give the relevant details.',
 'Act as a professional communication coach. Write a short message for this situation: [SITUATION].

Recipient: [RECIPIENT]
Scholarship: [SCHOLARSHIP_NAME]
Relevant context: [CONTEXT]
Tone: [TONE]

Keep it under 150 words, warm but not familiar, and with a clear purpose. Do not chase for a decision if the scheme has published a decision date. Give me two versions: one slightly more formal, one slightly warmer.',
 '[{"key":"SITUATION","label":"Situation","type":"select","options":["Thanking a referee","Thanking the panel after interview","Asking about a delayed decision","Accepting an award","Responding to a rejection"],"required":true},{"key":"RECIPIENT","label":"Recipient","type":"text","required":true},{"key":"SCHOLARSHIP_NAME","label":"Scholarship","type":"text","required":true},{"key":"CONTEXT","label":"Relevant context","type":"textarea","required":false},{"key":"TONE","label":"Tone","type":"select","options":["Formal","Warm","Neutral"],"required":true}]',
 'Thanking the panel after an interview',
 'Two short thank-you messages, one formal and one warmer.',
 'Send thank-you notes within 24 hours of an interview.',
 NULL,
 'beginner', ARRAY['submission','communication'], 'pro', false, 2)
) AS v(cat_slug, title, slug, descr, purpose, instructions, body, vars, ex_in, ex_out, tip, warn, diff, tags, acc, feat, ord)
  ON c.slug = v.cat_slug
WHERE t.slug = 'scholarship-ai-toolkit';

-- STUDENT / DEVELOPER / JOB SEEKER PROMPTS
INSERT INTO public.prompts (toolkit_id, category_id, title, slug, description, purpose, instructions, body, variables, pro_tip, difficulty, tags, access_level, display_order)
SELECT t.id, c.id, v.title, v.slug, v.descr, v.purpose, v.instructions, v.body, v.vars::jsonb, v.tip, v.diff::public.difficulty_level, v.tags, v.acc::public.access_level, v.ord
FROM public.toolkits t
JOIN public.toolkit_categories c ON c.toolkit_id = t.id
JOIN (VALUES
('student-ai-toolkit','learning','Explain It Three Ways','explain-it-three-ways',
 'Understand a hard concept through three different explanations.',
 'If one explanation does not land, another will.',
 'Name the concept and your current level honestly.',
 'Explain [CONCEPT] to me three times. First as if I am completely new to [FIELD]. Second at [LEVEL] level with the proper terminology. Third using a concrete analogy from everyday life. Then give me three questions that would prove whether I actually understand it, and tell me the single most common misconception about it.',
 '[{"key":"CONCEPT","label":"Concept","type":"text","required":true},{"key":"FIELD","label":"Field","type":"text","required":true},{"key":"LEVEL","label":"Your level","type":"select","options":["Secondary school","Undergraduate","Postgraduate"],"required":true}]',
 'Answer the three check questions without looking back before you move on.',
 'beginner', ARRAY['learning','study'], 'free', 1),
('student-ai-toolkit','assignments','Assignment Breakdown Planner','assignment-breakdown-planner',
 'Turn an assignment brief into a dated, step-by-step plan.',
 'Beat the blank page by starting with a plan, not a paragraph.',
 'Paste the brief exactly as your lecturer wrote it.',
 'Act as an academic planner. Here is my assignment brief:

[BRIEF]

It is due on [DUE_DATE] and worth [WEIGHT] of my grade. Today is [TODAY]. Tell me what the brief is actually asking for, extract the marking criteria, and build a dated work plan from today to the deadline with reading, outlining, drafting, revision and proofreading stages. Flag the requirements students most often miss in briefs like this.',
 '[{"key":"BRIEF","label":"Assignment brief","type":"textarea","required":true},{"key":"DUE_DATE","label":"Due date","type":"text","required":true},{"key":"WEIGHT","label":"Weight of grade","type":"text","placeholder":"30%","required":false},{"key":"TODAY","label":"Today''s date","type":"text","required":true}]',
 'Paste the marking rubric too if you have one — it changes the plan completely.',
 'beginner', ARRAY['assignments','planning'], 'pro', 1),
('student-ai-toolkit','research','Source Synthesis Helper','source-synthesis-helper',
 'Pull several readings into one coherent argument.',
 'Move from summarising sources to actually synthesising them.',
 'Summarise each source yourself first — do not paste full papers.',
 'Act as a research supervisor. Here are my notes on [NUMBER_OF_SOURCES] sources about [TOPIC]:

[SOURCE_NOTES]

Identify where they agree, where they conflict, and what none of them address. Then propose two possible argumentative positions I could take, with the strongest evidence for each. Work only from my notes. Do not add citations, sources or claims that I have not given you.',
 '[{"key":"TOPIC","label":"Topic","type":"text","required":true},{"key":"NUMBER_OF_SOURCES","label":"Number of sources","type":"number","required":false},{"key":"SOURCE_NOTES","label":"Your notes on each source","type":"textarea","required":true}]',
 'Never let AI supply citations. Every reference must come from a source you have read.',
 'intermediate', ARRAY['research','writing'], 'pro', 1),
('student-ai-toolkit','revision','Active Recall Question Bank','active-recall-question-bank',
 'Generate exam-style questions from your own notes.',
 'Re-reading notes does not work. Testing yourself does.',
 'Paste your notes for one topic at a time.',
 'Act as an examiner for [SUBJECT] at [LEVEL] level. From these notes:

[NOTES]

Generate 15 questions: five recall, five application, five analysis. Do not include the answers yet — list them separately at the end so I can test myself first. Then tell me which parts of my notes are too thin to answer an exam question from.',
 '[{"key":"SUBJECT","label":"Subject","type":"text","required":true},{"key":"LEVEL","label":"Level","type":"text","required":true},{"key":"NOTES","label":"Your notes","type":"textarea","required":true}]',
 'Do the questions cold, then mark yourself. The gaps are the whole point.',
 'beginner', ARRAY['revision','exams'], 'free', 1),

('developer-ai-toolkit','planning','Feature Scoping Brief','feature-scoping-brief',
 'Turn a vague feature idea into a buildable specification.',
 'Most rework comes from building before scoping.',
 'Describe the feature the way a stakeholder described it to you.',
 'Act as a senior engineer. I need to build: [FEATURE].

Stack: [STACK]
Existing constraints: [CONSTRAINTS]
Users affected: [USERS]

Produce a scoping brief covering: the user problem, acceptance criteria, data model changes, API surface, edge cases, failure states, security considerations, and what is explicitly out of scope. End with the three questions I should get answered before writing any code.',
 '[{"key":"FEATURE","label":"Feature","type":"textarea","required":true},{"key":"STACK","label":"Tech stack","type":"text","required":true},{"key":"CONSTRAINTS","label":"Existing constraints","type":"textarea","required":false},{"key":"USERS","label":"Users affected","type":"text","required":false}]',
 'The "out of scope" section is the most valuable part. Keep it.',
 'intermediate', ARRAY['planning','architecture'], 'free', 1),
('developer-ai-toolkit','debugging','Root Cause Interrogator','root-cause-interrogator',
 'Work backwards from a bug to its actual cause.',
 'Stop patching symptoms.',
 'Include the exact error text, not a paraphrase.',
 'Act as a debugging partner. Here is what is happening:

Expected behaviour: [EXPECTED]
Actual behaviour: [ACTUAL]
Exact error output: [ERROR]
Relevant code: [CODE]
What I have already tried: [TRIED]

Do not suggest a fix yet. First, list the possible causes ranked by likelihood, with the reasoning for each. Then give me the single cheapest diagnostic test that would eliminate the most possibilities. Only after that, propose a fix for the most likely cause.',
 '[{"key":"EXPECTED","label":"Expected behaviour","type":"textarea","required":true},{"key":"ACTUAL","label":"Actual behaviour","type":"textarea","required":true},{"key":"ERROR","label":"Exact error output","type":"textarea","required":false},{"key":"CODE","label":"Relevant code","type":"textarea","required":true},{"key":"TRIED","label":"What you have already tried","type":"textarea","required":false}]',
 'Filling in "what I have already tried" stops the model repeating your dead ends.',
 'intermediate', ARRAY['debugging'], 'free', 1),
('developer-ai-toolkit','review','Self Code Review','self-code-review',
 'Review your own code the way a strict reviewer would.',
 'Catch it yourself before the pull request does.',
 'Paste one file or one function at a time.',
 'Act as a strict senior reviewer. Review this code:

[CODE]

Language/framework: [STACK]
What it is supposed to do: [INTENT]

Comment on correctness, edge cases, error handling, security, readability and naming. Rank every issue as blocking, should-fix or nitpick. Do not rewrite the whole thing — show minimal diffs for the blocking issues only.',
 '[{"key":"CODE","label":"Code","type":"textarea","required":true},{"key":"STACK","label":"Language / framework","type":"text","required":true},{"key":"INTENT","label":"What it should do","type":"textarea","required":true}]',
 'Ask for blocking issues only when you are short on time.',
 'advanced', ARRAY['code review','quality'], 'pro', 1),
('developer-ai-toolkit','documentation','README That People Read','readme-that-people-read',
 'Generate clear project documentation from your actual code.',
 'Good docs are the cheapest way to make a project usable.',
 'Include your package/dependency file if you can.',
 'Write a README for this project.

Project name: [PROJECT_NAME]
What it does: [PURPOSE]
Stack: [STACK]
How to run it: [RUN_STEPS]
Key files: [KEY_FILES]

Include: one-line description, features, prerequisites, installation, configuration and environment variables, usage examples, project structure, and troubleshooting. Write for a developer who has never seen the codebase. Do not invent commands, scripts or env vars that I have not given you.',
 '[{"key":"PROJECT_NAME","label":"Project name","type":"text","required":true},{"key":"PURPOSE","label":"What it does","type":"textarea","required":true},{"key":"STACK","label":"Stack","type":"text","required":true},{"key":"RUN_STEPS","label":"How to run it","type":"textarea","required":true},{"key":"KEY_FILES","label":"Key files","type":"textarea","required":false}]',
 'Add a troubleshooting section for the three errors you personally hit most.',
 'beginner', ARRAY['documentation'], 'pro', 1),

('job-seeker-ai-toolkit','cv','Role-Tailored CV Rewrite','role-tailored-cv-rewrite',
 'Rewrite your CV against a specific job description.',
 'One generic CV sent 50 times beats nothing — but barely.',
 'Paste the job description in full.',
 'Act as a recruiter for this role:

[JOB_DESCRIPTION]

Here is my CV:

[CV]

Identify the role''s five most important requirements. For each, tell me what in my CV already evidences it and how strongly. Then rewrite my CV summary and the most relevant bullets to foreground that evidence, using only facts already in my CV. Finish with the gaps I cannot close and how to address them honestly in a cover letter.',
 '[{"key":"JOB_DESCRIPTION","label":"Job description","type":"textarea","required":true},{"key":"CV","label":"Your CV","type":"textarea","required":true}]',
 'Mirror the job description''s own terminology where it is honestly accurate.',
 'intermediate', ARRAY['cv','applications'], 'free', 1),
('job-seeker-ai-toolkit','cover-letters','Human Cover Letter','human-cover-letter',
 'Write a cover letter that does not sound machine-generated.',
 'Say something only you could say.',
 'The "specific reason" field is what makes this work.',
 'Write a cover letter of no more than [WORD_LIMIT] words for [ROLE] at [COMPANY].

Why I actually want this role: [REASON]
My two most relevant achievements: [ACHIEVEMENTS]
Something specific I know about this company: [COMPANY_RESEARCH]
My biggest gap against the requirements: [GAP]

Write in plain, direct language. No "I am writing to express my interest". Open with something specific rather than a formula. Address the gap honestly in one sentence rather than hiding it. Use only what I have given you.',
 '[{"key":"ROLE","label":"Role","type":"text","required":true},{"key":"COMPANY","label":"Company","type":"text","required":true},{"key":"WORD_LIMIT","label":"Word limit","type":"number","placeholder":"300","required":true},{"key":"REASON","label":"Why you want this role","type":"textarea","required":true},{"key":"ACHIEVEMENTS","label":"Two relevant achievements","type":"textarea","required":true},{"key":"COMPANY_RESEARCH","label":"Something specific about the company","type":"textarea","required":true},{"key":"GAP","label":"Your biggest gap","type":"textarea","required":false}]',
 'Naming the gap yourself is disarming. Hiding it never works.',
 'intermediate', ARRAY['cover letter'], 'pro', 1),
('job-seeker-ai-toolkit','outreach','Cold Outreach Message','cold-outreach-message',
 'Write a short outreach message that gets a reply.',
 'Referrals beat applications. Outreach creates referrals.',
 'Keep the ask small and specific.',
 'Write a short outreach message to [RECIPIENT], who works as [THEIR_ROLE] at [COMPANY]. I am interested in [TARGET_ROLE].

How I found them: [CONNECTION]
Something specific about their work or the company: [SPECIFIC]
My relevant background in one line: [BACKGROUND]
What I am asking for: [ASK]

Keep it under 120 words, respectful of their time, with one clear and easy ask. No flattery, no life story. Give me a version for LinkedIn and a version for email.',
 '[{"key":"RECIPIENT","label":"Recipient","type":"text","required":true},{"key":"THEIR_ROLE","label":"Their role","type":"text","required":true},{"key":"COMPANY","label":"Company","type":"text","required":true},{"key":"TARGET_ROLE","label":"Role you want","type":"text","required":true},{"key":"CONNECTION","label":"How you found them","type":"text","required":false},{"key":"SPECIFIC","label":"Something specific about their work","type":"textarea","required":true},{"key":"BACKGROUND","label":"Your background in one line","type":"text","required":true},{"key":"ASK","label":"What you are asking for","type":"text","placeholder":"15 minutes to hear about the team","required":true}]',
 'Ask for information, not a job. Reply rates are far higher.',
 'beginner', ARRAY['outreach','networking'], 'pro', 1),
('job-seeker-ai-toolkit','interviews','STAR Answer Builder','star-answer-builder',
 'Build a structured behavioural interview answer from a real experience.',
 'Behavioural questions are pattern-matched. Give them the pattern.',
 'Use a real experience — you will be probed on it.',
 'Act as an interview coach. Build a STAR answer for the question: "[QUESTION]"

Situation: [SITUATION]
Task: [TASK]
Action I took: [ACTION]
Result: [RESULT]

Write it as spoken notes for a 90-second answer, not an essay. Keep my own words. Then tell me the two follow-up questions an interviewer would ask next, and what a weak version of this answer would sound like so I can avoid it.',
 '[{"key":"QUESTION","label":"Interview question","type":"textarea","required":true},{"key":"SITUATION","label":"Situation","type":"textarea","required":true},{"key":"TASK","label":"Task","type":"textarea","required":true},{"key":"ACTION","label":"Action you took","type":"textarea","required":true},{"key":"RESULT","label":"Result","type":"textarea","required":true}]',
 'Build five of these covering conflict, failure, leadership, pressure and initiative. They cover most interviews.',
 'intermediate', ARRAY['interview'], 'free', 1)
) AS v(tk_slug, cat_slug, title, slug, descr, purpose, instructions, body, vars, tip, diff, tags, acc, ord)
  ON c.slug = v.cat_slug AND t.slug = v.tk_slug;

-- FAQS
INSERT INTO public.faqs (question, answer, display_order) VALUES
('What exactly am I paying for?','Access to structured prompt toolkits — not a list of prompt text. Each prompt comes with its own workspace where you fill in your real details and the platform builds the finished prompt for you, plus examples, pro tips and warnings.',1),
('Does this write my application for me?','No, and it should not. These prompts help you structure and sharpen work that is genuinely yours. Every scholarship prompt is written to refuse fabricated achievements and to push you to verify requirements from official sources.',2),
('Do I need an AI subscription as well?','You can copy any generated prompt into whichever AI assistant you already use. Nothing else is required.',3),
('Which payment methods do you support?','Card, bank transfer and USSD through Nigerian payment providers. Every payment is verified on our servers before your subscription is activated.',4),
('Can I cancel?','Yes. You keep access until the end of the period you have already paid for, and your history is never deleted.',5),
('How often is new content added?','New toolkits and prompts are added regularly, and every Pro plan includes everything published while your subscription is active.',6);

-- SITE SETTINGS
INSERT INTO public.site_settings (key, value) VALUES
('general','{"site_name":"Meridian","tagline":"Prompt reference library","contact_email":"hello@meridian.app","footer_text":"AI should assist your work, not replace your authentic experience.","brand_color":"#2e5f4c","accent_color":"#c2833a"}'::jsonb),
('seo','{"default_title":"Meridian — AI Prompts Built for Real Problems","default_description":"Specialized AI prompt toolkits for scholarships, study, job hunting and development."}'::jsonb),
('commerce','{"currency":"NGN","currency_symbol":"₦","provider":"paystack"}'::jsonb),
('social','{"twitter":"","linkedin":"","instagram":""}'::jsonb);
WITH tk AS (
  SELECT t.id AS toolkit_id, c.id AS category_id, c.slug AS category_slug
  FROM toolkits t JOIN toolkit_categories c ON c.toolkit_id = t.id
  WHERE t.slug IN ('student-ai-toolkit','developer-ai-toolkit','job-seeker-ai-toolkit')
)
INSERT INTO prompts (toolkit_id, category_id, title, slug, description, purpose, instructions, body, variables, pro_tip, warning, difficulty, tags, access_level, display_order, status)
SELECT tk.toolkit_id, tk.category_id, v.title, v.slug, v.description, v.purpose, v.instructions, v.body, v.variables::jsonb, v.pro_tip, v.warning, v.difficulty::difficulty_level, v.tags::text[], 'free'::access_level, v.display_order, 'published'::content_status
FROM (VALUES
  ('learning','study-notes-condenser','Study Notes Condenser','Turn long lecture notes or textbook sections into tight, exam-ready summaries.','Help students compress dense material without losing the points that matter.','Paste real notes you took or text you are allowed to copy. Review the summary against the original before relying on it.','You are a study coach. Condense the notes below into a one-page summary for a {{level}} student studying {{subject}}. Keep definitions exact, flag anything ambiguous, and end with 5 quick self-test questions. Notes: {{notes}}','[{"name":"level","label":"Your level","type":"text","required":true,"placeholder":"200-level engineering"},{"name":"subject","label":"Subject","type":"text","required":true},{"name":"notes","label":"Your notes","type":"textarea","required":true}]','Do this the same day as the lecture — the questions double as a retrieval test.','Never paste someone else’s copyrighted textbook wholesale; use your own notes or short excerpts.','beginner',ARRAY['summary','notes','revision']::text[],1),
  ('learning','analogy-builder','Analogy Builder','Get three real-life analogies that make a hard concept stick.','Make abstract concepts concrete for faster understanding.','Give the concept and your background so the analogies fit your world.','Explain {{concept}} to a {{background}} student using three different analogies from everyday life (e.g. football, cooking, market trading). After each analogy, state exactly where the analogy breaks down.','[{"name":"concept","label":"Concept","type":"text","required":true},{"name":"background","label":"Your background","type":"text","required":true}]','The "where it breaks down" part is where deep understanding happens.',NULL,'beginner',ARRAY['learning','analogies']::text[],2),
  ('assignments','essay-outline-builder','Essay Outline Builder','Produce a structured outline with thesis, arguments and evidence slots.','Give students a strong skeleton they write themselves.','Fill in the argument and evidence yourself — the outline is scaffolding, not the essay.','Create a detailed outline for a {{word_count}}-word essay on {{topic}} for a {{course}} course. Include a thesis statement, 3-4 argument sections with bullet points for the evidence I should find, counter-arguments to address, and a conclusion approach.','[{"name":"topic","label":"Essay topic","type":"textarea","required":true},{"name":"course","label":"Course","type":"text","required":true},{"name":"word_count","label":"Word count","type":"text","required":true}]','Swap any section that does not match your actual argument.','Submitting AI-written essays as your own work violates academic integrity rules. Use this to plan, then write it yourself.','beginner',ARRAY['essay','planning']::text[],1),
  ('assignments','feedback-interpreter','Feedback Interpreter','Decode vague lecturer feedback into a concrete improvement plan.','Turn confusing marking comments into actionable next steps.','Paste the feedback verbatim along with what you submitted (or a summary of it).','My lecturer gave this feedback on my {{assignment_type}}: {{feedback}}. Context about what I submitted: {{context}}. Explain what each comment most likely means, rank the issues by impact on my grade, and give me a numbered revision checklist.','[{"name":"assignment_type","label":"Assignment type","type":"text","required":true},{"name":"feedback","label":"Feedback","type":"textarea","required":true},{"name":"context","label":"What you submitted","type":"textarea","required":true}]','If anything stays unclear, take the checklist to office hours.',NULL,'beginner',ARRAY['feedback','improvement']::text[],2),
  ('research','literature-review-mapper','Literature Review Mapper','Organise sources you have read into themes, agreements and gaps.','Structure a literature review from the student’s real reading.','Only include sources you have actually read and can cite. Verify every citation against the original.','I am writing a literature review on {{topic}}. Here are the sources I have read with my notes on each: {{sources}}. Group them into themes, show where authors agree and disagree, identify gaps my review can highlight, and propose a structure.','[{"name":"topic","label":"Research topic","type":"textarea","required":true},{"name":"sources","label":"Sources + your notes","type":"textarea","required":true}]','A gap table (theme vs. sources) makes supervisor meetings much easier.','Never invent citations or let AI add sources you have not read — fabricated references end academic careers.','intermediate',ARRAY['research','literature-review']::text[],1),
  ('research','research-question-refiner','Research Question Refiner','Sharpen a vague topic into a focused, answerable research question.','Move from broad interest to a scoped question with variables.','Bring your honest constraints: time, data access and level.','My broad topic is {{topic}}. My constraints: {{constraints}}. Propose 5 focused research questions, each with: the variables involved, why it is answerable within my constraints, and one likely method. Then recommend the strongest and explain why.','[{"name":"topic","label":"Broad topic","type":"textarea","required":true},{"name":"constraints","label":"Your constraints","type":"textarea","required":true,"placeholder":"3 months, survey only, undergraduate"}]','A good question fits in one sentence and names its variables.',NULL,'intermediate',ARRAY['research','methods']::text[],2),
  ('revision','past-question-strategist','Past Question Strategist','Analyse past exam questions to find patterns and build a revision plan.','Revise what actually gets examined.','Paste real past questions from your course. Do not guess at exam content.','Here are past exam questions for {{course}}: {{questions}}. I have {{weeks}} weeks until the exam. Identify the recurring topics and question formats, estimate how marks are distributed, and build a week-by-week revision plan prioritised by likely marks.','[{"name":"course","label":"Course","type":"text","required":true},{"name":"questions","label":"Past questions","type":"textarea","required":true},{"name":"weeks","label":"Weeks until exam","type":"text","required":true}]','Practise answers under timed conditions once the plan is done.',NULL,'beginner',ARRAY['exams','planning']::text[],1),
  ('revision','mnemonic-maker','Mnemonic Maker','Create memorable mnemonics for lists, processes and definitions.','Make rote material stick before exams.','Give the exact list or steps you must remember.','Create mnemonics to help me remember the following for my {{subject}} exam: {{material}}. Give at least two options (an acronym/acrostic and a short story or image), keep them clean and easy to recall, and show how each maps back to the original items.','[{"name":"subject","label":"Subject","type":"text","required":true},{"name":"material","label":"Material to memorise","type":"textarea","required":true}]','Test yourself the next day — mnemonics fade without recall.',NULL,'beginner',ARRAY['memory','exams']::text[],2),
  ('planning','architecture-decision-record','Architecture Decision Record Writer','Turn a design debate into a clear, structured ADR.','Capture why a technical decision was made.','Describe the real options on the table, including the boring ones.','Write an Architecture Decision Record for this decision: {{decision}}. Context: {{context}}. Options considered: {{options}}. Use the standard ADR format: status, context, decision drivers, options with pros/cons, the decision, and consequences (including negative ones).','[{"name":"decision","label":"The decision","type":"textarea","required":true},{"name":"context","label":"Context","type":"textarea","required":true},{"name":"options","label":"Options considered","type":"textarea","required":true}]','ADRs age well only if the rejected options are written down honestly.',NULL,'intermediate',ARRAY['architecture','decisions']::text[],1),
  ('planning','user-story-refiner','User Story Refiner','Convert a feature idea into developer-ready user stories with acceptance criteria.','Bridge product ideas and implementation.','State the user and the outcome, not the solution.','Turn this feature idea into user stories: {{feature}}. For each story give: the story (as a / I want / so that), acceptance criteria in Given/When/Then format, edge cases, and a rough size estimate (S/M/L) with reasoning. Target users: {{users}}.','[{"name":"feature","label":"Feature idea","type":"textarea","required":true},{"name":"users","label":"Target users","type":"text","required":true}]','If a story has no edge cases, it has not been thought through.',NULL,'beginner',ARRAY['planning','agile']::text[],2),
  ('debugging','error-message-decoder','Error Message Decoder','Explain cryptic errors and rank likely causes.','Cut debugging time on unfamiliar errors.','Paste the exact error and relevant code, not a paraphrase.','I am getting this error: {{error}}. Here is the relevant code: {{code}}. Stack/framework: {{stack}}. Explain what the error actually means, rank the 3 most likely causes for my specific code, and give a concrete fix or diagnostic step for each.','[{"name":"error","label":"Exact error message","type":"textarea","required":true},{"name":"code","label":"Relevant code","type":"textarea","required":true},{"name":"stack","label":"Stack/framework","type":"text","required":true}]','Try cause #1 before reading the rest — it is usually right.',NULL,'beginner',ARRAY['debugging','errors']::text[],1),
  ('debugging','rubber-duck-plus','Rubber Duck Plus','A structured walkthrough that finds the bug in your own reasoning.','Make you find the bug by explaining the code.','Answer its questions honestly instead of skipping ahead.','Act as a rubber duck debugger with structure. My code should {{expected}} but instead {{actual}}. Code: {{code}}. Do not fix it yet. Ask me one focused question at a time (max 5) that forces me to trace my assumptions, then summarise the most likely faulty assumption.','[{"name":"expected","label":"Expected behaviour","type":"text","required":true},{"name":"actual","label":"Actual behaviour","type":"text","required":true},{"name":"code","label":"Code","type":"textarea","required":true}]','The bug is almost always in the assumption you were most confident about.',NULL,'intermediate',ARRAY['debugging','reasoning']::text[],2),
  ('review','performance-review-pass','Performance Review Pass','Spot bottlenecks and wasteful patterns in a code snippet.','Catch performance issues before production does.','Paste the hot path, not the whole repository.','Review this {{language}} code for performance: {{code}}. Context: it runs {{frequency}}. Identify concrete bottlenecks (N+1 queries, repeated work, memory churn, blocking calls), rank them by impact, and show the fix for the top two.','[{"name":"language","label":"Language/framework","type":"text","required":true},{"name":"code","label":"Code","type":"textarea","required":true},{"name":"frequency","label":"How often it runs","type":"text","required":true,"placeholder":"on every page load / once a day"}]','Measure first if you can — intuition about bottlenecks is often wrong.',NULL,'advanced',ARRAY['performance','review']::text[],1),
  ('review','security-self-audit','Security Self-Audit','Check your code for the common vulnerability classes.','Catch obvious security holes early.','Run this before any public launch; it is a screen, not a penetration test.','Audit this {{language}} code for security issues: {{code}}. Check specifically for: injection (SQL/command/XSS), broken auth checks, exposed secrets, insecure deserialization, and missing input validation. For each finding give severity, exploit scenario, and fix.','[{"name":"language","label":"Language/framework","type":"text","required":true},{"name":"code","label":"Code","type":"textarea","required":true}]','Also check dependencies — most real breaches come through them.','This does not replace a professional security review for anything handling money or personal data.','advanced',ARRAY['security','review']::text[],2),
  ('documentation','api-doc-drafter','API Doc Drafter','Generate clean API documentation from endpoint details.','Keep docs in sync with reality.','Provide real request/response examples from your running API.','Write API documentation for this endpoint: {{endpoint}}. Behaviour: {{behaviour}}. Example request and response: {{example}}. Include: description, auth requirements, parameters table, request/response examples, error codes with meanings, and a curl example.','[{"name":"endpoint","label":"Endpoint","type":"text","required":true,"placeholder":"POST /api/orders"},{"name":"behaviour","label":"What it does","type":"textarea","required":true},{"name":"example","label":"Example request/response","type":"textarea","required":true}]','Generate docs from real responses, then they never lie.',NULL,'intermediate',ARRAY['documentation','api']::text[],1),
  ('documentation','onboarding-doc-writer','Onboarding Doc Writer','Create a getting-started guide for new developers joining the project.','Cut new-dev ramp-up time.','List the actual setup steps — ask the newest team member what tripped them up.','Write an onboarding guide for a new developer joining our project. Project overview: {{project}}. Setup steps: {{setup}}. Include: what the project does in 3 sentences, architecture sketch in words, setup walkthrough with common failure fixes, the first-task suggestion, and who to ask about what.','[{"name":"project","label":"Project overview","type":"textarea","required":true},{"name":"setup","label":"Setup steps","type":"textarea","required":true}]','Have the next new hire follow it cold and fix whatever confuses them.',NULL,'beginner',ARRAY['documentation','onboarding']::text[],2),
  ('cv','achievement-bullet-upgrade','Achievement Bullet Upgrader','Rewrite weak CV bullets into quantified achievement statements.','Turn duties into evidence of impact.','Use real numbers from your actual work. Never inflate figures.','Rewrite these CV bullet points for a {{role}} application: {{bullets}}. For each: lead with a strong verb, add or prompt me for the real metric (scale, %, money, time saved), and cut filler. Keep every claim truthful — ask me clarifying questions where a number is missing.','[{"name":"role","label":"Target role","type":"text","required":true},{"name":"bullets","label":"Current bullets","type":"textarea","required":true}]','If you cannot back a number in an interview, do not put it on the CV.','Never invent achievements or metrics — recruiters verify, and lies cost offers.','beginner',ARRAY['cv','achievements']::text[],1),
  ('cv','cv-gap-explainer','CV Gap & Weakness Explainer','Frame employment gaps or unconventional paths honestly and positively.','Address concerns before they become rejections.','Be truthful; the goal is framing, not disguise.','I am applying for {{role}}. My situation: {{situation}}. Suggest: how to address it in one honest sentence on the CV (or whether to leave it off), how to answer it in an interview in under 30 seconds, and which of my genuine strengths redirect the conversation.','[{"name":"role","label":"Target role","type":"text","required":true},{"name":"situation","label":"Your situation","type":"textarea","required":true,"placeholder":"2-year gap for family care / career switch from teaching"}]','Confidence comes from having rehearsed the honest answer.',NULL,'intermediate',ARRAY['cv','interviews']::text[],2),
  ('cover-letters','job-spec-matcher','Job Spec Matcher','Map your real experience onto a job description, line by line.','Write letters that answer the actual advert.','Paste the real job description and your real experience.','Here is a job description: {{job_spec}}. Here is my experience: {{experience}}. Create a two-column mapping: what they ask for vs. my matching evidence (with gaps marked honestly). Then give me the 3 strongest points to lead my cover letter with and one gap to address proactively.','[{"name":"job_spec","label":"Job description","type":"textarea","required":true},{"name":"experience","label":"Your experience","type":"textarea","required":true}]','Apply when you match ~70%; this shows you which 70% to sell.',NULL,'beginner',ARRAY['cover-letter','matching']::text[],1),
  ('cover-letters','opening-hook-writer','Opening Hook Writer','Craft three cover-letter openings that are specific, not generic.','Escape "I am writing to apply for...".','Specificity beats cleverness — mention the company’s real work.','Write 3 different opening paragraphs for a cover letter for {{role}} at {{company}}. About the company: {{company_context}}. My strongest relevant point: {{strength}}. Each opening should name something specific about the company and connect it to my evidence — no clichés, no flattery.','[{"name":"role","label":"Role","type":"text","required":true},{"name":"company","label":"Company","type":"text","required":true},{"name":"company_context","label":"What the company does / recent news","type":"textarea","required":true},{"name":"strength","label":"Your strongest point","type":"textarea","required":true}]','Verify any company fact you mention — a wrong fact ends the application.',NULL,'beginner',ARRAY['cover-letter','writing']::text[],2),
  ('outreach','referral-request-message','Referral Request Message','Ask a contact for a referral without awkwardness.','Get referred — the highest-converting application channel.','Only ask people who genuinely know your work.','Help me ask {{contact_description}} for a referral to {{role}} at {{company}}. Our history: {{relationship}}. Write a short message (under 120 words) that: reminds them how we know each other, states the specific role, makes it easy to say no, and offers to send my CV.','[{"name":"contact_description","label":"Who they are","type":"text","required":true,"placeholder":"former colleague, now a PM there"},{"name":"role","label":"Role","type":"text","required":true},{"name":"company","label":"Company","type":"text","required":true},{"name":"relationship","label":"Your history together","type":"textarea","required":true}]','Attach the CV in the same message — reduce their effort to zero.',NULL,'beginner',ARRAY['networking','referrals']::text[],1),
  ('outreach','linkedin-follow-up','LinkedIn Follow-Up Writer','Follow up after applying without sounding desperate.','Stay visible professionally.','One follow-up is polite; three is spam.','I applied for {{role}} at {{company}} {{time_ago}}. Write a LinkedIn message to {{recipient}} (under 80 words) that: references the specific role, adds one new reason I fit ({{new_evidence}}), asks one easy question, and stays warm and brief.','[{"name":"role","label":"Role","type":"text","required":true},{"name":"company","label":"Company","type":"text","required":true},{"name":"time_ago","label":"How long ago you applied","type":"text","required":true},{"name":"recipient","label":"Recipient","type":"text","required":true,"placeholder":"the hiring manager / a recruiter"},{"name":"new_evidence","label":"One new proof point","type":"text","required":true}]','Lead with something new, not "just checking in".',NULL,'beginner',ARRAY['networking','follow-up']::text[],2),
  ('interviews','mock-interview-coach','Mock Interview Coach','Run a realistic mock interview with feedback on each answer.','Practise aloud before it counts.','Answer in your own words first, then read the feedback.','Act as an interviewer for {{role}} at a {{company_type}} company. Ask me one question at a time, starting with a common opener and progressing to harder role-specific and behavioural questions. After each of my answers, score it /10 and give one concrete improvement. Begin with the first question. My background: {{background}}.','[{"name":"role","label":"Role","type":"text","required":true},{"name":"company_type","label":"Company type","type":"text","required":true,"placeholder":"bank / startup / NGO"},{"name":"background","label":"Your background","type":"textarea","required":true}]','Say your answers out loud — silent practice does not build the muscle.',NULL,'intermediate',ARRAY['interviews','practice']::text[],1),
  ('interviews','questions-to-ask-panel','Questions to Ask the Panel','Generate sharp questions that make you memorable at the end.','"Any questions for us?" is still part of the interview.','Pick two; asking all of them is worse than asking none.','I am interviewing for {{role}} at {{company}}. What I know about them: {{context}}. Generate 8 questions I could ask the panel, across: the role’s real challenges, team dynamics, success measures, and growth. Flag which two would be most impressive for this specific context and why.','[{"name":"role","label":"Role","type":"text","required":true},{"name":"company","label":"Company","type":"text","required":true},{"name":"context","label":"What you know about them","type":"textarea","required":true}]','Never ask something answered on the first page of their website.',NULL,'beginner',ARRAY['interviews','questions']::text[],2)
) AS v(category_slug, slug, title, description, purpose, instructions, body, variables, pro_tip, warning, difficulty, tags, display_order)
JOIN tk ON tk.category_slug = v.category_slug
ON CONFLICT DO NOTHING;
-- ADDITIONAL TOOLKITS
INSERT INTO public.toolkits (name, slug, short_description, description, audience, outcomes, features, icon, access_level, is_featured, display_order, seo_title, seo_description) VALUES
('Small Business AI Toolkit','small-business-ai-toolkit',
 'Prompts for marketing, customer support, operations, and business planning.',
 'A tactical prompt library for founders and small business owners. Generate marketing copy, draft customer support replies, write SOPs, and brainstorm growth strategies without hiring an agency.',
 'Small business owners, solo founders, and freelance entrepreneurs.',
 ARRAY['Write compelling marketing copy','Handle customer support efficiently','Document standard operating procedures','Brainstorm product ideas'],
 ARRAY['Marketing templates','Support scripts','Operations planners','Strategy generators'],
 'store','pro',false,5,
 'Small Business AI Toolkit — Marketing, Support, and Operations Prompts',
 'AI prompts for small businesses to handle marketing, customer support, and operations.'),

('Content Creator AI Toolkit','content-creator-ai-toolkit',
 'Prompts for scripting, content strategy, newsletters, and social media growth.',
 'Beat writer''s block and stay consistent. Prompts to generate video hooks, structure newsletters, plan content calendars, and repurpose long-form content for social media.',
 'YouTubers, newsletter writers, podcasters, and social media managers.',
 ARRAY['Generate engaging video hooks','Structure weekly newsletters','Plan a 30-day content calendar','Repurpose videos into threads'],
 ARRAY['Hook generators','Script templates','Content calendars','Repurposing workflows'],
 'pen-tool','pro',false,6,
 'Content Creator AI Toolkit — Scripting, Strategy, and Social Media Prompts',
 'AI prompts for content creators to plan content, write scripts, and grow their audience.'),

('Researcher AI Toolkit','researcher-ai-toolkit',
 'Prompts for literature reviews, hypothesis generation, and academic writing.',
 'Speed up the tedious parts of academic research. Prompts to summarize papers, format citations, draft literature reviews, and refine research questions.',
 'Academics, PhD candidates, and professional researchers.',
 ARRAY['Summarize dense academic papers','Structure literature reviews','Refine research questions','Draft grant proposals'],
 ARRAY['Paper summarizers','Citation helpers','Literature review structures','Grant writing templates'],
 'microscope','pro',false,7,
 'Researcher AI Toolkit — Literature Reviews and Academic Prompts',
 'AI prompts for academic researchers to summarize papers, draft literature reviews, and write proposals.'),

('Computer Engineering AI Toolkit','computer-engineering-ai-toolkit',
 'Prompts for hardware design, low-level programming, and systems architecture.',
 'Specialized prompts for computer engineering students and professionals. Help with HDL (Verilog/VHDL), C/C++ debugging, embedded systems, and microcontroller programming.',
 'Computer engineering students and embedded systems developers.',
 ARRAY['Debug embedded C code','Write Verilog/VHDL testbenches','Understand microcontroller datasheets','Design system architectures'],
 ARRAY['Hardware debugging workflows','Testbench generators','Datasheet explainers','System design planners'],
 'cpu','pro',false,8,
 'Computer Engineering AI Toolkit — Embedded Systems and Hardware Prompts',
 'AI prompts for computer engineers working with embedded systems, HDL, and low-level programming.'),

('Nigerian Student AI Toolkit','nigerian-student-ai-toolkit',
 'Prompts localized for Nigerian university exams, projects, and NYSC prep.',
 'Navigating the Nigerian university system is unique. Prompts to help with project defense, understanding local grading, writing IT/SIWES reports, and preparing for NYSC.',
 'Students in Nigerian universities (federal, state, and private).',
 ARRAY['Write SIWES/IT reports','Prepare for final year project defense','Plan for NYSC clearance and camp','Understand local academic formatting'],
 ARRAY['Project defense prep','SIWES report generators','NYSC planning guides','Exam revision strategies'],
 'graduation-cap','free',false,9,
 'Nigerian Student AI Toolkit — Project Defense, SIWES, and NYSC Prompts',
 'AI prompts tailored for Nigerian university students focusing on projects, exams, and NYSC.'),

('Interview Prep AI Toolkit','interview-prep-ai-toolkit',
 'Prompts for mock interviews, behavioral questions, and salary negotiation.',
 'Turn anxiety into confidence. Simulate tough interviews, practice the STAR method for behavioral questions, and get scripts for negotiating your salary.',
 'Professionals preparing for job interviews across any industry.',
 ARRAY['Practice behavioral questions (STAR method)','Simulate technical or panel interviews','Prepare smart questions for the interviewer','Script your salary negotiation'],
 ARRAY['Mock interview simulators','STAR method builders','Negotiation scripts','Post-interview follow-ups'],
 'users','pro',false,10,
 'Interview Prep AI Toolkit — Mock Interviews and Negotiation Prompts',
 'AI prompts to help you master job interviews, practice behavioral questions, and negotiate salary.');
