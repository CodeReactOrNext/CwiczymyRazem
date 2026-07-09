import { statisticsInitial } from "constants/userStatisticsInitialData";
import { describe, expect, it } from "vitest";

import reducer, { generateDailyQuest } from "./userSlice";

const buildState = () => ({
  userInfo: null,
  userAuth: null,
  currentUserStats: { ...statisticsInitial },
  previousUserStats: null,
  raitingData: null,
  isFetching: null,
  isLoggedOut: null,
  timer: { creativity: 0, hearing: 0, technique: 0, theory: 0 },
  providerData: {
    providerId: null,
    uid: null,
    displayName: null,
    email: null,
    photoURL: null,
  },
  currentActivity: null,
});

// Task types that overlap in what they ask the player to do — generateDailyQuest
// must never draw more than one from the same group into a single quest set.
const TASK_GROUPS: Record<string, string> = {
  rate_song: "rate_song",
  rate_multiple_songs: "rate_song",
  practice_plan: "practice_plan",
  complete_two_plans: "practice_plan",
  practice_total_time: "total_time",
  long_session: "total_time",
  practice_creativity_time: "creativity_time",
  creativity_focus: "creativity_time",
  well_rounded: "multi_category",
  two_categories_min: "multi_category",
  balanced_session: "multi_category",
  practice_specific_exercise: "specific_exercise",
  practice_three_exercises: "specific_exercise",
};

describe("generateDailyQuest", () => {
  it("never selects two tasks from the same overlapping group", () => {
    for (let i = 0; i < 200; i++) {
      const state = buildState();
      // @ts-expect-error minimal state for reducer testing
      const nextState = reducer(state, generateDailyQuest(undefined));

      const tasks = nextState.currentUserStats?.dailyQuest?.tasks ?? [];
      const groups = tasks
        .map((task) => TASK_GROUPS[task.type] ?? task.type)
        .filter(Boolean);

      expect(new Set(groups).size).toBe(groups.length);
    }
  });

  it("always selects exactly 3 unique tasks", () => {
    const state = buildState();
    // @ts-expect-error minimal state for reducer testing
    const nextState = reducer(state, generateDailyQuest(undefined));

    const tasks = nextState.currentUserStats?.dailyQuest?.tasks ?? [];
    expect(tasks).toHaveLength(3);
    expect(new Set(tasks.map((t) => t.type)).size).toBe(3);
  });

  it("does not regenerate a quest that already exists for today", () => {
    const state = buildState();
    // @ts-expect-error minimal state for reducer testing
    const firstState = reducer(state, generateDailyQuest(undefined));
    // @ts-expect-error minimal state for reducer testing
    const secondState = reducer(firstState, generateDailyQuest(undefined));

    expect(secondState.currentUserStats?.dailyQuest).toEqual(
      firstState.currentUserStats?.dailyQuest
    );
  });
});
