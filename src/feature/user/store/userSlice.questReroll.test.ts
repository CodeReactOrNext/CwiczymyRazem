import { statisticsInitial } from "constants/userStatisticsInitialData";
import type { DailyQuest } from "types/api.types";
import { describe, expect, it } from "vitest";

import { mergeDailyQuests } from "./dailyQuest.merge";
import { getQuestDayKey } from "./questDay";
import reducer, {
  generateDailyQuest,
  markFeatureUsedLocal,
  rerollQuestTask,
} from "./userSlice";

const buildState = (stats: Partial<typeof statisticsInitial> = {}) =>
  ({
    userInfo: null,
    userAuth: null,
    currentUserStats: { ...statisticsInitial, ...stats },
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
  }) as unknown as ReturnType<typeof reducer>;

const today = getQuestDayKey();

describe("generateDailyQuest with a feature profile", () => {
  it("draws practice plus tools the player uses, and remembers which", () => {
    const state = reducer(
      buildState({ sessionCount: 41, featureUse: { goals: 40, rotation: 39 } }),
      generateDailyQuest(),
    );
    const quest = state.currentUserStats!.dailyQuest!;
    expect(quest.tasks).toHaveLength(3);
    expect(quest.tasks[0].slot).toBe("core");
    expect([...quest.features!].sort()).toEqual(["goals", "rotation"]);
    expect(
      quest.tasks
        .slice(1)
        .map((task) => task.feature)
        .sort(),
    ).toEqual(["goals", "rotation"]);
  });
});

describe("rerollQuestTask", () => {
  const quest: DailyQuest = {
    date: today,
    isRewardClaimed: false,
    features: ["goals"],
    tasks: [
      {
        id: "q0",
        type: "practice_total_time",
        title: "t",
        target: 15,
        progress: 5,
        isCompleted: false,
        slot: "core",
      },
      {
        id: "q1",
        type: "goal_run",
        title: "t",
        target: 1,
        progress: 0,
        isCompleted: false,
        slot: "tool",
        feature: "goals",
      },
      {
        id: "q2",
        type: "rotation_item",
        title: "t",
        target: 1,
        progress: 1,
        isCompleted: true,
        slot: "tool",
        feature: "rotation",
      },
    ],
  };
  const stats = {
    sessionCount: 40,
    featureUse: { goals: 39, rotation: 39, calendar: 38 },
    dailyQuest: quest,
  };

  it("swaps one unfinished task, once a day", () => {
    let state = reducer(buildState(stats), rerollQuestTask({ taskId: "q1" }));
    const swapped = state.currentUserStats!.dailyQuest!;
    expect(swapped.rerolled).toBe(true);
    expect(swapped.tasks[1]).toMatchObject({
      id: "q1_r",
      type: "calendar_tick",
      feature: "calendar",
      progress: 0,
    });
    expect(swapped.features).toEqual(["calendar", "rotation"]);

    state = reducer(state, rerollQuestTask({ taskId: "q0" }));
    expect(state.currentUserStats!.dailyQuest!.tasks[0].id).toBe("q0");
  });

  it("does not swap a finished task or a claimed set", () => {
    const finished = reducer(
      buildState(stats),
      rerollQuestTask({ taskId: "q2" }),
    );
    expect(finished.currentUserStats!.dailyQuest).toEqual(quest);

    const claimed = reducer(
      buildState({ ...stats, dailyQuest: { ...quest, isRewardClaimed: true } }),
      rerollQuestTask({ taskId: "q1" }),
    );
    expect(claimed.currentUserStats!.dailyQuest!.rerolled).toBeUndefined();
  });

  it("survives a sync against the stored, unswapped set", () => {
    const state = reducer(buildState(stats), rerollQuestTask({ taskId: "q1" }));
    const local = state.currentUserStats!.dailyQuest!;
    const merged = mergeDailyQuests(local, quest, today)!;
    expect(merged.rerolled).toBe(true);
    expect(merged.tasks.map((task) => task.id)).toEqual(["q0", "q1_r", "q2"]);
    // Progress the stored copy held on the kept tasks is carried over.
    expect(merged.tasks[2].isCompleted).toBe(true);
  });
});

describe("markFeatureUsedLocal", () => {
  it("keeps the later stamp", () => {
    let state = reducer(
      buildState({ featureUse: { goals: 10 } }),
      markFeatureUsedLocal({ feature: "goals", at: 12 }),
    );
    expect(state.currentUserStats!.featureUse).toEqual({ goals: 12 });
    state = reducer(state, markFeatureUsedLocal({ feature: "goals", at: 5 }));
    expect(state.currentUserStats!.featureUse).toEqual({ goals: 12 });
  });
});
