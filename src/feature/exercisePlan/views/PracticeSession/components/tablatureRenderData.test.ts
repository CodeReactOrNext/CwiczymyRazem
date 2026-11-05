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

describe("finger pair dyads", () => {
  it("climbs from E+A to B+e and back, one string pair per bar", () => {
    const lowerStrings = (fingerPairDyadsExercise.tablature ?? []).map(
      (bar) => bar.beats[0].notes[0].string,
    );

    expect(lowerStrings).toEqual([6, 5, 4, 3, 2, 3, 4, 5]);
  });
});
