/** Fame awarded per activity inside a grouped feed row. */
export const FAME_PER_ACTIVITY = 5;

/** Fame cap for a grouped activity, regardless of how many activities it contains. */
export const MAX_GROUPED_ACTIVITY_FAME = 50;

/** Fixed Fame reward for Exercise Plan activity — not affected by grouping. */
export const EXERCISE_PLAN_FAME = 15;

/** Fame reward for a feed row grouping `activityCount` consecutive activities of the same type. */
export const calculateActivityFame = (activityCount: number): number =>
  Math.min(MAX_GROUPED_ACTIVITY_FAME, FAME_PER_ACTIVITY * Math.max(1, activityCount));
