import { describe, expect, it } from "vitest";

import type { TablatureMeasure } from "../types/exercise.types";
import { hasTablatureNotes } from "./hasTablatureNotes";

const measure = (
  notes: { string: number; fret: number }[][],
): TablatureMeasure => ({
  timeSignature: [4, 4],
  beats: notes.map((beatNotes) => ({ notes: beatNotes, duration: 0.25 })),
});

describe("hasTablatureNotes", () => {
  it("is false for missing tablature", () => {
    expect(hasTablatureNotes(undefined)).toBe(false);
    expect(hasTablatureNotes(null)).toBe(false);
    expect(hasTablatureNotes([])).toBe(false);
  });

  it("is false for a grid of empty beats", () => {
    expect(hasTablatureNotes([measure([[], [], []]), measure([[], []])])).toBe(
      false,
    );
  });

  it("is true when any beat carries a note", () => {
    expect(
      hasTablatureNotes([
        measure([[], []]),
        measure([[], [{ string: 6, fret: 3 }]]),
      ]),
    ).toBe(true);
  });

  it("survives malformed measures coming back from Firestore", () => {
    const malformed = [
      {} as TablatureMeasure,
      { timeSignature: [4, 4], beats: [{} as never] } as TablatureMeasure,
    ];
    expect(hasTablatureNotes(malformed)).toBe(false);
  });
});
