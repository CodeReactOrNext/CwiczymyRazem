import { describe, expect, it } from "vitest";

import { EMPTY_RECORD, isNewRecord, parseRecord, recordRun } from "./bossProgress";

describe("boss records", () => {
  it("keeps the best phase and damage and counts every run", () => {
    let r = recordRun(EMPTY_RECORD, { phase: 4, damage: 1200 });
    expect(r).toEqual({ bestPhase: 4, bestDamage: 1200, runs: 1 });
    r = recordRun(r, { phase: 3, damage: 1500 });
    expect(r).toEqual({ bestPhase: 4, bestDamage: 1500, runs: 2 });
  });

  it("calls a run a new record only against an earlier one", () => {
    expect(isNewRecord(EMPTY_RECORD, { phase: 2, damage: 100 })).toBe(false);
    const r = { bestPhase: 5, bestDamage: 2000, runs: 3 };
    expect(isNewRecord(r, { phase: 6, damage: 10 })).toBe(true);
    expect(isNewRecord(r, { phase: 2, damage: 2500 })).toBe(true);
    expect(isNewRecord(r, { phase: 5, damage: 2000 })).toBe(false);
  });

  it("reads malformed data as no record", () => {
    expect(parseRecord(null)).toEqual(EMPTY_RECORD);
    expect(parseRecord({ bestPhase: "3", runs: -1 })).toEqual(EMPTY_RECORD);
    expect(parseRecord({ bestPhase: 7.9, bestDamage: 3100, runs: 4, cleared: 9 })).toEqual({
      bestPhase: 7,
      bestDamage: 3100,
      runs: 4,
    });
  });
});
