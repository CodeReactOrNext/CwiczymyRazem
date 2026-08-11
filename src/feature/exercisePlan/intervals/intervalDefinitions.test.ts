import { describe, expect, it } from "vitest";

import { intervalBySemitones, INTERVALS, intervalsByIds, noteAtInterval, semitonesBetween } from "./intervalDefinitions";

describe("intervalDefinitions", () => {
  it("stays inside one octave, unison and octave excluded", () => {
    for (const interval of INTERVALS) {
      expect(interval.semitones).toBeGreaterThan(0);
      expect(interval.semitones).toBeLessThan(12);
    }
    expect(new Set(INTERVALS.map((i) => i.semitones)).size).toBe(INTERVALS.length);
  });

  it("resolves ids, dropping ones it doesn't know", () => {
    expect(intervalsByIds(["P5", "nope", "m3"]).map((i) => i.id)).toEqual(["P5", "m3"]);
  });

  it("names the interval a semitone distance makes", () => {
    expect(intervalBySemitones(7)?.name).toBe("Perfect 5th");
    expect(intervalBySemitones(19)?.name).toBe("Perfect 5th"); // wraps into the octave
    expect(intervalBySemitones(12)).toBeUndefined(); // octave = the root again
  });

  it("walks up from a root, wrapping past B", () => {
    expect(noteAtInterval("A", 7)).toBe("E");
    expect(noteAtInterval("B", 3)).toBe("D");
    expect(noteAtInterval("C", 4)).toBe("E");
    expect(noteAtInterval("H", 4)).toBe("");
  });

  it("measures the ascending distance between two note names", () => {
    expect(semitonesBetween("A", "E")).toBe(7);
    expect(semitonesBetween("E", "A")).toBe(5); // the other way round is a 4th
    expect(semitonesBetween("C", "H")).toBe(-1);
  });

  it("round-trips every interval through a note name", () => {
    for (const interval of INTERVALS) {
      const target = noteAtInterval("F#", interval.semitones);
      expect(semitonesBetween("F#", target)).toBe(interval.semitones);
    }
  });
});
