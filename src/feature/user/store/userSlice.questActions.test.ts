// @vitest-environment jsdom

import { updateSeasonalPoints } from "feature/report/services/updateSeasonalPoints";
import { runTransaction } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  claimQuestRewardAction,
  DAILY_QUEST_FAME_REWARD,
  DAILY_QUEST_POINTS_REWARD,
} from "./userSlice.questActions";

const FAME_INCREMENT = Symbol("fame-increment");

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ __userRef: true })),
  increment: vi.fn((value: number) => ({ __increment: value })),
  runTransaction: vi.fn(),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
  auth: { currentUser: { uid: "user1" } },
}));

vi.mock("feature/report/services/updateSeasonalPoints", () => ({
  updateSeasonalPoints: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

vi.mock("./userSlice", () => ({
  claimQuestReward: vi.fn(() => ({ type: "user/claimQuestReward" })),
  completeQuestTask: vi.fn(() => ({ type: "user/completeQuestTask" })),
  generateDailyQuest: vi.fn(() => ({ type: "user/generateDailyQuest" })),
  setDailyQuest: vi.fn(() => ({ type: "user/setDailyQuest" })),
}));

vi.mock("../../logs/services/addQuestLog.service", () => ({
  firebaseAddQuestLog: vi.fn(),
}));

/**
 * The store copy is deliberately behind the stored one: it is what the tab
 * loaded this morning, before a challenge recording incremented the same field.
 */
const STORED_POINTS = 1180;
const STALE_STORE_POINTS = 1000;

const buildState = () => ({
  user: {
    currentUserStats: {
      points: STALE_STORE_POINTS,
      lvl: 5,
      fame: 300,
      dailyQuest: {
        date: "2026-08-30",
        isRewardClaimed: false,
        tasks: [{ type: "long_session", isCompleted: true }],
      },
    },
  },
});

/** Runs the thunk against a stub store and returns the transaction's update. */
const claimAndCaptureUpdate = async () => {
  let update: Record<string, unknown> | undefined;

  vi.mocked(runTransaction).mockImplementation(async (_db, updateFn: any) =>
    updateFn({
      get: async () => ({
        data: () => ({ statistics: { points: STORED_POINTS, lvl: 5 } }),
      }),
      update: (_ref: unknown, data: Record<string, unknown>) => {
        update = data;
      },
    }),
  );

  // Nested thunks (the quest sync) are recorded, not run — this test is about
  // the reward write, and the sync has a Firestore transaction of its own.
  const dispatch = vi.fn((action: any) => action);

  const result = await claimQuestRewardAction()(
    dispatch as any,
    buildState as any,
    undefined,
  );

  if (result.type.endsWith("/rejected")) {
    throw new Error(`thunk rejected: ${JSON.stringify(result)}`);
  }

  return update;
};

describe("claimQuestRewardAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds the reward to the stored points, not to the tab's stale copy", async () => {
    const update = await claimAndCaptureUpdate();

    expect(update?.["statistics.points"]).toBe(
      STORED_POINTS + DAILY_QUEST_POINTS_REWARD,
    );
    // The regression this guards: writing the store copy back over the field
    // silently erased everything incremented into it since the tab loaded.
    expect(update?.["statistics.points"]).not.toBe(
      STALE_STORE_POINTS + DAILY_QUEST_POINTS_REWARD,
    );
  });

  it("pays fame as an increment so concurrent fame writes survive", async () => {
    const { increment } = await import("firebase/firestore");
    vi.mocked(increment).mockReturnValue(FAME_INCREMENT as never);

    const update = await claimAndCaptureUpdate();

    expect(increment).toHaveBeenCalledWith(DAILY_QUEST_FAME_REWARD);
    expect(update?.["statistics.fame"]).toBe(FAME_INCREMENT);
  });

  it("derives the level from the fresh total", async () => {
    const update = await claimAndCaptureUpdate();

    // 1190 points is well past the level-5 threshold, so the stored level is
    // recomputed rather than copied from the store.
    expect(update?.["statistics.lvl"]).toBeGreaterThan(5);
    expect(update?.["statistics.currentLevelMaxPoints"]).toBeGreaterThan(
      STORED_POINTS,
    );
  });

  it("mirrors the same reward into the season standings", async () => {
    await claimAndCaptureUpdate();

    expect(updateSeasonalPoints).toHaveBeenCalledWith(
      "user1",
      DAILY_QUEST_POINTS_REWARD,
    );
  });
});
