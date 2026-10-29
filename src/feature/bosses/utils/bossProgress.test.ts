import { describe, expect, it } from "vitest";

import type { BossRecord } from "../types/boss.types";
import { EMPTY_RECORD, isNewRecord, parseRecord, recordRun } from "./bossProgress";

describe("boss records", () => {
  it("keeps the bests, the phase reached on each difficulty, and counts every run", () => {
    let r = recordRun(EMPTY_RECORD, { phase: 4, damage: 1200, score: 1200, difficulty: "normal" });
    expect(r).toEqual({ bestPhase: 4, bestDamage: 1200, bestScore: 1200, reached: { normal: 4 }, runs: 1 });
    r = recordRun(r, { phase: 3, damage: 1500, score: 2250, difficulty: "hard" });
    expect(r).toEqual({
      bestPhase: 4,
      bestDamage: 1500,
      bestScore: 2250,
      reached: { normal: 4, hard: 3 },
      runs: 2,
    });
  });

  it("calls a run a new record only against an earlier one", () => {
    const run = { phase: 2, damage: 100, score: 100, difficulty: "normal" } as const;
    expect(isNewRecord(EMPTY_RECORD, run)).toBe(false);
    const r: BossRecord = { bestPhase: 5, bestDamage: 2000, bestScore: 2000, reached: { normal: 5 }, runs: 3 };
    expect(isNewRecord(r, { ...run, phase: 6 })).toBe(true);
    expect(isNewRecord(r, { ...run, score: 2500 })).toBe(true);
    expect(isNewRecord(r, { ...run, phase: 5, score: 2000 })).toBe(false);
    // Further than ever on hard, though not as far as on normal.
    expect(isNewRecord(r, { ...run, phase: 3, difficulty: "hard" })).toBe(true);
    // Not on easy, only as far as normal already went — from the savepoint normal opened.
    expect(isNewRecord(r, { ...run, phase: 5, difficulty: "easy" })).toBe(false);
    expect(isNewRecord(r, { ...run, phase: 6, difficulty: "easy" })).toBe(true);
  });

  it("reads malformed data as no record", () => {
    expect(parseRecord(null)).toEqual(EMPTY_RECORD);
    expect(parseRecord({ bestPhase: "3", runs: -1 })).toEqual(EMPTY_RECORD);
  });

  it("reads a record from before difficulties as fought on normal", () => {
    expect(parseRecord({ bestPhase: 7.9, bestDamage: 3100, runs: 4, cleared: 9 })).toEqual({
      bestPhase: 7,
      bestDamage: 3100,
      bestScore: 3100,
      reached: { normal: 7 },
      runs: 4,
    });
  });

  it("drops what it can't read from the phases reached", () => {
    expect(
      parseRecord({ bestPhase: 12, bestScore: 9000, reached: { hard: 12, nightmare: 40, easy: "3" }, runs: 2 }).reached,
    ).toEqual({ hard: 12 });
  });
});
