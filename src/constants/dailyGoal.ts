/**
 * The player's daily practice goal — the dashed line on Home's "This week"
 * chart and the bar that turns green. A player setting
 * (`statistics.dailyGoalMinutes`); absent means the default.
 */
export const DEFAULT_DAILY_GOAL_MIN = 15;

export const DAILY_GOAL_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90] as const;

export const getDailyGoalMinutes = (
  statistics: { dailyGoalMinutes?: number } | null | undefined,
): number => {
  const value = statistics?.dailyGoalMinutes;
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : DEFAULT_DAILY_GOAL_MIN;
};
