import { getLeaderboardNeighbors } from "feature/leadboard/services/getLeaderboardNeighbors";
import { getDoc, getDocs } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db: unknown, ...path: string[]) => ({ path })),
  doc: vi.fn((_col: unknown, id: string) => ({ __doc: id })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn((_col: unknown, filter: unknown) => ({ filter })),
  where: vi.fn((field: string, op: string) => ({ field, op })),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

vi.mock("utils/cache/memoryCache", () => ({
  memoryCache: { get: vi.fn(() => null), set: vi.fn() },
}));

const user = (id: string, points: number) => ({
  id,
  data: () => ({ displayName: id, statistics: { points } }),
});

const mockNeighbors = (
  above: ReturnType<typeof user>[],
  below: ReturnType<typeof user>[],
) => {
  vi.mocked(getDocs).mockImplementation(
    async (built: any) =>
      ({ docs: built?.filter?.op === ">" ? above : below }) as any,
  );
};

const mockOwnDoc = (points: number | null) => {
  vi.mocked(getDoc).mockResolvedValue({
    id: "me",
    exists: () => points !== null,
    data: () => ({ displayName: "me", statistics: { points } }),
  } as any);
};

describe("getLeaderboardNeighbors", () => {
  beforeEach(() => vi.clearAllMocks());

  it("orders the slice top-down around the player with their places", async () => {
    // Firestore returns the players above closest first (ascending score).
    mockNeighbors(
      [user("anna", 120), user("bob", 200)],
      [user("me", 100), user("cody", 80), user("dan", 50)],
    );
    mockOwnDoc(100);

    const result = await getLeaderboardNeighbors({
      view: "all-time",
      userId: "me",
      score: 100,
      rank: 150,
    });

    expect(
      result?.rows.map((row) => [row.user.profileId, row.place, row.score]),
    ).toEqual([
      ["bob", 148, 200],
      ["anna", 149, 120],
      ["me", 150, 100],
      ["cody", 151, 80],
      ["dan", 152, 50],
    ]);
  });

  it("says how much it takes to pass the closest player above", async () => {
    mockNeighbors([user("anna", 120)], []);
    mockOwnDoc(100);

    const result = await getLeaderboardNeighbors({
      view: "all-time",
      userId: "me",
      score: 100,
      rank: 2,
    });

    expect(result?.nextRival).toEqual({
      displayName: "anna",
      place: 1,
      gap: 21,
    });
  });

  it("gives players tied with the player the same place", async () => {
    mockNeighbors([], [user("tie", 100), user("me", 100), user("low", 10)]);
    mockOwnDoc(100);

    const result = await getLeaderboardNeighbors({
      view: "all-time",
      userId: "me",
      score: 100,
      rank: 1,
    });

    expect(result?.nextRival).toBeNull();
    expect(result?.rows.map((row) => row.place)).toEqual([1, 1, 3]);
  });

  it("returns nothing when the player has no entry in the ranking", async () => {
    mockNeighbors([], []);
    mockOwnDoc(null);

    const result = await getLeaderboardNeighbors({
      view: "all-time",
      userId: "me",
      score: 0,
      rank: 5,
    });

    expect(result).toBeNull();
  });
});
