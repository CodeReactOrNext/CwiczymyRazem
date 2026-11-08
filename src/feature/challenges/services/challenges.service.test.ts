import {
  getChallengeSubmissions,
  getMyChallengeSubmissions,
  invalidateChallengeCaches,
} from "feature/challenges/services/challenges.service";
import { where } from "firebase/firestore";
import { trackedGetDocs } from "utils/firebase/client/firestoreTracking";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  query: vi.fn((...args: unknown[]) => ({ __query: args })),
  where: vi.fn((field: string, op: string, value: string) => ({
    field,
    op,
    value,
  })),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

vi.mock("utils/firebase/client/firestoreTracking", () => ({
  trackedGetDoc: vi.fn(),
  trackedGetDocs: vi.fn(),
}));

vi.mock("feature/logger/Logger", () => ({ logger: { error: vi.fn() } }));

const submission = (userId: string, songId: string) => ({
  id: `c1__${userId}__${songId}`,
  data: () => ({ challengeId: "c1", userId, songId }),
});

describe("getMyChallengeSubmissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateChallengeCaches();
  });

  it("asks only for the player's own recordings on the board", async () => {
    vi.mocked(trackedGetDocs).mockResolvedValue({
      docs: [submission("me", "s1")],
    } as never);

    const mine = await getMyChallengeSubmissions("c1", "me");

    expect(mine.map((s) => s.songId)).toEqual(["s1"]);
    expect(where).toHaveBeenCalledWith("challengeId", "==", "c1");
    expect(where).toHaveBeenCalledWith("userId", "==", "me");
  });

  it("cuts them from the whole board when that is already loaded", async () => {
    vi.mocked(trackedGetDocs).mockResolvedValue({
      docs: [submission("me", "s1"), submission("other", "s2")],
    } as never);
    await getChallengeSubmissions("c1");
    vi.mocked(trackedGetDocs).mockClear();

    const mine = await getMyChallengeSubmissions("c1", "me");

    expect(mine.map((s) => s.songId)).toEqual(["s1"]);
    expect(trackedGetDocs).not.toHaveBeenCalled();
  });

  it("reads once per player while cached", async () => {
    vi.mocked(trackedGetDocs).mockResolvedValue({ docs: [] } as never);

    await getMyChallengeSubmissions("c1", "me");
    await getMyChallengeSubmissions("c1", "me");

    expect(trackedGetDocs).toHaveBeenCalledTimes(1);
  });
});
