import { describe, expect, it } from "vitest";

import { getFrequencyFromTab } from "./noteUtils";
import {
  BASS_STANDARD_TUNING_ID,
  BASS_TUNINGS,
  FILE_TUNING_ID,
  findNearestTuningString,
  getFileTuning,
  getStandardTuningId,
  getTuningPreset,
  getTuningsFor,
  getTuningShiftFrom,
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

describe("bass tunings", () => {
  it("reads a standard bass's open strings an octave under the guitar's four lowest", () => {
    const standard = getTuningPreset(BASS_STANDARD_TUNING_ID);
    expect(standard.instrument).toBe("bass");
    expect(standard.stringCount).toBe(4);
    expect(getTuningStrings(standard).map(s => s.name)).toEqual(["E1", "A1", "D2", "G2"]);
  });

  it("turns a string + fret into the bass's pitch through the same offsets", () => {
    const standard = getTuningPreset(BASS_STANDARD_TUNING_ID);
    // String 4 (E1), fret 5 = A1; string 1 (G2), fret 12 = G3.
    expect(getFrequencyFromTab(4, 5, standard.offsets)).toBeCloseTo(55, 3);
    expect(getFrequencyFromTab(1, 12, standard.offsets)).toBeCloseTo(196, 2);
  });

  it("gives a five-string its low B as string 5", () => {
    const five = getTuningPreset("bass-5-standard");
    expect(five.stringCount).toBe(5);
    expect(getTuningStrings(five)[0]).toMatchObject({ string: 5, name: "B0" });
  });

  it("keeps every preset at six offsets and the strings it doesn't have at zero", () => {
    BASS_TUNINGS.forEach(tuning => {
      expect(tuning.offsets).toHaveLength(6);
      tuning.offsets.slice(tuning.stringCount).forEach(offset => expect(offset).toBe(0));
    });
  });

  it("lists and defaults per instrument", () => {
    expect(getTuningsFor("guitar")).toBe(GUITAR_TUNINGS);
    expect(getTuningsFor("bass")).toBe(BASS_TUNINGS);
    expect(getStandardTuningId("bass")).toBe(BASS_STANDARD_TUNING_ID);
    expect(isStandardTuning(BASS_STANDARD_TUNING_ID)).toBe(true);
    expect(isStandardTuning("bass-drop-d")).toBe(false);
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

describe("file tunings", () => {
  const STANDARD = [64, 59, 55, 50, 45, 40];
  const HALF_DOWN = STANDARD.map(midi => midi - 1);
  const DROP_D = [64, 59, 55, 50, 45, 38];

  it("recognises a file's tuning as the matching preset", () => {
    expect(getFileTuning(STANDARD, "guitar")?.id).toBe(STANDARD_TUNING_ID);
    expect(getFileTuning(HALF_DOWN, "guitar")?.id).toBe("half-step-down");
    expect(getFileTuning(DROP_D, "guitar")?.id).toBe("drop-d");
    expect(getFileTuning([43, 38, 33, 28], "bass")?.id).toBe(BASS_STANDARD_TUNING_ID);
    expect(getFileTuning([43, 38, 33, 28, 23], "bass")?.id).toBe("bass-5-standard");
  });

  it("describes a tuning no preset covers, low string first", () => {
    const tuning = getFileTuning([64, 59, 56, 52, 47, 40], "guitar");
    expect(tuning?.id).toBe(FILE_TUNING_ID);
    expect(tuning?.notation).toBe("E B E Ab B E");
    expect(tuning?.offsets).toEqual([0, 0, 1, 2, 2, 0]);
    expect(getFileTuning([65, 60, 56, 51, 46, 41], "guitar")?.notation).toBe("F Bb Eb Ab C F");
  });

  it("gives up on a track with no tuning or too many strings", () => {
    expect(getFileTuning(undefined, "guitar")).toBeNull();
    expect(getFileTuning([], "guitar")).toBeNull();
    expect(getFileTuning([64, 59, 55, 50, 45, 40, 35], "guitar")).toBeNull();
  });

  it("measures a whole-instrument shift between two tunings", () => {
    const standard = getTuningPreset(STANDARD_TUNING_ID);
    expect(getTuningShiftFrom(standard, standard)).toBe(0);
    expect(getTuningShiftFrom(standard, getTuningPreset("half-step-down"))).toBe(-1);
    expect(getTuningShiftFrom(getTuningPreset("half-step-down"), standard)).toBe(1);
    expect(getTuningShiftFrom(standard, getTuningPreset("whole-step-down"))).toBe(-2);
    expect(getTuningShiftFrom(getTuningPreset("drop-d"), getTuningPreset("drop-c"))).toBe(-2);
  });

  it("has no shift when single strings differ or the instruments do", () => {
    const standard = getTuningPreset(STANDARD_TUNING_ID);
    expect(getTuningShiftFrom(standard, getTuningPreset("drop-d"))).toBeNull();
    expect(getTuningShiftFrom(standard, getTuningPreset("open-g"))).toBeNull();
    expect(getTuningShiftFrom(standard, getTuningPreset(BASS_STANDARD_TUNING_ID))).toBeNull();
    expect(getTuningShiftFrom(getTuningPreset(BASS_STANDARD_TUNING_ID), getTuningPreset("bass-5-standard"))).toBeNull();
    expect(getTuningShiftFrom(getTuningPreset(BASS_STANDARD_TUNING_ID), getTuningPreset("bass-half-step-down"))).toBe(-1);
  });
});
