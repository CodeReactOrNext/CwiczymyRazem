import { statisticsInitial } from "constants/userStatisticsInitialData";
import type { DailyQuest, DailyQuestTaskType } from "types/api.types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import reducer, { completeQuestTask } from "./userSlice";

const NOON = new Date("2026-10-17T12:00:00.000Z");
const TODAY = "2026-10-17";

const questWith = (type: DailyQuestTaskType, target: number): DailyQuest => ({
  date: TODAY,
  isRewardClaimed: false,
  tasks: [
    {
      id: `quest_${TODAY}_0`,
      type,
      title: type,
      isCompleted: false,
      progress: 0,
      target,
    },
  ],
});

const buildState = (dailyQuest: DailyQuest) => ({
  userInfo: null,
  userAuth: null,
  currentUserStats: { ...statisticsInitial, timeZone: "UTC", dailyQuest },
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

type State = ReturnType<typeof buildState>;

const report = (
  state: State,
  type: DailyQuestTaskType,
  categoryMinutes: Parameters<typeof completeQuestTask>[0]["categoryMinutes"]
) =>
  // Minimal state for reducer testing — not the full slice state.
  reducer(
    state as unknown as Parameters<typeof reducer>[0],
    completeQuestTask({ type, categoryMinutes })
  ) as unknown as State;

const taskOf = (state: State) => state.currentUserStats.dailyQuest.tasks[0];

describe("multi-category daily quests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOON);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Practice 3 different categories", () => {
    it("does not count technique twice when two technique-only sessions are saved", () => {
      // The reported bug: only technique was practiced, the quest read 2/3.
      let state = buildState(questWith("well_rounded", 3));

      state = report(state, "well_rounded", { technique: 10 });
      state = report(state, "well_rounded", { technique: 20 });

      expect(taskOf(state)).toMatchObject({ progress: 1, isCompleted: false });
    });

    it("counts a category once however many sessions it was practiced in", () => {
      let state = buildState(questWith("well_rounded", 3));

      for (let i = 0; i < 5; i++) {
        state = report(state, "well_rounded", { technique: 1 });
      }

      expect(taskOf(state).progress).toBe(1);
    });

    it("adds up categories practiced in different sessions", () => {
      let state = buildState(questWith("well_rounded", 3));

      state = report(state, "well_rounded", { technique: 10 });
      state = report(state, "well_rounded", { theory: 5 });
      expect(taskOf(state)).toMatchObject({ progress: 2, isCompleted: false });

      state = report(state, "well_rounded", { hearing: 1, technique: 4 });
      expect(taskOf(state)).toMatchObject({ progress: 3, isCompleted: true });
    });

    it("completes in one session that covers three categories", () => {
      const state = report(buildState(questWith("well_rounded", 3)), "well_rounded", {
        technique: 5,
        theory: 5,
        creativity: 5,
      });

      expect(taskOf(state)).toMatchObject({ progress: 3, isCompleted: true });
    });

    it("ignores categories with no time", () => {
      const state = report(buildState(questWith("well_rounded", 3)), "well_rounded", {
        technique: 10,
        theory: 0,
        hearing: 0,
        creativity: 0,
      });

      expect(taskOf(state).progress).toBe(1);
      expect(taskOf(state).categoryMinutes).toEqual({ technique: 10 });
    });

    it("ignores a report that carries no minutes", () => {
      const state = report(buildState(questWith("well_rounded", 3)), "well_rounded", undefined);

      expect(taskOf(state)).toMatchObject({ progress: 0, isCompleted: false });
    });

    it("never lowers progress a client already holds", () => {
      const quest = questWith("well_rounded", 3);
      quest.tasks[0].progress = 2;

      const state = report(buildState(quest), "well_rounded", { technique: 10 });

      expect(taskOf(state).progress).toBe(2);
    });
  });

  describe("Practice 2 categories for 5 min each", () => {
    it("does not count one category twice across two 5-minute sessions", () => {
      let state = buildState(questWith("two_categories_min", 2));

      state = report(state, "two_categories_min", { technique: 5 });
      state = report(state, "two_categories_min", { technique: 5 });

      expect(taskOf(state)).toMatchObject({ progress: 1, isCompleted: false });
    });

    it("counts a category whose short sessions add up to 5 minutes", () => {
      let state = buildState(questWith("two_categories_min", 2));

      state = report(state, "two_categories_min", { technique: 3, theory: 5 });
      expect(taskOf(state).progress).toBe(1);

      state = report(state, "two_categories_min", { technique: 2 });
      expect(taskOf(state)).toMatchObject({ progress: 2, isCompleted: true });
    });

    it("does not count a category below 5 minutes", () => {
      const state = report(buildState(questWith("two_categories_min", 2)), "two_categories_min", {
        technique: 4,
        theory: 4,
      });

      expect(taskOf(state).progress).toBe(0);
    });
  });
});
