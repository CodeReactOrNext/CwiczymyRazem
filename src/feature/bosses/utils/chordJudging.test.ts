import { describe, expect, it } from "vitest";

import { createStrumTally, tonesNeeded } from "./chordJudging";

const tone = (noteKey: string, hit: boolean, grade: 1 | 2 | 3 | null = hit ? 2 : null, perfect = false) => ({
  noteKey,
  hit,
  grade,
  perfect,
});

describe("tonesNeeded", () => {
  it("forgives one tone of a chord of three or more, none of a smaller one", () => {
    expect(tonesNeeded(6)).toBe(5);
    expect(tonesNeeded(3)).toBe(2);
    expect(tonesNeeded(2)).toBe(2);
  });
});

describe("createStrumTally", () => {
  it("settles a clean strum as soon as enough tones are heard, with its best timing", () => {
    const tally = createStrumTally();
    expect(tally.add(tone("0-0-0", true, 1), 0, 4)).toBeNull();
    expect(tally.add(tone("0-0-1", true, 3, true), 0, 4)).toBeNull();
    expect(tally.add(tone("0-0-2", true, 2), 0, 4)).toEqual({ unit: 0, hit: true, grade: 3, perfect: true });
    // The last tone, heard or lost, changes nothing now.
    expect(tally.add(tone("0-0-3", false), 0, 4)).toBeNull();
  });

  it("misses a strum once more tones are lost than it forgives", () => {
    const tally = createStrumTally();
    expect(tally.add(tone("0-0-0", true), 0, 4)).toBeNull();
    expect(tally.add(tone("0-0-1", false), 0, 4)).toBeNull();
    expect(tally.add(tone("0-0-2", false), 0, 4)).toEqual({ unit: 0, hit: false, grade: null, perfect: false });
  });

  it("starts the strum over on the next pass", () => {
    const tally = createStrumTally();
    tally.add(tone("0-0-0", true), 0, 2);
    expect(tally.add(tone("0-0-1", true), 0, 2)?.hit).toBe(true);
    // Same keys again: a new pass of the loop.
    expect(tally.add(tone("0-0-0", false), 0, 2)?.hit).toBe(false);
  });

  it("keeps strums apart", () => {
    const tally = createStrumTally();
    expect(tally.add(tone("0-0-0", true), 0, 2)).toBeNull();
    expect(tally.add(tone("0-1-0", true), 1, 2)).toBeNull();
    expect(tally.add(tone("0-1-1", true), 1, 2)?.unit).toBe(1);
    expect(tally.add(tone("0-0-1", true), 0, 2)?.unit).toBe(0);
  });
});
