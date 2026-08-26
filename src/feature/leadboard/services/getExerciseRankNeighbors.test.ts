import { getExerciseRankNeighbors } from "feature/leadboard/services/getExerciseRankNeighbors";
import { getCountFromServer, getDoc, getDocs, where } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ __col: true })),
  doc: vi.fn((_col: unknown, id: string) => ({ __doc: id })),
  getCountFromServer: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn((_col: unknown, filter: unknown) => ({ __query: true, filter })),
  where: vi.fn((_field: string, op: string) => ({ op })),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({ db: {} }));

// The real cache would leak results between cases — every test asks about the
// same exercise.
vi.mock("utils/cache/memoryCache", () => ({
  memoryCache: { get: vi.fn(() => null), set: vi.fn() },
}));

const entry = (id: string, score: number, bpm?: number) => ({
  id,
  data: () => ({ score, displayName: id, avatar: `${id}.png`, ...(bpm ? { bpm } : {}) }),
});

const mockCounts = ({ above, total }: { above: number; total: number }) => {
  vi.mocked(getCountFromServer).mockImplementation(async (source: any) =>
    ({ data: () => ({ count: source?.__query ? above : total }) }) as any
  );
};

/** Both neighbour queries are the same shape apart from their comparison. */
const mockNeighbors = (above: ReturnType<typeof entry>[], below: ReturnType<typeof entry>[]) => {
  vi.mocked(getDocs).mockImplementation(async (built: any) =>
    ({ docs: built?.filter?.op === ">" ? above : below }) as any
  );
};

const mockOwnEntry = (score: number | null) => {
  vi.mocked(getDoc).mockResolvedValue({
    exists: () => score !== null,
    data: () => ({ score }),
  } as any);
};

describe("getExerciseRankNeighbors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(where).mockImplementation(((_field: string, op: string) => ({ op })) as any);
  });

  it("returns the players above and below with their own places", async () => {
    mockCounts({ above: 2, total: 9 });
    mockNeighbors(
      [entry("kasia", 31_490), entry("piotr", 44_000)],
      [entry("bartek", 18_002), entry("ola", 9_100)]
    );
    mockOwnEntry(21_375);

    const neighbors = await getExerciseRankNeighbors("ex1", 21_375, "me");

    expect(neighbors?.rank).toBe(3);
    // Display order runs top-down, so the closest rival sits last.
    expect(neighbors?.above.map((n) => [n.displayName, n.rank])).toEqual([
      ["piotr", 1],
      ["kasia", 2],
    ]);
    expect(neighbors?.below.map((n) => [n.displayName, n.rank])).toEqual([
      ["bartek", 4],
      ["ola", 5],
    ]);
  });

  it("leaves the player's own entry out of both sides", async () => {
    // A run below the player's standing record: their own entry sits above it.
    mockCounts({ above: 2, total: 9 });
    mockNeighbors([entry("me", 30_000), entry("kasia", 31_490)], [entry("bartek", 18_002)]);
    mockOwnEntry(30_000);

    const neighbors = await getExerciseRankNeighbors("ex1", 21_375, "me");

    expect(neighbors?.rank).toBe(2);
    expect(neighbors?.above.map((n) => n.displayName)).toEqual(["kasia"]);
    expect(neighbors?.above[0].rank).toBe(1);
  });

  it("places a first-ever score with nobody of its own on the board", async () => {
    mockCounts({ above: 1, total: 4 });
    mockNeighbors([entry("kasia", 31_490)], []);
    mockOwnEntry(null);

    const neighbors = await getExerciseRankNeighbors("ex1", 21_375, "me");

    expect(neighbors?.rank).toBe(2);
    expect(neighbors?.below).toEqual([]);
  });

  it("reports the top spot with nothing left to chase", async () => {
    mockCounts({ above: 0, total: 12 });
    mockNeighbors([], [entry("kasia", 31_490)]);
    mockOwnEntry(40_000);

    const neighbors = await getExerciseRankNeighbors("ex1", 40_000, "me");

    expect(neighbors?.rank).toBe(1);
    expect(neighbors?.above).toEqual([]);
  });

  it("carries the tempo each standing score was set at", async () => {
    mockCounts({ above: 1, total: 5 });
    // The player below set their score before tempo was recorded.
    mockNeighbors([entry("kasia", 31_490, 120)], [entry("bartek", 18_002)]);
    mockOwnEntry(21_375);

    const neighbors = await getExerciseRankNeighbors("ex1", 21_375, "me");

    expect(neighbors?.above[0].bpm).toBe(120);
    expect(neighbors?.below[0].bpm).toBeUndefined();
  });

  it("skips the leaderboard round-trip for an unscored run", async () => {
    expect(await getExerciseRankNeighbors("ex1", 0, "me")).toBeNull();
    expect(getCountFromServer).not.toHaveBeenCalled();
  });

  it("stays silent when the leaderboard can't be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getCountFromServer).mockRejectedValue(new Error("permission-denied"));
    mockNeighbors([], []);
    mockOwnEntry(null);

    expect(await getExerciseRankNeighbors("ex1", 1200, "me")).toBeNull();
  });
});
