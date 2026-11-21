import type {
  DuelOverview,
  DuelRankingEntry,
  DuelView,
} from "feature/duels/types/duel.types";
import { describe, expect, it } from "vitest";

import {
  buildDuelSlots,
  eloExamples,
  isFreshDuel,
  parseDuelsTab,
  rankGap,
  rankNeighbours,
  unseenResult,
} from "./duelScreens";

const duel = (over: Partial<DuelView> & { id: string }): DuelView => ({
  exerciseId: "spider",
  status: "finished",
  createdAt: 0,
  endsAt: 1_000,
  settledAt: 1_000,
  me: {
    attempts: 1,
    isReady: false,
    bestScore: 100,
    bestAccuracy: 90,
    bestBpm: 120,
    ratingBefore: 1000,
    ratingAfter: 1010,
  },
  opponent: { revealed: false, attempts: 1, isReady: false },
  result: "won",
  ratingDelta: 10,
  ...over,
});

const entry = (userId: string, rating: number): DuelRankingEntry => ({
  userId,
  displayName: userId,
  avatar: "",
  lvl: 1,
  rating,
  wins: 1,
  losses: 0,
  draws: 0,
});

const ladder = [
  entry("a", 1400),
  entry("b", 1300),
  entry("me", 1200),
  entry("c", 1100),
  entry("d", 1000),
];

const overview = (over: Partial<DuelOverview> = {}): DuelOverview => ({
  rating: 1200,
  isRated: true,
  rank: 3,
  played: 5,
  wins: 3,
  losses: 2,
  draws: 0,
  tickets: [],
  active: [],
  recent: [],
  ranking: ladder,
  rankedPlayers: 5,
  feed: [],
  waitingOthers: 0,
  liveDuels: 0,
  ...over,
});

describe("parseDuelsTab", () => {
  it("reads the known tabs and falls back to duels", () => {
    expect(parseDuelsTab("ranking")).toBe("ranking");
    expect(parseDuelsTab("history")).toBe("history");
    expect(parseDuelsTab("nope")).toBe("duels");
    expect(parseDuelsTab(undefined)).toBe("duels");
    expect(parseDuelsTab(["ranking"])).toBe("duels");
  });
});

describe("buildDuelSlots", () => {
  it("puts running duels first (ending soonest), then tickets, then free places", () => {
    const later = duel({ id: "later", status: "active", endsAt: 9_000 });
    const sooner = duel({ id: "sooner", status: "active", endsAt: 5_000 });
    const slots = buildDuelSlots({ active: [later, sooner], tickets: [] }, 3);
    expect(
      slots.map((s) => (s.kind === "active" ? s.duel.id : s.kind)),
    ).toEqual(["sooner", "later", "free"]);

    const withTicket = buildDuelSlots(
      {
        active: [sooner],
        tickets: [{ id: "t1", createdAt: 0, expiresAt: 10 }],
      },
      3,
    );
    expect(withTicket.map((s) => s.kind)).toEqual([
      "active",
      "searching",
      "free",
    ]);
  });

  it("never draws a negative number of free places", () => {
    const active = ["a", "b", "c", "d"].map((id) =>
      duel({ id, status: "active" }),
    );
    expect(buildDuelSlots({ active, tickets: [] }, 3)).toHaveLength(4);
  });
});

describe("isFreshDuel", () => {
  it("is new only right after pairing, before anyone plays", () => {
    const fresh = duel({
      id: "n",
      status: "active",
      createdAt: 0,
      me: { ...duel({ id: "x" }).me, attempts: 0 },
      opponent: { revealed: false, attempts: 0, isReady: false },
    });
    expect(isFreshDuel(fresh, 60_000)).toBe(true);
    expect(isFreshDuel(fresh, 60 * 60_000)).toBe(false);
    expect(
      isFreshDuel(
        {
          ...fresh,
          opponent: { revealed: false, attempts: 1, isReady: false },
        },
        60_000,
      ),
    ).toBe(false);
  });
});

describe("unseenResult", () => {
  it("picks the newest settled duel not shown yet", () => {
    const old = duel({ id: "old", settledAt: 2_000 });
    const fresh = duel({ id: "fresh", settledAt: 3_000 });
    expect(unseenResult([old, fresh], { since: 0, ids: [] })?.id).toBe("fresh");
    expect(unseenResult([old, fresh], { since: 0, ids: ["fresh"] })?.id).toBe(
      "old",
    );
  });

  it("skips void duels, running ones and anything settled before `since`", () => {
    const voided = duel({ id: "void", result: "void", settledAt: 5_000 });
    const running = duel({ id: "run", status: "active", result: null });
    const before = duel({ id: "before", settledAt: 100 });
    expect(
      unseenResult([voided, running, before], { since: 1_000, ids: [] }),
    ).toBeNull();
  });
});

describe("rankGap", () => {
  it("is the rating that beats the player one place up", () => {
    expect(rankGap(overview())).toEqual({ place: 2, points: 101 });
  });

  it("is at least one point on a tie", () => {
    expect(
      rankGap(
        overview({ ranking: [entry("a", 1200), entry("me", 1200)], rank: 2 }),
      ),
    ).toEqual({ place: 1, points: 1 });
  });

  it("is null at the top, unranked, or past the listed places", () => {
    expect(rankGap(overview({ rank: 1 }))).toBeNull();
    expect(rankGap(overview({ isRated: false, rank: null }))).toBeNull();
    expect(rankGap(overview({ rank: 40 }))).toBeNull();
  });
});

describe("rankNeighbours", () => {
  const me = { displayName: "Me", avatar: "" };

  it("shows the places around a listed player", () => {
    const rows = rankNeighbours(overview(), "me", me);
    expect(rows.map((r) => r.place)).toEqual([2, 3, 4]);
    expect(rows.find((r) => r.isMe)?.key).toBe("me");
  });

  it("keeps three rows when the player is first or last", () => {
    expect(
      rankNeighbours(overview({ rank: 1 }), "a", me).map((r) => r.place),
    ).toEqual([1, 2, 3]);
    expect(
      rankNeighbours(overview({ rank: 5 }), "d", me).map((r) => r.place),
    ).toEqual([3, 4, 5]);
  });

  it("puts a player below the list under its last row", () => {
    const rows = rankNeighbours(
      overview({ rank: 30, rating: 900 }),
      "someone-else",
      me,
    );
    expect(rows.map((r) => [r.place, r.isMe])).toEqual([
      [5, false],
      [30, true],
    ]);
  });

  it("shows the top three to an unranked player", () => {
    const rows = rankNeighbours(
      overview({ isRated: false, rank: null }),
      "nobody",
      me,
    );
    expect(rows.map((r) => r.place)).toEqual([1, 2, 3]);
  });
});

describe("eloExamples", () => {
  it("matches the rating formula past the provisional duels", () => {
    expect(eloExamples(1100)).toEqual([
      { opponent: 1300, strength: "stronger", win: 15, draw: 5, loss: -5 },
      { opponent: 1100, strength: "equal", win: 10, draw: 0, loss: -10 },
      { opponent: 900, strength: "weaker", win: 5, draw: -5, loss: -15 },
    ]);
  });
});
