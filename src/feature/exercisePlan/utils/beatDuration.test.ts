import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  beatOffsetsInQuarters,
  fitMeasureToTimeSignature,
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

describe("fitMeasureToTimeSignature", () => {
  /** The bar Cookie reported: "1 + (2) 3 + (4)" written entirely in eighths,
   *  so the two quarter rests are half as long as they read — 3 quarters of
   *  content in a 4/4 bar. */
  const shortBar = (): TablatureMeasure => ({
    timeSignature: [4, 4],
    beats: [
      { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
      { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
      { duration: 0.5, notes: [] },
      { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
      { duration: 0.5, notes: [{ string: 6, fret: 0 }] },
      { duration: 0.5, notes: [] },
    ],
  });

  it("pads a short bar without moving a note", () => {
    const bar = shortBar();
    const next = fitMeasureToTimeSignature(bar);

    expect(beatsDurationInQuarters(next.beats)).toBeCloseTo(4);
    expect(beatOffsetsInQuarters(next.beats).slice(0, 6)).toEqual(
      beatOffsetsInQuarters(bar.beats),
    );
    expect(next.beats.slice(0, 5)).toEqual(bar.beats.slice(0, 5));
  });

  it("grows the trailing rest instead of parking a second one next to it", () => {
    const next = fitMeasureToTimeSignature(shortBar());

    // The bar's own eighth rest plus the missing quarter, as one dotted rest.
    expect(next.beats).toHaveLength(6);
    expect(next.beats[5]).toEqual({ duration: 1.5, notes: [] });
  });

  it("appends a fresh rest when the bar ends on a note", () => {
    const next = fitMeasureToTimeSignature({
      timeSignature: [4, 4],
      beats: [{ duration: 1, notes: [{ string: 6, fret: 0 }] }],
    });

    expect(next.beats).toHaveLength(2);
    expect(next.beats[1]).toEqual({ duration: 3, notes: [] });
  });

  it("cuts a gap nothing can draw into rests that can be", () => {
    const next = fitMeasureToTimeSignature({
      timeSignature: [4, 4],
      beats: [{ duration: 1.75, notes: [{ string: 6, fret: 0 }] }],
    });

    expect(next.beats.slice(1)).toEqual([
      { duration: 2, notes: [] },
      { duration: 0.25, notes: [] },
    ]);
  });

  it("takes an overflow back off the trailing rests", () => {
    const next = fitMeasureToTimeSignature({
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 6, fret: 0 }] },
        { duration: 0.5, notes: [] },
        { duration: 1, notes: [] },
      ],
    });

    expect(next.beats).toHaveLength(1);
    expect(beatsDurationInQuarters(next.beats)).toBeCloseTo(4);
  });

  it("keeps a note the overflow would have cost", () => {
    const overflowing: TablatureMeasure = {
      timeSignature: [4, 4],
      beats: [
        { duration: 4, notes: [{ string: 6, fret: 0 }] },
        { duration: 1, notes: [{ string: 6, fret: 3 }] },
      ],
    };

    expect(fitMeasureToTimeSignature(overflowing)).toBe(overflowing);
  });

  it("leaves a measure that already fills its signature alone", () => {
    const bar = filledBar();
    expect(fitMeasureToTimeSignature(bar)).toBe(bar);
    // 6/8 counts three quarter notes, not six.
    const sixEight = createMeasure([6, 8], 6);
    expect(fitMeasureToTimeSignature(sixEight)).toBe(sixEight);
  });
});
