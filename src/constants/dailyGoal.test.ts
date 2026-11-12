import { describe, expect, it } from "vitest";

import { DEFAULT_DAILY_GOAL_MIN, getDailyGoalMinutes } from "./dailyGoal";

describe("getDailyGoalMinutes", () => {
  it("falls back to the default when unset", () => {
    expect(getDailyGoalMinutes(undefined)).toBe(DEFAULT_DAILY_GOAL_MIN);
    expect(getDailyGoalMinutes(null)).toBe(DEFAULT_DAILY_GOAL_MIN);
    expect(getDailyGoalMinutes({})).toBe(DEFAULT_DAILY_GOAL_MIN);
  });

  it("ignores nonsense values", () => {
    expect(getDailyGoalMinutes({ dailyGoalMinutes: 0 })).toBe(DEFAULT_DAILY_GOAL_MIN);
    expect(getDailyGoalMinutes({ dailyGoalMinutes: -5 })).toBe(DEFAULT_DAILY_GOAL_MIN);
    expect(getDailyGoalMinutes({ dailyGoalMinutes: NaN })).toBe(DEFAULT_DAILY_GOAL_MIN);
  });

  it("returns the player's goal", () => {
    expect(getDailyGoalMinutes({ dailyGoalMinutes: 30 })).toBe(30);
  });
});
