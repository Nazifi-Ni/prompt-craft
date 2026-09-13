/**
 * Centralized access control logic for toolkits and prompts.
 */

export function isToolkitPro(toolkit: { slug: string; access_level?: string | null }): boolean {
  // Only the Free AI Toolkit is free
  if (toolkit.slug === "free-ai-toolkit") {
    return false;
  }

  // Everything else is Pro
  return true;
}

export function isPromptPro(prompt: {
  slug?: string | null;
  category_slug?: string | null;
  toolkit_slug?: string | null;
  access_level?: string | null;
}): boolean {
  // Only prompts inside the Free AI Toolkit are free
  if (prompt.toolkit_slug === "free-ai-toolkit") {
    return false;
  }

  // Everything else is Pro
  return true;
}
