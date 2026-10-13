import type { Translate } from "lib/i18n/translate";

/**
 * The section names double as grouping and sort keys in the article frontmatter,
 * so they stay English there and are only translated when they are shown.
 */
const SECTION_KEYS: Record<string, string> = {
  "Start Here": "start_here",
  "Scoring & Progress": "scoring_progress",
  Practice: "practice",
  "Songs & Library": "songs_library",
  "Skill Development": "skill_development",
  Community: "community",
  Competition: "competition",
};

export const wikiSectionLabel = (t: Translate, section: string): string => {
  const key = SECTION_KEYS[section];
  return key ? t(`wiki:sections.${key}`) : section;
};

/** One line of context under a section's heading on the wiki index. */
export const wikiSectionIntro = (
  t: Translate,
  section: string,
): string | undefined => {
  const key = SECTION_KEYS[section];
  const path = key ? `wiki:section_intros.${key}` : undefined;
  if (!path) return undefined;

  const text = t(path);
  // A section with no intro comes back as its own key.
  return text === path ? undefined : text;
};
