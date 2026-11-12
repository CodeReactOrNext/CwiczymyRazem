import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { shiftTabPitch } from "./shiftTabPitch";

const measures: TablatureMeasure[] = [{
  timeSignature: [4, 4],
  beats: [
    { duration: 1, notes: [{ string: 6, fret: 3, midiNote: 43 }, { string: 5, fret: 2 }] },
    { duration: 1, notes: [] },
  ],
}];

describe("shiftTabPitch", () => {
  it("returns the same measures when there is nothing to shift", () => {
    expect(shiftTabPitch(measures, 0)).toBe(measures);
    expect(shiftTabPitch(undefined, -1)).toBeUndefined();
  });

  it("moves the real pitch and leaves the frets where they are", () => {
    const [note, plain] = shiftTabPitch(measures, -1)[0].beats[0].notes;
    expect(note).toMatchObject({ string: 6, fret: 3, midiNote: 42 });
    expect(plain).toEqual({ string: 5, fret: 2 });
  });

  it("does not touch the measures it was given", () => {
    shiftTabPitch(measures, 2);
    expect(measures[0].beats[0].notes[0].midiNote).toBe(43);
  });
});
