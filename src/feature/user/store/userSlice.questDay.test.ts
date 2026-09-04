import { statisticsInitial } from "constants/userStatisticsInitialData";
import type { DailyQuest } from "types/api.types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import reducer, { completeQuestTask, generateDailyQuest } from "./userSlice";

/**
 * A Los Angeles player finishing a 45-minute session at 18:05 their time. Under
 * the UTC key the day had already flipped three hours earlier, so the whole
 * session was scored against a quest they had never seen — and the set they had
 * been looking at all afternoon was gone.
 */
const LA_EVENING = new Date("2026-09-04T01:05:00.000Z");
const LA_DAY = "2026-09-03";
const UTC_DAY = "2026-09-04";

const questOn = (date: string, progress = 0): DailyQuest => ({
  date,
  isRewardClaimed: false,
  tasks: [
    {
      id: `quest_${date}_0`,
      type: "practice_total_time",
      title: "Practice for 15 minutes",
      isCompleted: false,
      progress,
      target: 15,
    },
  ],
});

const buildState = (dailyQuest?: DailyQuest) => ({
  userInfo: null,
  userAuth: null,
  currentUserStats: {
    ...statisticsInitial,
    timeZone: "America/Los_Angeles",
    ...(dailyQuest && { dailyQuest }),
  },
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

describe("the daily quest day, in the player's own timezone", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(LA_EVENING);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("scores an evening session against the day the player is living in", () => {
    const state = buildState(questOn(LA_DAY));

    const next = reducer(
      // @ts-expect-error minimal state for reducer testing
      state,
      completeQuestTask({ type: "practice_total_time", amount: 45 }),
    );

    expect(next.currentUserStats?.dailyQuest?.tasks[0]).toMatchObject({
      progress: 15,
      isCompleted: true,
    });
  });

  it("leaves the set alone in the middle of that evening", () => {
    const state = buildState(questOn(LA_DAY, 10));

    // @ts-expect-error minimal state for reducer testing
    const next = reducer(state, generateDailyQuest(undefined));

    expect(next.currentUserStats?.dailyQuest?.tasks).toHaveLength(1);
    expect(next.currentUserStats?.dailyQuest?.tasks[0]).toMatchObject({ progress: 10 });
  });

  it("re-stamps a set stored under the old UTC key rather than redrawing it", () => {
    const state = buildState(questOn(UTC_DAY, 10));

    // @ts-expect-error minimal state for reducer testing
    const next = reducer(state, generateDailyQuest(undefined));

    expect(next.currentUserStats?.dailyQuest?.date).toBe(LA_DAY);
    expect(next.currentUserStats?.dailyQuest?.tasks[0]).toMatchObject({ progress: 10 });
  });

  it("draws a new set once the player's own day has turned over", () => {
    const state = buildState(questOn("2026-09-02", 10));

    // @ts-expect-error minimal state for reducer testing
    const next = reducer(state, generateDailyQuest(undefined));

    expect(next.currentUserStats?.dailyQuest?.date).toBe(LA_DAY);
    expect(next.currentUserStats?.dailyQuest?.tasks).toHaveLength(3);
  });

  it("still refuses progress aimed at a quest from a day that is over", () => {
    const state = buildState(questOn("2026-09-02"));

    const next = reducer(
      // @ts-expect-error minimal state for reducer testing
      state,
      completeQuestTask({ type: "practice_total_time", amount: 45 }),
    );

    expect(next.currentUserStats?.dailyQuest?.tasks[0]).toMatchObject({ progress: 0 });
  });
});
