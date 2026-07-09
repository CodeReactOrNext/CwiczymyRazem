import { describe, expect, it } from "vitest";

import { getFrequencyFromTab } from "./noteUtils";
import {
  getTuningPreset,
  getTuningStrings,
  GUITAR_TUNINGS,
  isStandardTuning,
  STANDARD_TUNING_ID,
} from "./tunings";

describe("tunings", () => {
  it("falls back to standard tuning for an unknown id", () => {
    expect(getTuningPreset("does-not-exist").id).toBe(STANDARD_TUNING_ID);
    expect(getTuningPreset(undefined).id).toBe(STANDARD_TUNING_ID);
  });

  it("flags standard tuning correctly", () => {
    expect(isStandardTuning(STANDARD_TUNING_ID)).toBe(true);
    expect(isStandardTuning(null)).toBe(true);
    expect(isStandardTuning("drop-d")).toBe(false);
  });

  it("every preset offsets exactly 6 strings", () => {
    GUITAR_TUNINGS.forEach(tuning => {
      expect(tuning.offsets).toHaveLength(6);
    });
  });

  it("drop-d only lowers the 6th string by a whole step", () => {
    const dropD = getTuningPreset("drop-d");
    expect(dropD.offsets).toEqual([0, 0, 0, 0, 0, -2]);
  });

  it("builds reference string pitches low-to-high, matching the tuning offsets", () => {
    const standard = getTuningPreset(STANDARD_TUNING_ID);
    const strings = getTuningStrings(standard);
    expect(strings.map(s => s.name)).toEqual(["E2", "A2", "D3", "G3", "B3", "E4"]);

    const dropD = getTuningPreset("drop-d");
    const dropDStrings = getTuningStrings(dropD);
    expect(dropDStrings.map(s => s.name)).toEqual(["D2", "A2", "D3", "G3", "B3", "E4"]);
  });

  it("applies the tuning offset to fretted notes the same way as the open-string reference", () => {
    const dropD = getTuningPreset("drop-d");
    // String 6, fret 0 (open low string) should equal the D2 reference pitch.
    const openLowString = getFrequencyFromTab(6, 0, dropD.offsets);
    const reference = getTuningStrings(dropD).find(s => s.string === 6)!;
    expect(openLowString).toBeCloseTo(reference.hz, 5);
  });

  it("leaves other strings untouched by drop D", () => {
    const dropD = getTuningPreset("drop-d");
    const standardFreq = getFrequencyFromTab(1, 0);
    const dropDFreq = getFrequencyFromTab(1, 0, dropD.offsets);
    expect(dropDFreq).toBeCloseTo(standardFreq, 5);
  });
});
