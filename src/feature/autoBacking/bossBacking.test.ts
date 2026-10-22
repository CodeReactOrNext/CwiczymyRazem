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

/** The colossus's drill: one named strum per chord — G and C in half notes, then a quake in quarters. */
const G: [number, number][] = [
  [6, 3],
  [5, 2],
  [4, 0],
  [3, 0],
  [2, 0],
  [1, 3],
];
const C: [number, number][] = [
  [5, 3],
  [4, 2],
  [3, 0],
  [2, 1],
  [1, 0],
];
const strum = (name: string, cells: [number, number][], duration: number) => ({
  duration,
  chordName: name,
  notes: cells.map(([string, fret]) => ({ string, fret })),
});
const changes: TablatureMeasure[] = [
  { timeSignature: [4, 4], beats: [strum("G", G, 2), strum("C", C, 2)] },
  {
    timeSignature: [4, 4],
    beats: [
      strum("G", G, 1),
      strum("C", C, 1),
      strum("G", G, 1),
      strum("C", C, 1),
    ],
  },
];
/** Where each chord of the drill starts, in beats from the top, and its root. */
const CHANGES = [
  { at: 0, root: 7 },
  { at: 2, root: 0 },
  { at: 4, root: 7 },
  { at: 5, root: 0 },
  { at: 6, root: 7 },
  { at: 7, root: 0 },
];
/** The bass's open strings, G D A E — its notes are written as string and fret. */
const BASS_OPEN = [43, 38, 33, 28];
/** Every note of a track with the beat it starts on, over one loop of the drill. */
const timeline = (measures: TablatureMeasure[]) => {
  const out: { at: number; pc: number }[] = [];
  let at = 0;
  for (const measure of measures.slice(0, changes.length)) {
    for (const beat of measure.beats) {
      for (const note of beat.notes) {
        const pitch = note.midiNote ?? BASS_OPEN[note.string - 1] + note.fret;
        out.push({ at, pc: pitch % 12 });
      }
      at += beat.duration;
    }
  }
  return out;
};
const chordAt = (at: number) =>
  [...CHANGES].reverse().find((change) => change.at <= at + 1e-6)!;

describe("generateBossBacking over named chords", () => {
  it("plays the tab's own chords, change for change", () => {
    const result = generateBossBacking(changes, 80, { phase: 3 }, {})!;
    expect(result.summary.source).toBe("tab");
    expect(result.summary.chords).toEqual(["G", "C", "G", "C", "G", "C"]);
    const bass = timeline(result.tracks[1].measures);
    for (const change of CHANGES) {
      const first = bass.find((note) => Math.abs(note.at - change.at) < 1e-6);
      expect(first?.pc, `bass at beat ${change.at}`).toBe(change.root);
    }
  });

  it("keeps the strings on the chord's tones — no half step against it", () => {
    const result = generateBossBacking(changes, 80, { phase: 3 }, {})!;
    const tones: Record<number, number[]> = { 7: [7, 11, 2], 0: [0, 4, 7] };
    for (const note of timeline(result.tracks[3].measures)) {
      expect(tones[chordAt(note.at).root]).toContain(note.pc);
    }
  });

  it("moves the chords with a guitar tuned down as a whole", () => {
    const halfDown = generateBossBacking(
      changes,
      80,
      { phase: 1 },
      { tuningOffsets: [-1, -1, -1, -1, -1, -1] },
    )!;
    expect(halfDown.summary.chords.slice(0, 2)).toEqual(["F#", "B"]);
  });

  it("keeps the dark pedal for a drill with no chord names", () => {
    expect(
      generateBossBacking(drill, 90, { phase: 1 }, {})!.summary.source,
    ).toBe("progression");
  });
});
