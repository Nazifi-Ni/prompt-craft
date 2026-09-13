/**
 * Centralized access control logic for toolkits and prompts.
 */

export function isToolkitPro(toolkit: { slug: string; access_level?: string | null }): boolean {
  // Scholarship toolkit has free access content, so it is not exclusively Pro
  if (toolkit.slug === "scholarship-ai-toolkit") {
    return false;
  }
  return true;
}

export function isPromptPro(prompt: {
  slug?: string | null;
  category_slug?: string | null;
  toolkit_slug?: string | null;
  access_level?: string | null;
}): boolean {
  // Toolkits that are completely Pro (Student, Developer, Job Seeker, etc.)
  if (prompt.toolkit_slug && prompt.toolkit_slug !== "scholarship-ai-toolkit") {
    return true;
  }

  // Specific prompt in Scholarship AI Toolkit to lock
  if (prompt.slug === "scholarship-opportunity-finder") {
    return true;
  }

  // Specific categories in Scholarship AI Toolkit to lock:
  // 03-Personal Statements, 06-CV & Résumé, 07-Recommendation & References,
  // 08-Application Review, 09-Scholarship Interview Preparation, 10-Submission & Follow-Up
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

  return prompt.access_level === "pro";
}
