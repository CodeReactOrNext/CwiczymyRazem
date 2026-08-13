import { describe, expect, it } from "vitest";

import {
  clampRecordBpm,
  isRecordRunClean,
  nextRecordTarget,
  RECORD_MAX_BPM,
  RECORD_MIN_BPM,
  RECORD_PASS_ACCURACY,
  stepRecordBpm,
} from "./scaleTreeRecords";

describe("record runs", () => {
  it("starts above the tempo the tree itself asks for", () => {
    expect(RECORD_MIN_BPM).toBeGreaterThan(95);
    expect(nextRecordTarget(null)).toBe(RECORD_MIN_BPM);
    expect(nextRecordTarget(0)).toBe(RECORD_MIN_BPM);
  });

  it("opens one step past the current record", () => {
    expect(nextRecordTarget(120)).toBe(125);
  });

  it("never opens below the floor, even after a slow record", () => {
    expect(nextRecordTarget(60)).toBe(RECORD_MIN_BPM);
  });

  it("keeps the stepper inside its range", () => {
    expect(stepRecordBpm(RECORD_MIN_BPM, -1)).toBe(RECORD_MIN_BPM);
    expect(stepRecordBpm(RECORD_MAX_BPM, 1)).toBe(RECORD_MAX_BPM);
    expect(stepRecordBpm(150, 1)).toBe(155);
    expect(stepRecordBpm(150, -1)).toBe(145);
    expect(clampRecordBpm(10)).toBe(RECORD_MIN_BPM);
  });

  it("only counts a clean run", () => {
    expect(isRecordRunClean(RECORD_PASS_ACCURACY)).toBe(true);
    expect(isRecordRunClean(100)).toBe(true);
    expect(isRecordRunClean(RECORD_PASS_ACCURACY - 1)).toBe(false);
    expect(isRecordRunClean(0)).toBe(false);
  });
});
