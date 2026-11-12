import { fingerPairDyadsExercise } from "feature/exercisePlan/data/exerises/fingerPairDyads/fingerPairDyads";
import { describe, expect, it } from "vitest";

import { buildTablatureRenderData } from "./tablatureRenderData";

describe("buildTablatureRenderData fingering", () => {
  it("carries each note's finger through to the board", () => {
    const data = buildTablatureRenderData(fingerPairDyadsExercise.tablature);
    const firstBar = data.renderBeats.slice(0, 4);

    expect(firstBar.map((beat) => beat.notes.map((n) => [n.string, n.fret, n.finger]))).toEqual([
      [[6, 5, 1], [5, 7, 3]],
      [[6, 6, 2], [5, 8, 4]],
      [[6, 5, 1], [5, 7, 3]],
      [[6, 6, 2], [5, 8, 4]],
    ]);
  });

  it("leaves notes without fingering unmarked", () => {
    const data = buildTablatureRenderData([
      { timeSignature: [4, 4], beats: [{ duration: 1, notes: [{ string: 1, fret: 3 }] }] },
    ]);

    expect(data.renderBeats[0].notes[0].finger).toBeUndefined();
  });
});

describe("buildTablatureRenderData rhythm", () => {
  const note = [{ string: 5, fret: 0 }];

  it("draws triplet eighths as beamed eighths, one bracket per three", () => {
    const data = buildTablatureRenderData([
      { timeSignature: [2, 4], beats: Array.from({ length: 6 }, () => ({ duration: 0.333, notes: note })) },
    ]);

    expect(data.renderBeats.map((b) => [b.writtenDuration, b.tuplet, b.beamRight2])).toEqual(
      Array.from({ length: 6 }, () => [0.5, 3, false]),
    );
    expect(data.renderBeats.slice(0, 5).every((b) => b.beamRight)).toBe(true);
    expect(data.tupletGroups.map((g) => [g.num, +g.x1.toFixed(3), +g.x2.toFixed(3)])).toEqual([
      [3, 0, 0.999],
      [3, 0.999, 1.998],
    ]);
  });

  it("marks dotted values and beams a dotted eighth to its sixteenth", () => {
    const data = buildTablatureRenderData([
      { timeSignature: [4, 4], beats: [
        { duration: 0.75, notes: note },
        { duration: 0.25, notes: note },
        { duration: 3, notes: note },
      ] },
    ]);

    expect(data.renderBeats.map((b) => [b.writtenDuration, b.dots])).toEqual([[0.5, 1], [0.25, 0], [2, 1]]);
    expect(data.renderBeats[0].beamRight).toBe(true);
    expect(data.renderBeats[0].beamRight2).toBe(false);
    expect(data.tupletGroups).toEqual([]);
  });
});

describe("finger pair dyads", () => {
  it("climbs from E+A to B+e and back, one string pair per bar", () => {
    const lowerStrings = (fingerPairDyadsExercise.tablature ?? []).map(
      (bar) => bar.beats[0].notes[0].string,
    );

    expect(lowerStrings).toEqual([6, 5, 4, 3, 2, 3, 4, 5]);
  });
});
