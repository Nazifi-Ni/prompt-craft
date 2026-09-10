# Prompt Craft Hub

BUILD A SUBSCRIPTION-BASED AI PROMPT TOOLKIT PLATFORM



Build a modern, professional SaaS-style web platform for AI Prompt Toolkits.



The platform should allow users to subscribe and access specialized AI prompt libraries designed around specific problems, such as:



- Scholarship Applicants

- Nigerian Students

- Job Seekers

- Small Businesses

- Web Developers

- Researchers

- Interview Preparation

- Content Creators

- Computer Engineering Students



The platform must be built so that I can easily add unlimited new toolkits from the admin dashboard without modifying the code.



---



1. CORE PRODUCT CONCEPT



This is NOT a generic "500 ChatGPT Prompts" website.



Each toolkit solves a specific problem.



Example:



Scholarship AI Toolkit



Categories:



- Scholarship Discovery

- Profile Analysis

- Personal Statements

- Scholarship Essays

- Short-Answer Questions

- CV & Résumé

- Recommendation Letters

- Application Review

- Interview Preparation

- Final Submission



Each category contains individual AI prompts.



Every prompt should have:



- Prompt title

- Short description

- Category

- Difficulty level

- The actual prompt

- Required input fields/variables

- Usage instructions

- Pro tips

- Warnings

- Example input

- Example output

- Tags

- Favorite button

- Copy button



---



2. WEBSITE DESIGN



Create a clean, premium SaaS interface.



Style:



- Modern

- Minimal

- Professional

- Mobile-first

- Fast

- Accessible

- Responsive

- Plenty of whitespace

- Rounded cards

- Subtle animations

- Clear typography

- Strong visual hierarchy



Avoid:



- Excessive gradients

- Overly flashy animations

- Cluttered interfaces

- Generic AI robot imagery

- Cryptocurrency-style aesthetics



Use a professional technology/education aesthetic.



Primary brand color should be configurable from the admin settings.



---



3. PUBLIC WEBSITE



Create these pages:



HOME



Hero section:



Headline:



AI Prompts Built for Real Problems



Subheadline:



Get specialized AI prompt toolkits designed to help you study, apply, build, work and grow smarter.



CTA buttons:



- Explore Toolkits

- View Pricing



Show featured toolkits.



Example cards:



Scholarship AI Toolkit



100+ prompts for scholarship research, essays, CVs, interviews and applications.



Student AI Toolkit



Prompts for learning, assignments, research, presentations and academic productivity.



Developer AI Toolkit



Prompts for coding, debugging, project planning, documentation and development.



Add:



- How it works

- Why specialized prompts?

- Featured toolkits

- Testimonials

- Pricing

- FAQ

- Final CTA

- Footer



---



4. TOOLKIT DIRECTORY



Create "/toolkits".



Display all available toolkits as cards.



Each card should show:



- Toolkit name

- Description

- Number of prompts

- Number of categories

- Access status

- Featured badge where applicable

- View Toolkit button



Add:



- Search

- Category filters

- Sorting

- Featured filter



---



5. TOOLKIT DETAILS PAGE



Example:



"/toolkits/scholarship-ai-toolkit"



Show:



- Toolkit name

- Description

- Who it is for

- Number of prompts

- Categories

- Features

- Sample prompts

- What users will learn

- Subscription requirement

- CTA



Display the categories as cards.



Example:



01 — Scholarship Discovery



Find relevant opportunities and understand eligibility.



02 — Personal Statements



Build authentic and compelling personal statements.



03 — Scholarship Essays



Handle common scholarship essay questions.



...



If the user is not subscribed, allow them to view the toolkit overview and selected sample prompts but lock premium prompts.



---



6. USER AUTHENTICATION



Implement:



- Registration

- Login

- Logout

- Forgot password

- Password reset

- Email verification

- Profile management



User profile should contain:



- Name

- Email

- Profile photo/avatar

- Subscription status

- Subscription plan

- Subscription expiry

- Usage statistics



---



7. USER DASHBOARD



Create "/dashboard".



Dashboard should show:



Welcome section



"Welcome back, [Name]"



Statistics



- Available Toolkits

- Prompts Used

- Favorites

- Subscription Status



Continue Learning



Show recently used prompts/toolkits.



My Toolkits



Display toolkits available under the user's subscription.



Recommended



Recommend relevant toolkits based on usage.



---



8. PROMPT LIBRARY



Inside each toolkit, create a prompt library.



Example:



Scholarship AI Toolkit:



[Search prompts...]



Categories:



- Discovery

- Profile

- Personal Statements

- Essays

- CV

- Interviews



Each prompt card shows:



Leadership Story Builder



Transform a genuine leadership experience into a strong scholarship story.



Difficulty: Advanced



Buttons:



- Open

- Favorite



---



9. PROMPT WORKSPACE



This is one of the most important parts of the platform.



When a user opens a prompt, don't simply display a block of text.



Create a workspace.



Example:



Leadership Story Builder



What this prompt does



Helps you turn a genuine leadership experience into a structured scholarship story.



Your Information



Dynamic input fields:



Leadership experience:

[textarea]



What problem did you face?

[textarea]



What action did you personally take?

[textarea]



What was the result?

[textarea]



What did you learn?

[textarea]



Word limit:

[number input]



Generate Prompt



Build the final customized prompt dynamically using the user's inputs.



Show:



Your Customized Prompt



[generated prompt]



Buttons:



- Copy Prompt

- Reset

- Save to Favorites



If AI API integration is configured, also provide:



Generate Answer with AI



This should be optional and architected so an AI API can be connected later.



---



10. PROMPT VARIABLE SYSTEM



The admin should be able to define variables for every prompt.



Example:



Prompt:



"Act as a scholarship application coach. Review my application for [SCHOLARSHIP_NAME]..."



Variables:



- SCHOLARSHIP_NAME

- ESSAY_QUESTION

- WORD_LIMIT

- COURSE

- UNIVERSITY

- BACKGROUND

- ACHIEVEMENTS



The system should automatically generate input forms from these variables.



Admin should NOT need to edit frontend code to add variables.



---



11. COPY FUNCTION



Every prompt should have a one-click:



Copy Prompt



button.



After copying:



"Prompt copied!"



Track prompt usage.



---



12. FAVORITES



Users can favorite prompts.



Create:



"/dashboard/favorites"



Allow:



- Add favorite

- Remove favorite

- Search favorites

- Filter by toolkit/category



---



13. SEARCH



Implement global search.



Users should be able to search:



- Toolkits

- Categories

- Prompt titles

- Prompt descriptions

- Tags



Example:



Search:



"scholarship essay"



Results should display all relevant prompts.



---



14. SUBSCRIPTION SYSTEM



Create subscription-based access.



Plans should be manageable from the admin dashboard.



Example:



Free



- Limited toolkit access

- Limited prompts

- Sample prompts

- Limited usage



Pro



- All premium toolkits

- Full prompt library

- Favorites

- Prompt workspace

- Unlimited/large usage allowance



Annual



- All Pro features

- Discounted annual pricing



Do NOT hardcode prices.



Admin must be able to change:



- Plan name

- Price

- Billing interval

- Features

- Access permissions

- Usage limits

- Active/inactive status



---



15. PAYMENT SYSTEM



Create a payment architecture that supports Nigerian payment providers.



Primary integration should be structured for:



- Paystack

- Flutterwave



Do not hardcode payment credentials.



Use environment variables.



Payment flow:



User selects plan

→ Checkout

→ Payment provider

→ Payment verification

→ Subscription activated

→ User receives confirmation

→ Transaction recorded



Never activate a paid subscription based only on the frontend response.



Verify payment server-side/webhook.



---



16. SUBSCRIPTION MANAGEMENT



Users should be able to see:



- Current plan

- Amount paid

- Billing cycle

- Start date

- Renewal date

- Status



Statuses:



- Active

- Pending

- Expired

- Cancelled

- Failed



Allow cancellation where supported.



Do not delete subscription history.



---



17. ADMIN DASHBOARD



Create a secure "/admin" area.



Admin dashboard overview:



Statistics



- Total users

- Active subscribers

- Free users

- Monthly revenue

- Active toolkits

- Total prompts

- Prompt usage

- Most popular toolkit

- Most used prompt



Add charts for:



- New users

- Subscriptions

- Revenue

- Prompt usage



---



18. ADMIN TOOLKIT MANAGEMENT



Admin can:



- Create toolkit

- Edit toolkit

- Delete/archive toolkit

- Publish/unpublish toolkit

- Feature/unfeature toolkit

- Change order

- Upload thumbnail

- Set access level



Toolkit fields:



- Name

- Slug

- Description

- Short description

- Target audience

- Icon/image

- Number of prompts

- Categories

- Features

- Access level

- SEO title

- SEO description

- Status



---



19. ADMIN CATEGORY MANAGEMENT



Admin can:



- Create category

- Edit category

- Delete category

- Reorder categories

- Assign category to toolkit



Fields:



- Name

- Slug

- Description

- Icon

- Toolkit

- Display order

- Status



---



20. ADMIN PROMPT MANAGEMENT



This is the main CMS.



Admin can:



- Create prompt

- Edit prompt

- Duplicate prompt

- Archive prompt

- Delete prompt

- Publish/unpublish

- Assign toolkit

- Assign category

- Add tags

- Set difficulty

- Set access level



Prompt fields:



- Title

- Slug

- Description

- Purpose

- Instructions

- Prompt body

- Variables

- Example input

- Example output

- Pro tip

- Warning

- Difficulty

- Tags

- Access level

- Featured

- Display order

- Published status



---



21. PROMPT EDITOR



Create a good admin prompt editor.



Allow:



- Rich text

- Code/text blocks

- Variables

- Formatting

- Preview

- Copy test

- Save draft

- Publish



Provide:



Preview Prompt



so the admin can see exactly what users will see.



---



22. BONUS CONTENT MANAGEMENT



Admin should be able to create:



- Guides

- Checklists

- Worksheets

- Templates

- Bonus resources



These should be attachable to specific toolkits.



---



23. FAQ MANAGEMENT



Admin can:



- Create FAQ

- Edit FAQ

- Delete FAQ

- Reorder FAQ

- Publish/unpublish



---



24. USER MANAGEMENT



Admin can view:



- Name

- Email

- Registration date

- Subscription

- Subscription status

- Last login

- Prompt usage

- Favorites



Admin actions:



- View user

- Suspend user

- Reactivate user

- Change subscription

- Reset usage

- Delete account



Never expose user passwords.



---



25. SUBSCRIPTION MANAGEMENT



Admin should see:



- All plans

- Active subscriptions

- Expired subscriptions

- Cancelled subscriptions

- Failed payments

- Transactions



Transaction fields:



- User

- Plan

- Amount

- Currency

- Provider

- Transaction reference

- Status

- Date



---



26. ANALYTICS



Track:



- Toolkit views

- Prompt views

- Prompt copies

- Prompt generations

- Favorites

- Searches

- Subscription conversions



Admin should be able to identify:



Most viewed prompts



Most copied prompts



Most popular toolkits



Most searched topics



Use this data to decide what new content to create.



---



27. DATABASE STRUCTURE



Use a relational database.



Recommended tables:



- users

- roles

- toolkits

- toolkit_categories

- prompts

- prompt_variables

- prompt_examples

- prompt_tags

- tags

- subscriptions

- subscription_plans

- transactions

- favorites

- prompt_usage

- toolkit_usage

- searches

- bonuses

- faqs

- notifications

- site_settings



Use proper:



- Primary keys

- Foreign keys

- Indexes

- Unique constraints

- Timestamps

- Soft deletion where appropriate



---



28. SECURITY



Implement:



- Password hashing

- Authentication middleware

- Role-based authorization

- Admin route protection

- CSRF protection where applicable

- Input validation

- Output escaping

- SQL injection protection

- Rate limiting

- Secure sessions

- Server-side subscription verification

- Secure webhook verification

- Environment variables for secrets



A normal user must NEVER be able to access admin APIs simply by changing the URL.



---



29. RESPONSIVE DESIGN



The platform must work properly on:



- Android phones

- iPhones

- Tablets

- Laptops

- Desktop



Mobile navigation should use a clean bottom navigation or mobile drawer.



Admin dashboard should also be responsive.



---



30. SEO



Implement:



- SEO-friendly URLs

- Dynamic page titles

- Meta descriptions

- Open Graph metadata

- Sitemap

- Robots.txt

- Structured data where appropriate

- Canonical URLs



Toolkit pages should be indexable.



Premium prompt content should not be unnecessarily exposed to search engines.



---



31. PERFORMANCE



Prioritize:



- Fast page loads

- Lazy loading

- Optimized images

- Pagination

- Database indexing

- Caching where appropriate

- Minimal JavaScript where possible



Do not load the entire prompt library at once.



---



32. CONTENT SEEDING



Initially create the:



Scholarship AI Toolkit



with these 10 categories:



1. Scholarship Discovery & Research

2. Understanding Your Profile

3. Personal Statements

4. Scholarship Essays

5. Short-Answer Questions

6. CV & Résumé

7. Recommendation & References

8. Application Review

9. Scholarship Interview Preparation

10. Final Submission & Follow-Up



Seed it with the 100 prompts provided in the product specification.



Structure every prompt properly rather than dumping plain text into the database.



---



33. ARCHITECTURE



Build the application with a clean separation between:



Frontend



User interface and interactions.



Backend



Authentication, business logic, subscriptions, payments, analytics and APIs.



Database



Persistent content and user data.



Admin CMS



Content management.



Payment Layer



Replaceable payment provider abstraction.



AI Layer



Replaceable AI API abstraction.



The AI provider must NOT be tightly coupled to the prompt content system.



I should be able to change AI providers later.



---



34. FUTURE AI INTEGRATION



Design the system so that later I can connect:



- OpenAI

- Google Gemini

- Anthropic

- Other compatible AI APIs



The platform should support:



Prompt-only mode



and eventually:



AI-powered mode



where users enter their information and the platform sends the customized prompt to an AI API.



Keep API keys server-side.



Never expose API keys in frontend JavaScript.



---



35. ADMIN SITE SETTINGS



Admin should be able to modify:



- Site name

- Logo

- Favicon

- Brand colors

- Homepage text

- Contact email

- Social links

- Footer text

- SEO defaults

- Currency

- Payment settings

- Subscription settings



---



36. NOTIFICATIONS



Create notification support for:



- Successful payment

- Subscription activated

- Subscription expiring

- Subscription expired

- Password reset

- Important platform announcements



Build this so email providers can be integrated later.



---



37. USER EXPERIENCE



A typical user journey should be:



Landing page

→ Explore toolkit

→ View toolkit

→ Register

→ Select subscription

→ Pay

→ Dashboard

→ Open toolkit

→ Select category

→ Select prompt

→ Fill variables

→ Generate customized prompt

→ Copy/use prompt

→ Save favorite



Keep the number of clicks low.



---



38. IMPORTANT CONTENT RULE



The platform must clearly communicate:



AI should assist applicants, not replace their authentic experiences.



For scholarship-related prompts:



- Never encourage fabricated achievements.

- Never invent qualifications.

- Never fabricate volunteering experience.

- Never fabricate citations.

- Never encourage plagiarism.

- Encourage users to verify scholarship requirements from official sources.

- Encourage users to personalize AI-generated drafts.



---



39. ADMIN CONTENT WORKFLOW



Make content management extremely simple:



Admin creates:



Toolkit



↓



Creates:



Categories



↓



Creates:



Prompts



↓



Adds:



Variables



↓



Adds:



Examples



↓



Publishes.



No developer intervention should be required.



---



40. DEMO DATA



Create realistic demo data so the application looks complete immediately.



Include:



- Scholarship AI Toolkit

- Student AI Toolkit

- Developer AI Toolkit

- Job Seeker AI Toolkit



However, the Scholarship AI Toolkit should contain the largest amount of initial content.



---



41. CODE QUALITY



Use:



- Clean architecture

- Reusable components

- Modular code

- Clear naming

- Environment configuration

- API validation

- Error handling

- Loading states

- Empty states

- Success/error notifications



Do not create one huge component/file.



---



42. FINAL REQUIREMENT



The most important requirement is:



I must be able to run this platform as a real subscription SaaS product and manage the entire content library from the admin dashboard without editing source code.



Build the MVP completely, not as a static mockup.



All major buttons should work.



Authentication should work.



Database operations should work.



Admin CRUD should work.



Subscription architecture should work.



Prompt variables should work.



Search should work.



Favorites should work.



Usage tracking should work.



Payment integration should be prepared for production credentials.



Use sensible placeholder environment variables where real credentials are unavailable.



Before finishing, test:



1. User registration

2. Login/logout

3. Admin login

4. Toolkit creation

5. Category creation

6. Prompt creation

7. Prompt variables

8. Prompt customization

9. Copy prompt

10. Favorites

11. Search

12. Subscription access control

13. Payment verification architecture

14. Admin analytics

15. Mobile responsiveness



Do not sacrifice functionality for visual effects.



The final result should feel like a real SaaS product, not a template or landing-page demo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://promptify-toolkit-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f36bd6de-25ad-4810-b2b9-3a6b48395510).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
