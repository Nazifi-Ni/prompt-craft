-- 1. Scholarship Toolkit should be FREE (so free users can open it)
UPDATE public.toolkits
SET access_level = 'free'
WHERE slug = 'scholarship-ai-toolkit';

-- 2. The other toolkits should be PRO (locked for free users)
UPDATE public.toolkits
SET access_level = 'pro'
WHERE slug IN ('student-ai-toolkit', 'developer-ai-toolkit', 'job-seeker-ai-toolkit');

-- 3. Reset all prompts to free by default, so we start with a clean slate
UPDATE public.prompts
SET access_level = 'free';

-- 4. Lock the "Scholarship Opportunity Finder" prompt specifically
UPDATE public.prompts
SET access_level = 'pro'
WHERE slug = 'scholarship-opportunity-finder' 
  AND toolkit_id = (SELECT id FROM public.toolkits WHERE slug = 'scholarship-ai-toolkit');

-- 5. Lock all prompts inside the specific categories you requested
UPDATE public.prompts
SET access_level = 'pro'
WHERE toolkit_id = (SELECT id FROM public.toolkits WHERE slug = 'scholarship-ai-toolkit')
  AND category_id IN (
      SELECT id FROM public.toolkit_categories 
      WHERE toolkit_id = (SELECT id FROM public.toolkits WHERE slug = 'scholarship-ai-toolkit')
        AND slug IN (
            'personal-statements',
            'cv',
            'references',
            'review',
            'interviews',
            'submission'
        )
  );
