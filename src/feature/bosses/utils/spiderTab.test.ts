import { hasLeaderboard } from "feature/exercisePlan/utils/hasLeaderboard";
import { measureDurationInQuarters } from "feature/exercisePlan/utils/measureDuration";
import { describe, expect, it } from "vitest";

import { FRETWEAVER } from "../data/fretweaver";
import type { SpiderVariation } from "../types/boss.types";
import { buildPhaseExercise, buildSpiderTablature, spiderPassNotes } from "./spiderTab";

const variation = (overrides: Partial<SpiderVariation>): SpiderVariation => ({
  bpm: 60,
  notesPerBeat: 4,
  patterns: ["1234"],
  route: "walk",
  positions: [5],
  ...overrides,
});

describe("spiderPassNotes", () => {
  it("plays the finger order up the strings from the index finger's fret", () => {
    const notes = spiderPassNotes(variation({ patterns: ["1324"], positions: [5] }));
    expect(notes.slice(0, 8)).toEqual([
      { string: 6, fret: 5 },
      { string: 6, fret: 7 },
      { string: 6, fret: 6 },
      { string: 6, fret: 8 },
      { string: 5, fret: 5 },
      { string: 5, fret: 7 },
      { string: 5, fret: 6 },
      { string: 5, fret: 8 },
    ]);
    expect(notes).toHaveLength(24);
    expect(notes.at(-1)).toEqual({ string: 1, fret: 8 });
  });

  it("comes back down the strings at the next position with the descending orders", () => {
    const notes = spiderPassNotes(
      variation({ patterns: ["1234"], descendPatterns: ["4321"], positions: [5, 6] }),
    );
    expect(notes.slice(24, 28)).toEqual([
      { string: 1, fret: 9 },
      { string: 1, fret: 8 },
      { string: 1, fret: 7 },
      { string: 1, fret: 6 },
    ]);
    expect(notes.at(-1)).toEqual({ string: 6, fret: 6 });
  });

  it("deals rotating orders one per string", () => {
    const notes = spiderPassNotes(variation({ patterns: ["1234", "4321"], positions: [1] }));
    expect(notes.slice(0, 8).map((n) => n.fret)).toEqual([1, 2, 3, 4, 4, 3, 2, 1]);
  });

  it("skips a string each step on the skip route", () => {
    const strings = spiderPassNotes(variation({ route: "skip", positions: [5] }))
      .filter((_, i) => i % 4 === 0)
      .map((n) => n.string);
    expect(strings).toEqual([6, 4, 5, 3, 4, 2, 3, 1]);
  });

  it("climbs a fret per string on the diagonal and walks back down", () => {
    const firsts = spiderPassNotes(variation({ route: "diagonal", positions: [3, 8] }))
      .filter((_, i) => i % 4 === 0)
      .map((n) => n.fret);
    expect(firsts).toEqual([3, 4, 5, 6, 7, 8, 8, 7, 6, 5, 4, 3]);
  });
});

describe("buildSpiderTablature", () => {
  it("cuts the pass into full 4/4 bars at the subdivision", () => {
    for (const notesPerBeat of [1, 2, 3, 4] as const) {
      const tab = buildSpiderTablature(variation({ notesPerBeat, positions: [5, 6] }));
      for (const measure of tab) {
        const quarters = measure.beats.reduce((sum, beat) => sum + beat.duration, 0);
        expect(quarters).toBeCloseTo(measureDurationInQuarters(measure.timeSignature), 6);
      }
      expect(tab.flatMap((m) => m.beats)).toHaveLength(48);
    }
  });

  it("marks triplets for the notation", () => {
    const tab = buildSpiderTablature(variation({ notesPerBeat: 3, positions: [5] }));
    expect(tab[0].beats[0].tuplet).toBe(3);
  });
});

describe("buildPhaseExercise", () => {
  const ex = buildPhaseExercise(FRETWEAVER, variation({ bpm: 132 }));

  it("locks the metronome to the phase's tempo", () => {
    expect(ex.metronomeSpeed).toEqual({ min: 132, max: 132, recommended: 132 });
  });

  it("stays off the leaderboards and out of the library", () => {
    expect(hasLeaderboard(ex)).toBe(false);
    expect(ex.isHiddenFromLibrary).toBe(true);
  });

  it("keeps one id for the whole fight", () => {
    expect(ex.id).toBe("boss-fretweaver");
    expect(buildPhaseExercise(FRETWEAVER, variation({ bpm: 90 })).id).toBe(ex.id);
  });
});
