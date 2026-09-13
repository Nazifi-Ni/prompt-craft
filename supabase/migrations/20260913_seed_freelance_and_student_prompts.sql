-- 1. INSERT FREELANCE & DIGITAL INCOME AI TOOLKIT
INSERT INTO public.toolkits (name, slug, short_description, description, audience, outcomes, features, icon, access_level, is_featured, display_order, seo_title, seo_description) VALUES
('Freelance & Digital Income AI Toolkit', 'freelance-digital-income-toolkit',
 'Prompts to turn skills into digital products, land freelance clients, and scale income streams.',
 'A comprehensive prompt library for freelancers, consultants, and creators. Discover profitable niches, package your skills into high-ticket services or digital assets (templates, guides, courses), pitch clients effectively, and build sustainable revenue.',
 'Freelancers, consultants, side hustlers, and professionals looking to diversify their income.',
 ARRAY['Turn existing skills into digital products & templates','Land high-paying freelance clients with value-first pitches','Package and price services into tiered solutions','Build a disciplined 90-day side business roadmap'],
 ARRAY['Product brainstormers','Client outreach scripts','Proposal templates','Pricing & packaging frameworks'],
 'wallet', 'free', true, 11,
 'Freelance & Digital Income AI Toolkit — Digital Products, Freelancing & Side Hustle Prompts',
 'Actionable AI prompts to package your skills, win freelance clients, build digital products, and grow your income.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  audience = EXCLUDED.audience,
  outcomes = EXCLUDED.outcomes,
  features = EXCLUDED.features,
  access_level = 'free';

-- 2. INSERT CATEGORIES FOR FREELANCE TOOLKIT
INSERT INTO public.toolkit_categories (toolkit_id, name, slug, description, display_order)
SELECT t.id, v.name, v.slug, v.descr, v.ord
FROM public.toolkits t, (VALUES
 ('Digital Products & Packaging', 'products', 'Turn knowledge and skills into templates, guides, and scalable digital assets.', 1),
 ('Client Acquisition & Outreach', 'clients', 'Find, pitch, and close high-paying freelance clients directly.', 2),
 ('Pricing & Service Packaging', 'pricing', 'Move away from hourly rates to tiered, value-driven service packages.', 3),
 ('Side Hustle & Income Strategy', 'strategy', 'Build execution roadmaps and evaluate new income streams.', 4)
) AS v(name, slug, descr, ord)
WHERE t.slug = 'freelance-digital-income-toolkit'
ON CONFLICT (toolkit_id, slug) DO NOTHING;

-- 3. INSERT PROMPTS FOR FREELANCE TOOLKIT
WITH tk AS (
  SELECT t.id AS toolkit_id, c.id AS category_id, c.slug AS category_slug
  FROM public.toolkits t JOIN public.toolkit_categories c ON c.toolkit_id = t.id
  WHERE t.slug = 'freelance-digital-income-toolkit'
)
INSERT INTO public.prompts (toolkit_id, category_id, title, slug, description, purpose, instructions, body, variables, pro_tip, warning, difficulty, tags, access_level, display_order, status)
SELECT tk.toolkit_id, tk.category_id, v.title, v.slug, v.description, v.purpose, v.instructions, v.body, v.variables::jsonb, v.pro_tip, v.warning, v.difficulty::difficulty_level, v.tags::text[], v.access_level::access_level, v.display_order, 'published'::content_status
FROM (VALUES
  ('products', 'skill-to-product-generator', 'Skill-to-Digital Product Generator',
   'Convert your professional skills or hobbies into profitable digital products, guides, or templates.',
   'Stop trading time strictly for money. Package what you already know into scalable digital assets.',
   'Provide your skills and available weekly hours to brainstorm viable digital products with pricing.',
   'Act as a digital product strategist and monetization expert.

I have expertise and skills in: {{my_skills}}.
My background or industry is: {{background}}.
I can dedicate {{hours_per_week}} hours per week to building this.
My primary goal is: {{goal}}.

Suggest 5 realistic digital products I could create and sell:
1. Product format (e.g. Notion template, PDF checklist/guide, mini course, prompt pack, spreadsheet system)
2. Target customer and the specific painful problem it solves
3. Estimated time to build an MVP (Minimum Viable Product)
4. Recommended launch price in {{currency}}
5. Best platform to sell it on (e.g. Selar, Gumroad, Paystack, Etsy)
6. One free lead-magnet idea to attract initial buyers

Rank the 5 ideas from fastest-to-market to highest-long-term-revenue.',
   '[{"name":"my_skills","label":"Your skills / expertise","type":"textarea","required":true,"placeholder":"e.g. Graphic design in Figma, CV writing, Python scripts, Excel financial modeling"},{"name":"background","label":"Industry / current role","type":"text","required":true,"placeholder":"e.g. Tech recruitment, undergraduate student"},{"name":"hours_per_week","label":"Available hours/week","type":"text","required":true,"placeholder":"5-10 hours"},{"name":"goal","label":"Income goal","type":"text","required":true,"placeholder":"First ₦50,000 / $100 online"},{"name":"currency","label":"Preferred currency","type":"text","required":true,"placeholder":"NGN / USD"}]',
   'Pick the fastest idea first. Getting your first online dollar or naira provides immense momentum.',
   'Do not spend months building a product before validating that people actually want it.',
   'beginner', ARRAY['income','products','freelancing'], 'free', 1),

  ('strategy', 'side-hustle-launch-plan', '90-Day Side Hustle Sprint',
   'Build a realistic week-by-week execution roadmap to launch a side hustle without quitting your day job.',
   'Avoid shiny object syndrome. Follow a disciplined 90-day plan covering validation, building, and first sales.',
   'Input your available budget and hours to generate a week-by-week sprint.',
   'Act as an entrepreneurial advisor and execution coach.

I want to start a side business in: {{business_idea}}.
My available capital / budget is: {{budget}}.
I can invest {{hours_per_week}} hours per week.
My target is to make my first sale within {{target_days}} days.

Create a detailed 90-day week-by-week launch roadmap divided into 3 phases:
- Phase 1 (Days 1–30): Market validation, audience research, and offer design (how to prove people want this before spending money)
- Phase 2 (Days 31–60): Minimum viable build, pricing, and initial test outreach
- Phase 3 (Days 61–90): Launch, gathering testimonials, and securing first 3–5 paying customers

Include specific weekly deliverables, 3 common pitfalls that kill side hustles at each stage, and free tools I should use.',
   '[{"name":"business_idea","label":"Business or side hustle idea","type":"textarea","required":true,"placeholder":"e.g. Academic proofreading service for postgraduates"},{"name":"budget","label":"Available budget","type":"text","required":true,"placeholder":"₦20,000 or $50"},{"name":"hours_per_week","label":"Hours per week","type":"text","required":true,"placeholder":"10 hours"},{"name":"target_days","label":"Days to first sale","type":"text","required":true,"placeholder":"30 days"}]',
   'Spend 80% of your initial time talking to potential buyers, not tweaking logos or websites.',
   NULL,
   'beginner', ARRAY['strategy','business','roadmap'], 'free', 2),

  ('clients', 'freelance-proposal-pitch', 'High-Converting Freelance Proposal Writer',
   'Write a client proposal that highlights value and outcomes instead of generic buzzwords.',
   'Stand out in freelance proposals, bids, or direct messages to win contracts.',
   'Paste the client brief and your key proof points.',
   'Act as an elite freelance consultant with a 70%+ proposal win rate.

Client job description / request: {{job_brief}}
Client name / company (if known): {{client_name}}
My relevant experience and strongest proof point: {{proof_point}}
My proposed solution and timeframe: {{proposed_solution}}

Write a punchy, conversational proposal (under 180 words) that:
1. Opens with a hook addressing the client''s actual core problem (no "Dear Hiring Manager, I am writing to apply...")
2. Demonstrates immediate insight into how I will solve it with my proposed solution
3. Mentions my proof point concisely
4. Ends with a low-friction call to action (e.g. a 10-minute chat or sending a quick audit)
5. Formats key milestones as clean bullet points',
   '[{"name":"job_brief","label":"Client request / job post","type":"textarea","required":true},{"name":"client_name","label":"Client / company name","type":"text","required":false,"placeholder":"Leave blank if unknown"},{"name":"proof_point","label":"Your strongest proof point","type":"textarea","required":true,"placeholder":"e.g. Increased checkout conversions by 22% for an apparel brand"},{"name":"proposed_solution","label":"Your solution & turnaround","type":"textarea","required":true,"placeholder":"e.g. Redesigning the landing page in Figma within 5 days"}]',
   'Never start proposals with "I am a freelancer with X years experience". Always lead with the client''s problem.',
   NULL,
   'intermediate', ARRAY['freelance','proposals','sales'], 'pro', 1),

  ('pricing', 'value-pricing-packager', 'Value-Based Service Packager & Quoter',
   'Bundle your skills into 3 tiered packages (Starter, Growth, VIP) so clients stop haggling on hourly rates.',
   'Move from hourly billing to tiered value pricing.',
   'Specify your service and target client to generate tiered packaging.',
   'Act as a freelance pricing strategist.

Service I provide: {{service_type}}
Target client type: {{client_type}}
Typical outcome or value I create for them: {{outcome_value}}
My current baseline price/rate: {{current_rate}}

Design 3 distinct service packages for this offering:
- Tier 1: "Starter / Fast Fix" (low friction, essential deliverables)
- Tier 2: "Growth / Full Solution" (the recommended package that delivers end-to-end outcome)
- Tier 3: "VIP / Done-With-You Partnership" (premium turnaround, priority support, extra strategy)

For each tier, provide:
- Package name
- Exactly what is included vs excluded
- Recommended price multiplier compared to baseline
- The psychological trigger that makes Tier 2 the most attractive option',
   '[{"name":"service_type","label":"Service type","type":"text","required":true,"placeholder":"e.g. Brand identity design, SEO blog writing, Webflow development"},{"name":"client_type","label":"Target client type","type":"text","required":true,"placeholder":"e.g. Early-stage startups, local restaurants, e-commerce stores"},{"name":"outcome_value","label":"Outcome or value delivered","type":"textarea","required":true,"placeholder":"e.g. Helps them launch professional branding in 10 days to impress seed investors"},{"name":"current_rate","label":"Current baseline rate","type":"text","required":true,"placeholder":"e.g. ₦100,000 or $300 per project"}]',
   'Always anchor the VIP package high. It makes your middle package look like an obvious bargain.',
   NULL,
   'intermediate', ARRAY['pricing','strategy','freelance'], 'pro', 1)
) AS v(category_slug, slug, title, description, purpose, instructions, body, variables, pro_tip, warning, difficulty, tags, access_level, display_order)
JOIN tk ON tk.category_slug = v.category_slug
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  purpose = EXCLUDED.purpose,
  instructions = EXCLUDED.instructions,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  access_level = EXCLUDED.access_level;

-- 4. INSERT NEW FREE PROMPTS FOR STUDENT AI TOOLKIT
WITH tk AS (
  SELECT t.id AS toolkit_id, c.id AS category_id, c.slug AS category_slug
  FROM public.toolkits t JOIN public.toolkit_categories c ON c.toolkit_id = t.id
  WHERE t.slug = 'student-ai-toolkit'
)
INSERT INTO public.prompts (toolkit_id, category_id, title, slug, description, purpose, instructions, body, variables, pro_tip, warning, difficulty, tags, access_level, display_order, status)
SELECT tk.toolkit_id, tk.category_id, v.title, v.slug, v.description, v.purpose, v.instructions, v.body, v.variables::jsonb, v.pro_tip, v.warning, v.difficulty::difficulty_level, v.tags::text[], 'free'::access_level, v.display_order, 'published'::content_status
FROM (VALUES
  ('learning', 'feynman-concept-explainer', 'Feynman 5-Level Concept Explainer',
   'Break down any complex, dense academic concept into five intuitive levels of understanding.',
   'Master hard theories, formulas, or phenomena by viewing them from child-level analogies to advanced technical depth.',
   'Enter the topic, your discipline, and what you specifically find confusing.',
   'Act as an award-winning professor and master communicator utilizing the Feynman Technique.

Explain this concept: {{concept}}
My course / academic discipline: {{subject}}
The part I find most confusing or unintuitive: {{confusion_point}}

Break down {{concept}} in five distinct ways:
1. ELI5 (Explain Like I''m 5): Simple language, no jargon, using a relatable kitchen or playground analogy.
2. High School Level: Core principles, basic definitions, and why it matters in the real world.
3. Undergraduate / Exam Level: Precise academic terminology, governing equations or mechanisms, and how it is typically tested.
4. The Intuitive Mental Model: A vivid analogy or thought experiment that makes the abstract concrete.
5. Common Student Misconceptions: The 2 most frequent errors students make when answering questions about this concept.

Conclude with 3 quick self-test questions to verify my understanding.',
   '[{"name":"concept","label":"Concept / theory / topic","type":"text","required":true,"placeholder":"e.g. Fourier Transform, Supply-Side Economics, Photosystem II"},{"name":"subject","label":"Subject / course","type":"text","required":true,"placeholder":"e.g. Electrical Engineering, Macroeconomics, Biochemistry"},{"name":"confusion_point","label":"What confuses you most","type":"textarea","required":false,"placeholder":"e.g. Why we convert time domain to frequency domain"}]',
   'Try re-explaining the ELI5 version to a friend without looking at the notes to lock in retention.',
   NULL,
   'beginner', ARRAY['learning','feynman','study'], 3),

  ('revision', 'syllabus-exam-strategist', 'Syllabus Exam Strategist & Revision Roadmap',
   'Convert a course syllabus into a prioritized, high-yield revision schedule leading up to exam day.',
   'Stop studying randomly. Identify high-weightage topics and schedule active recall spaced practice.',
   'Paste syllabus modules and days remaining to get a custom study plan.',
   'Act as an elite academic coach and exam strategist.

Course: {{course_name}}
Days remaining until exam: {{days_until_exam}}
Hours I can study per day: {{daily_hours}}
Syllabus topics / modules: {{syllabus}}
Format of the exam: {{exam_format}}

Analyze this syllabus and create a strategic study masterplan:
1. High-Yield Priority Matrix: Categorize the syllabus into Tier 1 (Must-know, high-weightage), Tier 2 (Secondary importance), and Tier 3 (Quick review).
2. Day-by-Day Study Schedule: Allocate daily study blocks using the 80/20 rule, balancing concept review and active testing.
3. Active Recall Protocols: For each topic, suggest one active practice method (e.g. blurting, past paper drills, flashcards).
4. 48-Hour Pre-Exam Protocol: Exactly what to review and what to avoid in the final two days before the exam.',
   '[{"name":"course_name","label":"Course name","type":"text","required":true,"placeholder":"e.g. Organic Chemistry II"},{"name":"days_until_exam","label":"Days until exam","type":"text","required":true,"placeholder":"e.g. 14 days"},{"name":"daily_hours","label":"Study hours per day","type":"text","required":true,"placeholder":"e.g. 3 hours"},{"name":"syllabus","label":"Syllabus topics","type":"textarea","required":true,"placeholder":"List the chapters or modules"},{"name":"exam_format","label":"Exam format","type":"text","required":true,"placeholder":"e.g. Multiple choice & Essay"}]',
   'Stick strictly to the 48-hour protocol. Last-minute cramming on low-weightage topics creates test anxiety.',
   NULL,
   'beginner', ARRAY['exams','revision','planning'], 3),

  ('learning', 'socratic-chapter-coach', 'Interactive Socratic Chapter Coach',
   'Turn AI into an interactive 1-on-1 tutor that teaches step-by-step and quizzes your comprehension.',
   'Passive reading leads to rapid forgetting. Force active engagement with interactive questioning.',
   'Provide the chapter topic and follow the conversational guidance.',
   'Act as my personal 1-on-1 tutor using the Socratic method.

Topic / chapter to cover: {{chapter_topic}}
My current knowledge level: {{current_level}}
Key textbook notes or excerpt: {{chapter_notes}}

Rules of our session:
1. Do NOT dump the entire lesson at once.
2. Introduce ONE foundational concept at a time in 3-4 clear sentences with a real-world example.
3. End your response with a single question testing my understanding of that concept.
4. Wait for my answer.
5. When I respond: Evaluate my answer, kindly correct any misunderstandings, explain WHY, and only then proceed to the next subtopic.
6. After we finish all subtopics, give me a 5-question mock test.

Please begin now with the first subtopic and question.',
   '[{"name":"chapter_topic","label":"Chapter / topic","type":"text","required":true,"placeholder":"e.g. The Krebs Cycle / Macroeconomic Monetary Policy"},{"name":"current_level","label":"Your current level","type":"text","required":true,"placeholder":"e.g. Complete beginner / intermediate"},{"name":"chapter_notes","label":"Notes or summary excerpt","type":"textarea","required":false,"placeholder":"Optional: paste a section from your textbook or lecture notes"}]',
   'Answer without looking at your notes first. Getting answers wrong during practice accelerates learning.',
   NULL,
   'beginner', ARRAY['tutor','socratic','learning'], 4)
) AS v(category_slug, slug, title, description, purpose, instructions, body, variables, pro_tip, warning, difficulty, tags, display_order)
JOIN tk ON tk.category_slug = v.category_slug
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  purpose = EXCLUDED.purpose,
  instructions = EXCLUDED.instructions,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  access_level = 'free';

-- 5. INSERT NEW FREE PROMPTS FOR JOB SEEKER AI TOOLKIT
WITH tk AS (
  SELECT t.id AS toolkit_id, c.id AS category_id, c.slug AS category_slug
  FROM public.toolkits t JOIN public.toolkit_categories c ON c.toolkit_id = t.id
  WHERE t.slug = 'job-seeker-ai-toolkit'
)
INSERT INTO public.prompts (toolkit_id, category_id, title, slug, description, purpose, instructions, body, variables, pro_tip, warning, difficulty, tags, access_level, display_order, status)
SELECT tk.toolkit_id, tk.category_id, v.title, v.slug, v.description, v.purpose, v.instructions, v.body, v.variables::jsonb, v.pro_tip, v.warning, v.difficulty::difficulty_level, v.tags::text[], 'free'::access_level, v.display_order, 'published'::content_status
FROM (VALUES
  ('outreach', 'job-search-sprint-planner', '30-Day Job Search Sprint Planner',
   'Replace job search burnout with a structured daily 30-day outreach and application roadmap.',
   'Keep job hunting organized and focused on high-conversion activities like warm referrals and tailored pitches.',
   'Enter your target role and hours to get a 4-week daily execution plan.',
   'Act as a career coach and executive recruiter.

Target role: {{target_role}}
Target industry/niche: {{target_industry}}
Target location / remote preference: {{location}}
Hours available per day for job hunting: {{hours_available}}

Create a high-impact 30-day job search campaign organized into 4 weekly sprints:
- Week 1: Asset Optimization (CV tailoring, LinkedIn headline, portfolio proof points)
- Week 2: Warm Networking & Informational Interviews (finding contacts and outreach scripts)
- Week 3: Targeted Direct Applications & Decision-Maker Outreach
- Week 4: Interview Pipeline Acceleration & Strategic Follow-Ups

For each week, give daily time-blocked tasks (Monday–Friday). Focus on quality over spray-and-pray applications.',
   '[{"name":"target_role","label":"Target role","type":"text","required":true,"placeholder":"e.g. Product Manager / Frontend Developer"},{"name":"target_industry","label":"Target industry","type":"text","required":true,"placeholder":"e.g. Fintech, Edtech, E-commerce"},{"name":"location","label":"Location / Remote","type":"text","required":true,"placeholder":"e.g. Remote (Global/Africa) or Lagos, Nigeria"},{"name":"hours_available","label":"Hours available per day","type":"text","required":true,"placeholder":"2-3 hours/day"}]',
   'Five personalized messages to hiring managers will yield more interviews than 100 quick-apply submissions.',
   NULL,
   'beginner', ARRAY['jobs','planning','search'], 3),

  ('cv', 'skill-gap-transition-matrix', 'High-Income Skill Gap & Transition Matrix',
   'Map your current background against a higher-paying target role to uncover transferable strengths and missing skills.',
   'Make confident career pivots by knowing exactly what gap to close and what proof projects to build.',
   'Paste your current skills and the target role description.',
   'Act as a senior talent acquisition specialist and career strategist.

Current role / background: {{current_role}}
My existing core skills: {{my_skills}}
Desired target role: {{target_role}}
Key requirements from target job advert: {{target_job_desc}}

Perform a comprehensive Skill Gap & Transition Analysis:
1. Transferable Strengths Matrix: Detail which of my current skills directly translate to the target role, and how to frame them on my CV.
2. The Critical Skill Gaps: Identify the top 3-4 missing competencies that would disqualify me right now.
3. High-ROI Proof Projects: Suggest 2 portfolio projects I can build in 2-4 weeks to tangibly demonstrate the missing skills without formal work experience.
4. 6-Month Upskilling Roadmap: Recommended certifications, courses, or practice to close the gap fast.',
   '[{"name":"current_role","label":"Current role","type":"text","required":true,"placeholder":"e.g. Customer Support Specialist"},{"name":"my_skills","label":"Your current skills","type":"textarea","required":true,"placeholder":"e.g. Zendesk, conflict resolution, ticket management, basic SQL"},{"name":"target_role","label":"Desired target role","type":"text","required":true,"placeholder":"e.g. Associate Product Manager"},{"name":"target_job_desc","label":"Target job advert requirements","type":"textarea","required":true,"placeholder":"Paste key bullets from the job post"}]',
   'Highlighting transferable skills with metrics is the fastest way to overcome "years of experience" requirements.',
   NULL,
   'intermediate', ARRAY['skills','career-pivot','cv'], 3)
) AS v(category_slug, slug, title, description, purpose, instructions, body, variables, pro_tip, warning, difficulty, tags, display_order)
JOIN tk ON tk.category_slug = v.category_slug
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  purpose = EXCLUDED.purpose,
  instructions = EXCLUDED.instructions,
  body = EXCLUDED.body,
  variables = EXCLUDED.variables,
  access_level = 'free';
