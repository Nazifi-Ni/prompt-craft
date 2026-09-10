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