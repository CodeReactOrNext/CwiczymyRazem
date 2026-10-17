import type {
  DailyQuestCategory,
  DailyQuestCategoryMinutes,
  DailyQuestTaskType,
} from "types/api.types";

/** Minutes a category needs today to count for "Practice 2 categories for 5 min each". */
export const QUEST_CATEGORY_MIN_MINUTES = 5;

const CATEGORIES: DailyQuestCategory[] = ["technique", "theory", "hearing", "creativity"];

/**
 * Quests whose progress is a number of *distinct* categories practiced today.
 * Adding what each session reports does not work for them: two technique-only
 * sessions are one category, not two.
 */
export const isCategoryQuestType = (type: DailyQuestTaskType): boolean =>
  type === "well_rounded" || type === "two_categories_min";

const positive = (value: number | undefined): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

/** Drops categories with no time, so nothing but practiced categories is stored. */
export const normalizeCategoryMinutes = (
  minutes: DailyQuestCategoryMinutes | undefined
): DailyQuestCategoryMinutes => {
  const result: DailyQuestCategoryMinutes = {};
  for (const category of CATEGORIES) {
    const value = positive(minutes?.[category]);
    if (value > 0) result[category] = value;
  }
  return result;
};

/** Adds a session's minutes onto what the quest already holds for today. */
export const addCategoryMinutes = (
  current: DailyQuestCategoryMinutes | undefined,
  session: DailyQuestCategoryMinutes | undefined
): DailyQuestCategoryMinutes => {
  const result: DailyQuestCategoryMinutes = {};
  for (const category of CATEGORIES) {
    const total = positive(current?.[category]) + positive(session?.[category]);
    if (total > 0) result[category] = total;
  }
  return result;
};

/**
 * Reconciles two copies of the same day's minutes. Per category the larger one
 * wins: summing would double count the session both copies already contain.
 */
export const mergeCategoryMinutes = (
  a: DailyQuestCategoryMinutes | undefined,
  b: DailyQuestCategoryMinutes | undefined
): DailyQuestCategoryMinutes | undefined => {
  if (!a && !b) return undefined;

  const result: DailyQuestCategoryMinutes = {};
  for (const category of CATEGORIES) {
    const value = Math.max(positive(a?.[category]), positive(b?.[category]));
    if (value > 0) result[category] = value;
  }
  return result;
};

export const isSameCategoryMinutes = (
  a: DailyQuestCategoryMinutes | undefined,
  b: DailyQuestCategoryMinutes | undefined
): boolean => CATEGORIES.every((category) => positive(a?.[category]) === positive(b?.[category]));

/** How many categories count toward the given quest, given today's minutes. */
export const countQuestCategories = (
  type: DailyQuestTaskType,
  minutes: DailyQuestCategoryMinutes | undefined
): number => {
  const threshold = type === "two_categories_min" ? QUEST_CATEGORY_MIN_MINUTES : 0;

  return CATEGORIES.filter((category) => {
    const value = positive(minutes?.[category]);
    return value > 0 && value >= threshold;
  }).length;
};
