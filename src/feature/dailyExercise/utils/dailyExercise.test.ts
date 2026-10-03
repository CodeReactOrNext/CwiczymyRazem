import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import type { DailyExerciseEntry } from "../types/dailyExercise.types";
import {
  canSettleDailyBoard,
  DAILY_EXERCISE_POOL,
  findDailyDayKeyFor,
  getDailyDayKey,
  getDailyExercise,
  getMsUntilNextDailyExercise,
  getSettleableDayKeys,
  isDailyBoardOpen,
  isDailyExerciseCandidate,
  pickDailyWinner,
  rankDailyBoard,
} from "./dailyExercise";

const fakePool = (size: number) =>
  Array.from({ length: size }, (_, i) => ({ id: `ex_${i}` }) as Exercise);

const dayKeys = (from: string, count: number) =>
  Array.from({ length: count }, (_, i) =>
    getDailyDayKey(new Date(Date.parse(`${from}T12:00:00Z`) + i * 86_400_000)),
  );

describe("DAILY_EXERCISE_POOL", () => {
  it("has enough mic-scored exercises to rotate through", () => {
    expect(DAILY_EXERCISE_POOL.length).toBeGreaterThan(10);
  });

  it("only holds exercises scored by pitch detection at a tempo", () => {
    DAILY_EXERCISE_POOL.forEach((exercise) => {
      expect(isDailyExerciseCandidate(exercise)).toBe(true);
      expect(exercise.metronomeSpeed).toBeTruthy();
      expect(exercise.disableMic).toBeFalsy();
      expect(exercise.isPlayalong).toBeFalsy();
    });
  });
});

describe("getDailyExercise", () => {
  it("is the same exercise for the same day", () => {
    expect(getDailyExercise("2026-09-30")?.id).toBe(getDailyExercise("2026-09-30")?.id);
  });

  it("never repeats the previous day's exercise", () => {
    const pool = fakePool(4);
    const keys = dayKeys("2026-01-01", 365);
    for (let i = 1; i < keys.length; i++) {
      expect(getDailyExercise(keys[i], pool)?.id).not.toBe(getDailyExercise(keys[i - 1], pool)?.id);
    }
  });

  it("deals every exercise once per cycle", () => {
    const pool = fakePool(20);
    // 2026-01-07 is day 20_460 since the epoch — a multiple of 20, so a cycle start.
    const cycle = dayKeys("2026-01-07", 20).map((key) => getDailyExercise(key, pool)?.id);
    expect(new Set(cycle).size).toBe(20);
  });

  it("returns null for an empty pool", () => {
    expect(getDailyExercise("2026-09-30", [])).toBeNull();
  });
});

describe("findDailyDayKeyFor", () => {
  const pool = fakePool(10);
  const now = new Date("2026-09-30T00:05:00Z");

  it("matches today's exercise to today", () => {
    const today = getDailyExercise("2026-09-30", pool)!;
    expect(findDailyDayKeyFor(today.id, now, pool)).toBe("2026-09-30");
  });

  it("still credits yesterday's exercise just after midnight", () => {
    const yesterday = getDailyExercise("2026-09-29", pool)!;
    expect(findDailyDayKeyFor(yesterday.id, now, pool)).toBe("2026-09-29");
  });

  it("ignores any other exercise", () => {
    const today = getDailyExercise("2026-09-30", pool)!.id;
    const yesterday = getDailyExercise("2026-09-29", pool)!.id;
    const other = pool.find((ex) => ex.id !== today && ex.id !== yesterday)!;
    expect(findDailyDayKeyFor(other.id, now, pool)).toBeNull();
  });
});

describe("getMsUntilNextDailyExercise", () => {
  it("counts down to the next UTC midnight", () => {
    expect(getMsUntilNextDailyExercise(new Date("2026-09-30T23:00:00Z"))).toBe(3_600_000);
  });
});

const at = (iso: string) => new Date(iso);

describe("isDailyBoardOpen", () => {
  it("takes runs all through its own day", () => {
    expect(isDailyBoardOpen("2026-10-01", at("2026-10-01T00:00:00Z"))).toBe(true);
    expect(isDailyBoardOpen("2026-10-01", at("2026-10-01T23:59:00Z"))).toBe(true);
  });

  it("still takes a session that ran over midnight, for an hour", () => {
    expect(isDailyBoardOpen("2026-10-01", at("2026-10-02T00:45:00Z"))).toBe(true);
  });

  it("closes once the hour after midnight is up", () => {
    expect(isDailyBoardOpen("2026-10-01", at("2026-10-02T01:00:00Z"))).toBe(false);
    expect(isDailyBoardOpen("2026-10-01", at("2026-10-02T14:00:00Z"))).toBe(false);
  });
});

describe("canSettleDailyBoard", () => {
  it("waits for the board to close before it is settled", () => {
    expect(canSettleDailyBoard("2026-10-01", at("2026-10-02T00:30:00Z"))).toBe(false);
    expect(canSettleDailyBoard("2026-10-01", at("2026-10-02T01:00:00Z"))).toBe(true);
  });
});

describe("getSettleableDayKeys", () => {
  it("skips yesterday while its board is still open", () => {
    expect(getSettleableDayKeys(at("2026-10-05T00:30:00Z"))).toEqual(["2026-10-03", "2026-10-02"]);
  });

  it("looks a few days back, newest first", () => {
    expect(getSettleableDayKeys(at("2026-10-05T09:00:00Z"))).toEqual(["2026-10-04", "2026-10-03", "2026-10-02"]);
  });
});

describe("pickDailyWinner", () => {
  const entry = (userId: string, score: number, updatedAt = 0) =>
    ({ userId, score, updatedAt }) as DailyExerciseEntry;

  it("crowns the best score", () => {
    expect(pickDailyWinner([entry("a", 100), entry("b", 300), entry("c", 200)], 3)?.userId).toBe("b");
  });

  it("gives a tie to whoever set the score first", () => {
    expect(pickDailyWinner([entry("late", 300, 20), entry("early", 300, 10)], 2)?.userId).toBe("early");
  });

  it("names no winner on a board nobody else played", () => {
    expect(pickDailyWinner([entry("alone", 900)], 1)).toBeNull();
    expect(pickDailyWinner([], 0)).toBeNull();
  });
});

describe("rankDailyBoard", () => {
  const entry = (userId: string, score: number, updatedAt = 0) =>
    ({ userId, score, updatedAt }) as DailyExerciseEntry;

  it("orders by score, breaking ties by who set the score first", () => {
    const ranked = rankDailyBoard(
      [entry("c", 100), entry("late", 300, 20), entry("b", 200), entry("early", 300, 10)],
      4,
    );
    expect(ranked.map((e) => e.userId)).toEqual(["early", "late", "b", "c"]);
  });

  it("places nobody on a board nobody else played", () => {
    expect(rankDailyBoard([entry("alone", 900)], 1)).toEqual([]);
  });
});
