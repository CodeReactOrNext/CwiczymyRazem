import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  DAILY_EXERCISE_POOL,
  findDailyDayKeyFor,
  getDailyDayKey,
  getDailyExercise,
  getMsUntilNextDailyExercise,
  isDailyExerciseCandidate,
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
