/**
 * Centralized access control logic for toolkits and prompts.
 */

// Prompts that are explicitly free across any toolkit
export const EXPLICIT_FREE_PROMPT_SLUGS = new Set([
  // Scholarship free prompts
  "profile-strength-audit",
  "scholarship-essay-planner",
  "short-answer-compressor",
  "eligibility-gap-checker",

  // Student free prompts
  "feynman-concept-explainer",
  "syllabus-exam-strategist",
  "socratic-chapter-coach",

  // Job Seeker free prompts
  "job-search-sprint-planner",
  "skill-gap-transition-matrix",

  // Freelance & Digital Income free prompts
  "skill-to-product-generator",
  "side-hustle-launch-plan",
]);

export function isToolkitPro(toolkit: { slug: string; access_level?: string | null }): boolean {
  // Toolkits that offer free access prompts are marked as Free tier accessible
  const toolkitsWithFreeTiers = [
    "scholarship-ai-toolkit",
    "student-ai-toolkit",
    "job-seeker-ai-toolkit",
    "freelance-digital-income-toolkit",
  ];

  if (toolkitsWithFreeTiers.includes(toolkit.slug)) {
    return false;
  }

  // Otherwise, respect database access_level or default to Pro
  return toolkit.access_level !== "free";
}

export function isPromptPro(prompt: {
  slug?: string | null;
  category_slug?: string | null;
  toolkit_slug?: string | null;
  access_level?: string | null;
}): boolean {
  // If explicitly listed in our free set, it is free
  if (prompt.slug && EXPLICIT_FREE_PROMPT_SLUGS.has(prompt.slug)) {
    return false;
  }

  // Specific rules for Scholarship AI Toolkit
  if (prompt.toolkit_slug === "scholarship-ai-toolkit") {
    if (prompt.slug === "scholarship-opportunity-finder") {
      return true;
    }
    const proCategories = [
      "personal-statements",
      "cv",
      "references",
      "review",
      "interviews",
      "submission",
    ];
    if (prompt.category_slug && proCategories.includes(prompt.category_slug)) {
      return true;
    }
    return false;
  }

  // In other toolkits, if the database says free, let it be free
  if (prompt.access_level === "free") {
    return false;
  }

  return true;
}
