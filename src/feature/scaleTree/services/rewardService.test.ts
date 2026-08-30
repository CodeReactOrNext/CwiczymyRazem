// @vitest-environment jsdom

import { increment, runTransaction } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { claimReward } from "./rewardService";

vi.mock("firebase/firestore", () => ({
  arrayUnion: vi.fn((value: string) => ({ __arrayUnion: value })),
  doc: vi.fn(() => ({ __userRef: true })),
  getDoc: vi.fn(),
  increment: vi.fn((value: number) => ({ __increment: value })),
  runTransaction: vi.fn(),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

const STORED_POINTS = 1180;

/**
 * Drives the claim against a stubbed transaction and hands back both the
 * result and the update the transaction was asked to write.
 */
const claimAgainst = async (userData: Record<string, unknown> | null) => {
  let update: Record<string, unknown> | undefined;
  let reads = 0;

  vi.mocked(runTransaction).mockImplementation(async (_db, updateFn: any) =>
    updateFn({
      get: async () => {
        reads += 1;
        return { exists: () => userData !== null, data: () => userData };
      },
      update: (_ref: unknown, data: Record<string, unknown>) => {
        update = data;
      },
    }),
  );

  const result = await claimReward("user1", "node-7", 30, 200);

  return { result, update, reads };
};

describe("claimReward", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pays both currencies as increments, never as absolute totals", async () => {
    const { result, update } = await claimAgainst({
      statistics: { points: STORED_POINTS, fame: 400 },
      claimedRewards: [],
    });

    expect(result.success).toBe(true);
    // The regression this guards: writing the totals read a moment earlier
    // erased anything incremented onto the same fields in between.
    expect(increment).toHaveBeenCalledWith(30);
    expect(increment).toHaveBeenCalledWith(200);
    expect(update?.["statistics.points"]).toEqual({ __increment: 30 });
    expect(update?.["statistics.fame"]).toEqual({ __increment: 200 });
    expect(update?.claimedRewards).toEqual({ __arrayUnion: "node-7" });
  });

  it("reads and writes inside a single transaction", async () => {
    const { reads } = await claimAgainst({
      statistics: { points: STORED_POINTS, fame: 400 },
      claimedRewards: [],
    });

    // The guard and the payout share one read, so a second click racing the
    // first cannot pass the already-claimed check and pay the node out twice.
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(reads).toBe(1);
  });

  it("refuses a node the player already claimed", async () => {
    const { result, update } = await claimAgainst({
      statistics: { points: STORED_POINTS, fame: 400 },
      claimedRewards: ["node-7"],
    });

    expect(result).toEqual({
      success: false,
      error: "Reward already claimed",
    });
    expect(update).toBeUndefined();
  });

  it("reports the totals the payout lands on", async () => {
    const { result } = await claimAgainst({
      statistics: { points: STORED_POINTS, fame: 400 },
      claimedRewards: [],
    });

    expect(result.newPoints).toBe(STORED_POINTS + 30);
    expect(result.newFame).toBe(600);
  });

  it("fails cleanly when the user document is missing", async () => {
    const { result, update } = await claimAgainst(null);

    expect(result).toEqual({ success: false, error: "User not found" });
    expect(update).toBeUndefined();
  });
});
