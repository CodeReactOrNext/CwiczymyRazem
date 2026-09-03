import type { AchievementCategory } from "../types";

/**
 * The families a badge can belong to.
 *
 * A category is simply the file the definition lives in under `data/categories/`,
 * so this list and that directory are the same fact stated twice — the registry
 * in `achievementsData` is what ties them together, and TypeScript keeps the two
 * in step because `withCategory` is typed on this union.
 */
export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  "stat",
  "time",
  "song",
  "habit",
  "special",
  "rig",
];

/** Translation keys under the `achievements` namespace, e.g. `categories.rig`. */
export const achievementCategoryKey = (category: AchievementCategory) =>
  `categories.${category}` as const;
