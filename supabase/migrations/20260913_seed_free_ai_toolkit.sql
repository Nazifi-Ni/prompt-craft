-- Migration: Create Free AI Toolkit and lock all others
-- Instructions: Run this script in your LIVE Lovable Cloud Supabase SQL Editor.

-- 1. Ensure all existing toolkits are set to 'pro'
UPDATE public.toolkits 
SET access_level = 'pro'
WHERE slug != 'free-ai-toolkit';

-- 2. Insert the Free AI Toolkit
INSERT INTO public.toolkits (
    id, name, slug, short_description, description, icon, audience, display_order, status, access_level, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'Free AI Toolkit', 
    'free-ai-toolkit', 
    'A collection of free AI prompts available to everyone.', 
    'A curated collection of free prompts and tools to help you get started with Meridian. Explore our capabilities without any cost.', 
    'Gift', 
    'Everyone', 
    0, 
    'published', 
    'free', 
    NOW(), 
    NOW()
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    short_description = EXCLUDED.short_description,
    description = EXCLUDED.description,
    access_level = 'free';

-- 3. Create a category for the Free AI Toolkit
INSERT INTO public.toolkit_categories (
    id, toolkit_id, name, slug, description, display_order
) VALUES (
    '22222222-2222-2222-2222-222222222222', 
    (SELECT id FROM public.toolkits WHERE slug = 'free-ai-toolkit'), 
    'Essentials', 
    'essentials', 
    'Essential free prompts to get you started.', 
    1
) ON CONFLICT (toolkit_id, slug) DO NOTHING;

-- 4. Move some free prompts into the Free AI Toolkit
-- We will move a few existing prompts to this new toolkit so it's not empty.
-- Using some of the ones that were previously considered free.
UPDATE public.prompts
SET 
    toolkit_id = (SELECT id FROM public.toolkits WHERE slug = 'free-ai-toolkit'),
    category_id = (SELECT id FROM public.toolkit_categories WHERE slug = 'essentials' AND toolkit_id = (SELECT id FROM public.toolkits WHERE slug = 'free-ai-toolkit'))
WHERE slug IN (
    'profile-strength-audit',
    'feynman-concept-explainer',
    'job-search-sprint-planner'
);

-- Note: All prompts belonging to 'free-ai-toolkit' will automatically be accessible to free users based on our new frontend access logic.

