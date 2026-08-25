import { describe, expect, it } from "vitest";

import {
  beatOffsetsInQuarters,
  restBeatsAt,
  setBeatsDuration,
  splitIntoNotatableDurations,
  startsCountedBeat,
} from "./beatDuration";
import { beatsDurationInQuarters } from "./measureDuration";
import { createMeasure } from "./measureGrid";

/** A 4/4 bar of sixteenths with a fret on string 1 of every beat. */
const filledBar = (steps = 16) => {
  const measure = createMeasure([4, 4], steps);
  return {
    ...measure,
    beats: measure.beats.map((beat, i) => ({
      ...beat,
      notes: [{ string: 1, fret: i }],
    })),
  };
};

describe("splitIntoNotatableDurations", () => {
  it("returns a single note value untouched", () => {
    expect(splitIntoNotatableDurations(2)).toEqual([2]);
    expect(splitIntoNotatableDurations(0.75)).toEqual([0.75]);
  });

  it("cuts an odd gap into notatable pieces", () => {
    expect(splitIntoNotatableDurations(1.25)).toEqual([1, 0.25]);
    expect(splitIntoNotatableDurations(2.5)).toEqual([2, 0.5]);
  });

  it("keeps a value nothing can express whole", () => {
    // A third of a beat (triplet grid) — splitting it would leave 1/12 over.
    expect(splitIntoNotatableDurations(1 / 3)).toEqual([1 / 3]);
  });

  it("returns nothing for an empty gap", () => {
    expect(splitIntoNotatableDurations(0)).toEqual([]);
  });
});

describe("setBeatsDuration", () => {
  it("swallows the following beats when a note grows", () => {
    const next = setBeatsDuration(filledBar(), [0], 1);

    expect(next.beats[0].duration).toBe(1);
    expect(next.beats[0].notes[0].fret).toBe(0);
    expect(next.beats).toHaveLength(13);
    expect(beatsDurationInQuarters(next.beats)).toBeCloseTo(4);
  });

  it("leaves a rest behind when a note shrinks", () => {
    const bar = setBeatsDuration(filledBar(4), [0], 0.25);

    expect(bar.beats[0].duration).toBe(0.25);
    expect(bar.beats[1]).toMatchObject({ duration: 0.75, notes: [] });
    expect(beatsDurationInQuarters(bar.beats)).toBeCloseTo(4);
  });

  it("stops growing at the bar line instead of overflowing", () => {
    const next = setBeatsDuration(filledBar(4), [3], 4);

    expect(next.beats).toHaveLength(4);
    expect(next.beats[3].duration).toBe(1);
    expect(beatsDurationInQuarters(next.beats)).toBeCloseTo(4);
  });

  it("re-times a whole selection at once", () => {
    const next = setBeatsDuration(
      filledBar(),
      Array.from({ length: 16 }, (_, i) => i),
      1,
    );

    expect(next.beats).toHaveLength(4);
    expect(next.beats.map((b) => b.notes[0].fret)).toEqual([0, 4, 8, 12]);
    expect(beatsDurationInQuarters(next.beats)).toBeCloseTo(4);
  });

  it("keeps the measure untouched when nothing is selected", () => {
    const bar = filledBar();
    expect(setBeatsDuration(bar, [], 2)).toBe(bar);
  });
});

describe("restBeatsAt", () => {
  it("empties the listed beats and leaves the rest alone", () => {
    const next = restBeatsAt(filledBar(4), [1, 2]);

    expect(next.beats.map((b) => b.notes.length)).toEqual([1, 0, 0, 1]);
    expect(beatsDurationInQuarters(next.beats)).toBeCloseTo(4);
  });
});

describe("beatOffsetsInQuarters", () => {
  it("accumulates each beat's own length", () => {
    const beats = [
      { notes: [], duration: 2 },
      { notes: [], duration: 0.5 },
      { notes: [], duration: 0.5 },
    ];
    expect(beatOffsetsInQuarters(beats)).toEqual([0, 2, 2.5]);
  });
});

describe("startsCountedBeat", () => {
  it("marks the counted beats of the bar", () => {
    expect(startsCountedBeat(0, [4, 4])).toBe(true);
    expect(startsCountedBeat(1, [4, 4])).toBe(true);
    expect(startsCountedBeat(0.75, [4, 4])).toBe(false);
    // In 6/8 a counted beat is an eighth — half a quarter note.
    expect(startsCountedBeat(0.5, [6, 8])).toBe(true);
  });
});
