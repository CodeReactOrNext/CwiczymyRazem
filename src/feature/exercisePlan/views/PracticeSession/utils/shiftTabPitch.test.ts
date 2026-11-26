import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { retuneTabPitch, shiftTabPitch } from "./shiftTabPitch";

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

describe("retuneTabPitch", () => {
  const standard = [0, 0, 0, 0, 0, 0];
  const halfStepDown = [-1, -1, -1, -1, -1, -1];
  const dropD = [0, 0, 0, 0, 0, -2];

  it("returns the same measures when the tunings agree", () => {
    expect(retuneTabPitch(measures, standard, standard)).toBe(measures);
    expect(retuneTabPitch(undefined, standard, halfStepDown)).toBeUndefined();
  });

  it("listens a half step lower for a player tuned half a step down", () => {
    const [note, plain] = retuneTabPitch(measures, standard, halfStepDown)[0].beats[0].notes;
    expect(note).toMatchObject({ string: 6, fret: 3, midiNote: 42 });
    expect(plain).toEqual({ string: 5, fret: 2 });
  });

  it("moves only the strings that are retuned", () => {
    const tab: TablatureMeasure[] = [{
      timeSignature: [4, 4],
      beats: [{ duration: 1, notes: [{ string: 6, fret: 0, midiNote: 40 }, { string: 1, fret: 0, midiNote: 64 }] }],
    }];
    const [low, high] = retuneTabPitch(tab, standard, dropD)[0].beats[0].notes;
    expect(low.midiNote).toBe(38);
    expect(high.midiNote).toBe(64);
  });

  it("moves from the tuning the tab is written in", () => {
    const [note] = retuneTabPitch(measures, halfStepDown, standard)[0].beats[0].notes;
    expect(note.midiNote).toBe(44);
  });
});
