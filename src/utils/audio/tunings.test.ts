import { describe, expect, it } from "vitest";

import { getFrequencyFromTab } from "./noteUtils";
import {
  findNearestTuningString,
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

describe("findNearestTuningString", () => {
  const standardStrings = getTuningStrings(getTuningPreset(STANDARD_TUNING_ID));
  const dropDStrings = getTuningStrings(getTuningPreset("drop-d"));

  it("reads a perfectly tuned string as that string at 0 cents", () => {
    standardStrings.forEach((str, index) => {
      const nearest = findNearestTuningString(str.hz, standardStrings);
      expect(nearest.index).toBe(index);
      expect(nearest.cents).toBeCloseTo(0, 5);
    });
  });

  it("targets the tuning's own reference, not the standard one", () => {
    const lowD = dropDStrings[0]; // D2 in drop D
    expect(findNearestTuningString(lowD.hz, dropDStrings)).toMatchObject({ index: 0 });
    expect(findNearestTuningString(lowD.hz, dropDStrings).cents).toBeCloseTo(0, 5);

    // The same pitch under standard tuning is the 6th string, 200¢ flat of E2.
    const underStandard = findNearestTuningString(lowD.hz, standardStrings);
    expect(underStandard.index).toBe(0);
    expect(underStandard.cents).toBeCloseTo(-200, 1);
  });

  it("signs the deviation: sharp positive, flat negative", () => {
    const a2 = standardStrings[1];
    expect(findNearestTuningString(a2.hz * 1.01, standardStrings).cents).toBeGreaterThan(0);
    expect(findNearestTuningString(a2.hz * 0.99, standardStrings).cents).toBeLessThan(0);
  });

  it("keeps a 2nd-harmonic reading on the low string it belongs to", () => {
    const lowE = standardStrings[0]; // E2
    const nearest = findNearestTuningString(lowE.hz * 2, standardStrings); // detector locked onto E3
    expect(nearest.index).toBe(0);
    expect(nearest.cents).toBeCloseTo(0, 5);
  });

  it("does not confuse the high E string with the low one", () => {
    const highE = standardStrings[5]; // E4
    expect(findNearestTuningString(highE.hz, standardStrings).index).toBe(5);
  });
});
