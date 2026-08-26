import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  Timestamp: { now: () => "now" },
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
}));

vi.mock("utils/firebase/client/firestoreTracking", () => ({
  trackedGetDoc: vi.fn(),
  trackedGetDocs: vi.fn(),
  trackedSetDoc: vi.fn(),
}));

vi.mock("feature/logger/Logger", () => ({
  logger: { error: vi.fn() },
}));

import { trackedGetDoc, trackedSetDoc } from "utils/firebase/client/firestoreTracking";

import { saveLeaderboardEntry } from "./bpmProgressService";

const mockStandingEntry = (data: Record<string, unknown> | null) => {
  vi.mocked(trackedGetDoc).mockResolvedValue({
    exists: () => data !== null,
    data: () => data,
  } as never);
};

/** The document `saveLeaderboardEntry` wrote, or undefined if it wrote nothing. */
const written = () => vi.mocked(trackedSetDoc).mock.calls[0]?.[1] as Record<string, unknown> | undefined;

describe("saveLeaderboardEntry", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stamps the tempo the score was played at", async () => {
    mockStandingEntry(null);

    await saveLeaderboardEntry("me", "ex1", 21_375, "Kasia", "kasia.png", 120);

    expect(written()).toMatchObject({ score: 21_375, bpm: 120 });
  });

  it("writes no tempo at all for an exercise that has none", async () => {
    mockStandingEntry(null);

    await saveLeaderboardEntry("me", "ex1", 21_375, "Kasia", "kasia.png");

    // Firestore rejects an explicit `undefined`, so the key has to be absent.
    expect(written()).not.toHaveProperty("bpm");
  });

  it("never leaves a beaten record's tempo on the score that beat it", async () => {
    mockStandingEntry({ score: 18_000, bpm: 90 });

    await saveLeaderboardEntry("me", "ex1", 21_375, "Kasia", "kasia.png");

    expect(written()).not.toHaveProperty("bpm");
  });

  it("leaves a standing record untouched when the run came in under it", async () => {
    mockStandingEntry({ score: 30_000, bpm: 140 });

    await saveLeaderboardEntry("me", "ex1", 21_375, "Kasia", "kasia.png", 100);

    expect(trackedSetDoc).not.toHaveBeenCalled();
  });
});
