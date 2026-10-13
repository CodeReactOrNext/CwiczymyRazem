import type {
  DuelDoc,
  DuelPlayer,
  DuelTicket,
} from "feature/duels/types/duel.types";
import { describe, expect, it } from "vitest";

import {
  canOpenDuel,
  DUEL_MAX_OPEN,
  DUEL_MIN_LVL,
  DUEL_MIN_RATING,
  DUEL_RECENT_LIMIT,
  DUEL_START_RATING,
  DUEL_SUBMIT_GRACE_MS,
  expectedScore,
  isDuelOpenForRuns,
  kFactor,
  nextRating,
  openDuelCount,
  pickOpponentTicket,
  pushRecent,
  resolveDuelOutcome,
  settledProfileUpdate,
  settleDuel,
  toDuelView,
} from "./duelRules";

const player = (
  userId: string,
  patch: Partial<DuelPlayer> = {},
): DuelPlayer => ({
  userId,
  displayName: userId.toUpperCase(),
  avatar: "",
  lvl: 10,
  ratingBefore: DUEL_START_RATING,
  playedBefore: 0,
  bestScore: 0,
  bestAccuracy: 0,
  bestBpm: null,
  attempts: 0,
  lastAttemptAt: null,
  ...patch,
});

const duel = (
  a: Partial<DuelPlayer>,
  b: Partial<DuelPlayer>,
  patch: Partial<DuelDoc> = {},
): DuelDoc => ({
  id: "d1",
  exerciseId: "chicken_pickin",
  status: "active",
  createdAt: 0,
  endsAt: 1000,
  playerIds: ["a", "b"],
  players: { a: player("a", a), b: player("b", b) },
  ...patch,
});

describe("ELO", () => {
  it("gives equal ratings an even chance", () => {
    expect(expectedScore(1200, 1200)).toBe(0.5);
    expect(expectedScore(1400, 1000)).toBeCloseTo(0.909, 3);
  });

  it("moves new players faster", () => {
    expect(kFactor(0)).toBeGreaterThan(kFactor(50));
  });

  it("is zero-sum between equals on the same K", () => {
    const winner = nextRating(1000, 20, 1000, 1);
    const loser = nextRating(1000, 20, 1000, 0);
    expect(winner - 1000).toBe(1000 - loser);
    expect(nextRating(1000, 20, 1000, 0.5)).toBe(1000);
  });

  it("pays more for beating a stronger player", () => {
    const upset = nextRating(1000, 20, 1400, 1) - 1000;
    const expected = nextRating(1400, 20, 1000, 1) - 1400;
    expect(upset).toBeGreaterThan(expected);
  });

  it("never drops below the floor", () => {
    expect(nextRating(DUEL_MIN_RATING, 0, 2000, 0)).toBe(DUEL_MIN_RATING);
  });
});

describe("resolveDuelOutcome", () => {
  it("is void when nobody played", () => {
    expect(resolveDuelOutcome(duel({}, {}))).toEqual({
      kind: "void",
      winnerId: null,
    });
  });

  it("hands a walkover to whoever showed up, whatever they scored", () => {
    expect(resolveDuelOutcome(duel({ attempts: 1, bestScore: 5 }, {}))).toEqual(
      {
        kind: "walkover",
        winnerId: "a",
      },
    );
  });

  it("compares best scores when both played", () => {
    expect(
      resolveDuelOutcome(
        duel({ attempts: 3, bestScore: 800 }, { attempts: 1, bestScore: 900 }),
      ),
    ).toEqual({ kind: "win", winnerId: "b" });
  });

  it("calls an equal best score a draw, however many tries it took", () => {
    expect(
      resolveDuelOutcome(
        duel({ attempts: 9, bestScore: 700 }, { attempts: 1, bestScore: 700 }),
      ),
    ).toEqual({ kind: "draw", winnerId: null });
  });
});

describe("settleDuel", () => {
  it("moves both ratings from where they stand now", () => {
    const settlement = settleDuel(
      duel({ attempts: 2, bestScore: 900 }, { attempts: 2, bestScore: 400 }),
      { a: { rating: 1100, played: 30 }, b: { rating: 1100, played: 30 } },
    );
    expect(settlement.players.a).toEqual({
      result: "won",
      ratingBefore: 1100,
      ratingAfter: 1110,
    });
    expect(settlement.players.b).toEqual({
      result: "lost",
      ratingBefore: 1100,
      ratingAfter: 1090,
    });
  });

  it("starts an unrated player at the starting rating", () => {
    const settlement = settleDuel(duel({ attempts: 1, bestScore: 1 }, {}), {});
    expect(settlement.players.a.ratingBefore).toBe(DUEL_START_RATING);
    expect(settlement.players.a.ratingAfter).toBeGreaterThan(DUEL_START_RATING);
    expect(settlement.players.b.result).toBe("lost");
  });

  it("leaves both ratings alone on a void duel", () => {
    const settlement = settleDuel(duel({}, {}), {
      a: { rating: 1234, played: 3 },
    });
    expect(settlement.players.a).toEqual({
      result: "void",
      ratingBefore: 1234,
      ratingAfter: 1234,
    });
  });
});

describe("open duels", () => {
  const now = 10_000;
  const ticket = (id: string, expiresAt: number) => ({
    id,
    createdAt: 0,
    expiresAt,
  });

  it("counts live tickets and running duels against the limit", () => {
    const profile = {
      tickets: [ticket("t1", now + 1), ticket("t2", now - 1)],
      active: [{ duelId: "d1", opponentId: "x", endsAt: now + 5 }],
    };
    expect(openDuelCount(profile, now)).toBe(2);
    expect(canOpenDuel(profile, now)).toBe(true);
    expect(DUEL_MAX_OPEN).toBe(3);
    expect(
      canOpenDuel(
        { ...profile, tickets: [ticket("t1", now + 1), ticket("t3", now + 1)] },
        now,
      ),
    ).toBe(false);
    expect(canOpenDuel(null, now)).toBe(true);
  });
});

describe("pickOpponentTicket", () => {
  const now = 100;
  const t = (
    id: string,
    userId: string,
    createdAt: number,
    expiresAt = 1000,
  ): DuelTicket => ({
    id,
    userId,
    createdAt,
    expiresAt,
  });

  it("takes the oldest ticket of somebody else", () => {
    const waiting = [t("2", "c", 20), t("1", "me", 5), t("3", "b", 10)];
    expect(pickOpponentTicket(waiting, "me", new Set(), now)?.id).toBe("3");
  });

  it("skips expired tickets and players already in a duel with you", () => {
    const waiting = [t("1", "b", 1, 50), t("2", "c", 2), t("3", "d", 3)];
    expect(pickOpponentTicket(waiting, "me", new Set(["c"]), now)?.id).toBe(
      "3",
    );
  });

  it("finds nobody in an empty or self-only queue", () => {
    expect(pickOpponentTicket([], "me", new Set(), now)).toBeNull();
    expect(
      pickOpponentTicket([t("1", "me", 1)], "me", new Set(), now),
    ).toBeNull();
  });
});

describe("profile bookkeeping", () => {
  it("keeps the recent list newest first, unique and capped", () => {
    const ids = Array.from({ length: DUEL_RECENT_LIMIT }, (_, i) => `d${i}`);
    const next = pushRecent(ids, "d5");
    expect(next[0]).toBe("d5");
    expect(new Set(next).size).toBe(next.length);
    expect(pushRecent(ids, "new")).toHaveLength(DUEL_RECENT_LIMIT);
  });

  it("books a result and closes the duel on the profile", () => {
    const update = settledProfileUpdate(
      {
        played: 2,
        wins: 1,
        losses: 1,
        draws: 0,
        active: [
          { duelId: "d1", opponentId: "b", endsAt: 0 },
          { duelId: "d2", opponentId: "c", endsAt: 0 },
        ],
        recentDuelIds: [],
      },
      "d1",
      { result: "won", ratingBefore: 1000, ratingAfter: 1016 },
      5,
    );
    expect(update).toMatchObject({
      rating: 1016,
      played: 3,
      wins: 2,
      losses: 1,
      draws: 0,
      recentDuelIds: ["d1"],
    });
    expect(update.active).toEqual([
      { duelId: "d2", opponentId: "c", endsAt: 0 },
    ]);
  });

  it("does not count a void duel as played", () => {
    const update = settledProfileUpdate(
      {
        played: 2,
        wins: 1,
        losses: 1,
        draws: 0,
        active: [],
        recentDuelIds: [],
      },
      "d1",
      { result: "void", ratingBefore: 1000, ratingAfter: 1000 },
      5,
    );
    expect(update.played).toBeUndefined();
    expect(update.rating).toBeUndefined();
    expect(update.recentDuelIds).toEqual(["d1"]);
  });
});

describe("toDuelView", () => {
  it("shows only the opponent's attempts while the duel runs", () => {
    const view = toDuelView(
      duel({ attempts: 1, bestScore: 300 }, { attempts: 4, bestScore: 999 }),
      "a",
    )!;
    expect(view.opponent).toEqual({ revealed: false, attempts: 4 });
    expect(view.me.bestScore).toBe(300);
    expect(view.result).toBeNull();
    expect(JSON.stringify(view)).not.toContain("999");
    expect(JSON.stringify(view)).not.toContain('B"');
  });

  it("reveals everything once settled", () => {
    const settled = duel(
      { attempts: 1, bestScore: 300, ratingAfter: 984 },
      { attempts: 4, bestScore: 999, ratingAfter: 1016 },
      {
        status: "finished",
        outcome: { kind: "win", winnerId: "b", settledAt: 2000 },
      },
    );
    const view = toDuelView(settled, "a")!;
    expect(view.result).toBe("lost");
    expect(view.ratingDelta).toBe(-16);
    expect(view.opponent).toMatchObject({
      revealed: true,
      displayName: "B",
      bestScore: 999,
    });
  });

  it("returns nothing to somebody outside the duel", () => {
    expect(toDuelView(duel({}, {}), "zz")).toBeNull();
  });
});

describe("isDuelOpenForRuns", () => {
  it("takes runs until the grace after the deadline runs out", () => {
    const d = { status: "active" as const, endsAt: 1000 };
    expect(isDuelOpenForRuns(d, 999)).toBe(true);
    expect(isDuelOpenForRuns(d, 1000 + DUEL_SUBMIT_GRACE_MS - 1)).toBe(true);
    expect(isDuelOpenForRuns(d, 1000 + DUEL_SUBMIT_GRACE_MS)).toBe(false);
    expect(isDuelOpenForRuns({ status: "finished", endsAt: 1000 }, 0)).toBe(
      false,
    );
  });
});

describe("DUEL_MIN_LVL", () => {
  it("opens at level 4", () => {
    expect(DUEL_MIN_LVL).toBe(4);
  });
});
