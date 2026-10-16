import { DUEL_POOL } from "feature/duels/data/duelPool";
import type { DuelDoc, DuelPlayer } from "feature/duels/types/duel.types";
import { describe, expect, it } from "vitest";

import { buildDuelResultLog, duelResultLogId } from "./duelResultLog";

const SETTLED_AT = Date.parse("2026-10-16T12:00:00.000Z");

const player = (
  userId: string,
  patch: Partial<DuelPlayer> = {},
): DuelPlayer => ({
  userId,
  displayName: userId.toUpperCase(),
  avatar: `${userId}.png`,
  lvl: 10,
  ratingBefore: 1000,
  playedBefore: 0,
  bestScore: 0,
  bestAccuracy: 0,
  bestBpm: null,
  attempts: 0,
  lastAttemptAt: null,
  ...patch,
});

const settled = (
  a: Partial<DuelPlayer>,
  b: Partial<DuelPlayer>,
  outcome: { kind: "win" | "draw" | "walkover" | "void"; winnerId: string | null },
  patch: Partial<DuelDoc> = {},
): DuelDoc => ({
  id: "d1",
  exerciseId: DUEL_POOL[0].id,
  status: "finished",
  createdAt: 0,
  endsAt: 1000,
  playerIds: ["a", "b"],
  players: { a: player("a", a), b: player("b", b) },
  outcome: { ...outcome, settledAt: SETTLED_AT },
  ...patch,
});

describe("duelResultLogId", () => {
  it("is the duel's own id, so a second write lands on the same row", () => {
    expect(duelResultLogId("d1")).toBe("duel-result-d1");
  });
});

describe("buildDuelResultLog", () => {
  it("names the winner first with both scores and rating moves", () => {
    const row = buildDuelResultLog(
      settled(
        { attempts: 1, bestScore: 300, ratingAfter: 984 },
        { attempts: 4, bestScore: 999, ratingAfter: 1016 },
        { kind: "win", winnerId: "b" },
      ),
    )!;

    expect(row).toMatchObject({
      type: "duel_result",
      duelId: "d1",
      kind: "win",
      exerciseId: DUEL_POOL[0].id,
      exerciseTitle: DUEL_POOL[0].title,
      data: "2026-10-16T12:00:00.000Z",
      timestamp: "2026-10-16T12:00:00.000Z",
    });
    expect(row.players).toEqual([
      {
        userId: "b",
        displayName: "B",
        avatar: "b.png",
        bestScore: 999,
        ratingBefore: 1000,
        ratingAfter: 1016,
      },
      {
        userId: "a",
        displayName: "A",
        avatar: "a.png",
        bestScore: 300,
        ratingBefore: 1000,
        ratingAfter: 984,
      },
    ]);
  });

  it("reports a walkover as a win for whoever played", () => {
    const row = buildDuelResultLog(
      settled(
        { attempts: 0, ratingAfter: 984 },
        { attempts: 2, bestScore: 500, ratingAfter: 1016 },
        { kind: "walkover", winnerId: "b" },
      ),
    )!;

    expect(row.kind).toBe("walkover");
    expect(row.players.map((side) => side.userId)).toEqual(["b", "a"]);
  });

  it("keeps the pairing order on a draw", () => {
    const row = buildDuelResultLog(
      settled(
        { attempts: 1, bestScore: 400 },
        { attempts: 1, bestScore: 400 },
        { kind: "draw", winnerId: null },
      ),
    )!;

    expect(row.kind).toBe("draw");
    expect(row.players.map((side) => side.userId)).toEqual(["a", "b"]);
  });

  it("leaves no row for a duel nobody played", () => {
    expect(
      buildDuelResultLog(settled({}, {}, { kind: "void", winnerId: null })),
    ).toBeNull();
  });

  it("leaves no row for a duel still running", () => {
    expect(
      buildDuelResultLog(
        settled(
          { attempts: 1, bestScore: 1 },
          { attempts: 1, bestScore: 2 },
          { kind: "win", winnerId: "b" },
          { status: "active", outcome: undefined },
        ),
      ),
    ).toBeNull();
  });

  it("falls back to the exercise id when the pool no longer has it", () => {
    const row = buildDuelResultLog(
      settled(
        { attempts: 1, bestScore: 1 },
        { attempts: 1, bestScore: 2 },
        { kind: "win", winnerId: "b" },
        { exerciseId: "retired_exercise" },
      ),
    )!;

    expect(row.exerciseTitle).toBe("retired_exercise");
  });
});
