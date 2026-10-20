import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { bossIntensity, generateBossBacking } from "./bossBacking";
import { bar, lengthOf, sixteenths, SPIDER } from "./testing/tabBuilders";

/** A spider drill, as the Fretweaver deals them: chromatic, finger by finger. */
const drill = [
  bar(sixteenths(SPIDER.slice(0, 16))),
  bar(sixteenths(SPIDER.slice(8, 24))),
];
const notesOf = (measures: TablatureMeasure[]) =>
  measures.reduce(
    (n, m) => n + m.beats.reduce((k, b) => k + b.notes.length, 0),
    0,
  );
const kicksOf = (measures: TablatureMeasure[]) =>
  measures
    .flatMap((m) => m.beats.flatMap((b) => b.notes))
    .filter((note) => note.midiNote === 36).length;

describe("generateBossBacking", () => {
  it("plays a full band over a chromatic drill a normal backing gives only drums", () => {
    const result = generateBossBacking(drill, 90, { phase: 1 }, {})!;
    expect(result.tracks.map((track) => track.trackType)).toEqual([
      "drums",
      "bass",
      "keys",
      "arp",
    ]);
    expect(result.summary.groove).toBe("boss");
    expect(result.summary.key).toEqual({ tonic: "E", scale: null });
    for (const track of result.tracks)
      expect(notesOf(track.measures)).toBeGreaterThan(0);
  });

  it("stays on the drill's clock bar for bar", () => {
    const result = generateBossBacking(drill, 90, { phase: 3 }, {})!;
    for (const track of result.tracks) {
      expect(track.measures.length % drill.length).toBe(0);
      track.measures.forEach((measure, i) => {
        expect(
          Math.abs(lengthOf(measure) - lengthOf(drill[i % drill.length])),
        ).toBeLessThan(1e-6);
      });
    }
  });

  it("changes its progression with the phase", () => {
    const one = generateBossBacking(drill, 90, { phase: 1 }, {})!.summary
      .chords;
    const two = generateBossBacking(drill, 90, { phase: 2 }, {})!.summary
      .chords;
    expect(one).toEqual(["E5", "F5", "E5"]);
    expect(two).not.toEqual(one);
  });

  it("hits harder the further the fight goes", () => {
    expect([1, 2, 3, 4, 5, 9].map(bossIntensity)).toEqual([1, 1, 2, 2, 3, 3]);
    const early = kicksOf(
      generateBossBacking(drill, 90, { phase: 1 }, {})!.tracks[0].measures,
    );
    const late = kicksOf(
      generateBossBacking(drill, 90, { phase: 6 }, {})!.tracks[0].measures,
    );
    expect(late).toBeGreaterThan(early * 2);
  });

  it("keeps its pedal on the low string of a detuned guitar", () => {
    const halfDown = generateBossBacking(
      drill,
      90,
      { phase: 1 },
      { tuningOffsets: [-1, -1, -1, -1, -1, -1] },
    )!;
    expect(halfDown.summary.key?.tonic).toBe("D#");
  });
});
