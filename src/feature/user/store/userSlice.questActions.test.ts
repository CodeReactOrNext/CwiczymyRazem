// @vitest-environment jsdom

import { updateSeasonalPoints } from "feature/report/services/updateSeasonalPoints";
import { getDocFromCache, runTransaction, updateDoc } from "firebase/firestore";
import posthog from "posthog-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getQuestDayKey } from "./questDay";
import { setDailyQuest } from "./userSlice";
import {
  claimQuestRewardAction,
  DAILY_QUEST_FAME_REWARD,
  DAILY_QUEST_POINTS_REWARD,
  syncDailyQuestAction,
} from "./userSlice.questActions";

const FAME_INCREMENT = Symbol("fame-increment");

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({ __userRef: true })),
  getDocFromCache: vi.fn(),
  increment: vi.fn((value: number) => ({ __increment: value })),
  runTransaction: vi.fn(),
  updateDoc: vi.fn(),
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

const buildQuest = (progress: number) => ({
  date: getQuestDayKey(),
  isRewardClaimed: false,
  tasks: [
    {
      id: "t1",
      type: "long_session",
      title: "Practice for 15 minutes",
      target: 15,
      progress,
      isCompleted: progress >= 15,
    },
  ],
});

const runSync = async (localProgress: number) => {
  const dispatch = vi.fn((action: any) => action);
  const getState = () => ({
    user: { currentUserStats: { dailyQuest: buildQuest(localProgress) } },
  });

  await syncDailyQuestAction()(dispatch as any, getState as any, undefined);

  return dispatch;
};

const cachedSnapshot = (progress: number) => ({
  data: () => ({ statistics: { dailyQuest: buildQuest(progress) } }),
});

describe("syncDailyQuestAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateDoc).mockResolvedValue(undefined);
  });

  it("queues the merged quest as a plain write when the transaction fails", async () => {
    vi.mocked(runTransaction).mockRejectedValue(
      new Error("Daily quest sync timed out"),
    );
    vi.mocked(getDocFromCache).mockResolvedValue(cachedSnapshot(5) as never);

    await runSync(10);

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const written = vi.mocked(updateDoc).mock.calls[0][1] as Record<string, any>;
    expect(written["statistics.dailyQuest"].tasks[0].progress).toBe(10);
    expect(posthog.capture).toHaveBeenCalledWith("daily_quest_sync_fallback", {
      reason: "Daily quest sync timed out",
    });
    expect(posthog.capture).not.toHaveBeenCalledWith(
      "daily_quest_sync_failed",
      expect.anything(),
    );
  });

  it("pulls newer cached progress into the store instead of writing it back", async () => {
    vi.mocked(runTransaction).mockRejectedValue(new Error("Connection failed."));
    vi.mocked(getDocFromCache).mockResolvedValue(cachedSnapshot(12) as never);

    const dispatch = await runSync(4);

    expect(updateDoc).not.toHaveBeenCalled();
    expect(setDailyQuest).toHaveBeenCalledWith(
      expect.objectContaining({
        tasks: [expect.objectContaining({ progress: 12 })],
      }),
    );
    expect(dispatch).toHaveBeenCalledWith({ type: "user/setDailyQuest" });
  });

  it("refuses a blind overwrite when nothing is cached and reports the failure", async () => {
    vi.mocked(runTransaction).mockRejectedValue(
      new Error("Daily quest sync timed out"),
    );
    vi.mocked(getDocFromCache).mockRejectedValue(
      new Error("Failed to get document from cache."),
    );

    await runSync(10);

    expect(updateDoc).not.toHaveBeenCalled();
    expect(posthog.capture).toHaveBeenCalledWith("daily_quest_sync_failed", {
      message: "Daily quest sync timed out",
      fallbackMessage: "Failed to get document from cache.",
      stage: "fallback",
    });
  });

  it("does not touch the fallback when the transaction succeeds", async () => {
    vi.mocked(runTransaction).mockImplementation(async (_db, updateFn: any) =>
      updateFn({
        get: async () => cachedSnapshot(5),
        update: vi.fn(),
      }),
    );

    await runSync(10);

    expect(getDocFromCache).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
