import type { FirebaseLogsInterface } from "feature/logs/types/logs.type";
import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import { describe, expect, it } from "vitest";

import { feedRunKey, groupFeedRuns } from "./groupFeedRuns";

const session = (
  id: string,
  overrides: Partial<FirebaseLogsInterface> = {},
): AnyFirebaseLog =>
  ({
    id,
    uid: "u1",
    userName: "Kuba",
    data: "2026-11-27",
    timestamp: 0,
    points: 1,
    avatarUrl: null,
    newAchievements: [],
    newLevel: { isNewLevel: false, level: 3 },
    timeSumary: {
      techniqueTime: 0,
      theoryTime: 0,
      hearingTime: 0,
      creativityTime: 0,
      sumTime: 60000,
    },
    exerciseTitle: "Click Hunt",
    ...overrides,
  }) as AnyFirebaseLog;

const ids = (runs: AnyFirebaseLog[][]) =>
  runs.map((run) => run.map((log) => (log as { id?: string }).id));

describe("groupFeedRuns", () => {
  it("folds back-to-back runs of the same exercise", () => {
    const runs = groupFeedRuns([
      session("a"),
      session("b"),
      session("c"),
      session("d", { exerciseTitle: "Gallop Picking" }),
    ]);
    expect(ids(runs)).toEqual([["a", "b", "c"], ["d"]]);
  });

  it("keeps the same exercise apart when something else sits between", () => {
    const runs = groupFeedRuns([
      session("a"),
      session("b", { exerciseTitle: "Gallop Picking" }),
      session("c"),
    ]);
    expect(ids(runs)).toEqual([["a"], ["b"], ["c"]]);
  });

  it("tells plans apart from a bare exercise of the same name", () => {
    const runs = groupFeedRuns([
      session("a", { planId: "plan-1" }),
      session("b"),
    ]);
    expect(ids(runs)).toEqual([["a"], ["b"]]);
  });

  it("gives a session with more to say a row of its own", () => {
    expect(
      feedRunKey(session("a", { newLevel: { isNewLevel: true, level: 4 } })),
    ).toBeNull();
    expect(
      feedRunKey(session("b", { newAchievements: ["first_hour"] as never })),
    ).toBeNull();
    expect(feedRunKey(session("c", { songTitle: "Paranoid" }))).toBeNull();
    expect(feedRunKey(session("d", { exerciseTitle: undefined }))).toBeNull();

    const runs = groupFeedRuns([
      session("a"),
      session("b", { newLevel: { isNewLevel: true, level: 4 } }),
      session("c"),
    ]);
    expect(ids(runs)).toEqual([["a"], ["b"], ["c"]]);
  });
});
