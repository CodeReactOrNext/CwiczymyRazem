import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type {
  BackingTrack,
  TablatureMeasure,
} from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import { buildMeasure } from "./arrange";
import { isAutoBackingEligible } from "./eligibility";
import { AUTO_TRACK_IDS, generateAutoBacking } from "./generateAutoBacking";
import {
  A_MINOR_PENTATONIC_BOX,
  bar,
  eighths,
  lengthOf,
  sixteenths,
  SPIDER,
} from "./testing/tabBuilders";

const EPS = 1e-6;

/** What has to hold for any backing to stay on the tab's clock. */
/**
 * What has to hold for any backing to stay on the tab's clock: bar i plays
 * over tab bar i (mod its length), an intro played once is a prefix, and the
 * part that loops is a whole number of tab loops — so after it wraps, bar
 * for bar, the backing still lands on the tab.
 */
function expectAligned(tracks: BackingTrack[], tab: TablatureMeasure[]) {
  for (const track of tracks) {
    const intro = track.measures.findIndex((measure) => !measure.firstLoopOnly);
    expect(
      track.measures.slice(intro).some((measure) => measure.firstLoopOnly),
    ).toBe(false);
    expect((track.measures.length - intro) % tab.length).toBe(0);
    track.measures.forEach((measure, i) => {
      const source = tab[i % tab.length];
      expect(Math.abs(lengthOf(measure) - lengthOf(source))).toBeLessThan(EPS);
      expect(measure.timeSignature).toEqual(source.timeSignature);
      expect(measure.tempoChange).toEqual(source.tempoChange);
      measure.beats.forEach((beat) => expect(beat.duration).toBeGreaterThan(0));
    });
  }
}

describe("buildMeasure", () => {
  const info = {
    index: 0,
    start: 0,
    length: 4,
    timeSignature: [4, 4] as [number, number],
    accents: [],
  };

  it("fills a bar exactly, with rests where nothing plays", () => {
    const measure = buildMeasure(
      [{ pos: 1, notes: [{ string: 1, fret: 0 }], length: 0.5 }],
      info,
    );
    expect(
      measure.beats.map((beat) => [beat.duration, beat.notes.length]),
    ).toEqual([
      [1, 0],
      [0.5, 1],
      [2.5, 0],
    ]);
  });

  it("merges hits that land together into one beat", () => {
    const measure = buildMeasure(
      [
        { pos: 0, notes: [{ string: 1, fret: 0, midiNote: 36 }] },
        { pos: 0, notes: [{ string: 1, fret: 0, midiNote: 42 }] },
      ],
      info,
    );
    expect(measure.beats[0].notes).toHaveLength(2);
    expect(lengthOf(measure)).toBe(4);
  });
});

describe("generateAutoBacking", () => {
  const box = bar(sixteenths(A_MINOR_PENTATONIC_BOX));

  it("writes drums, bass and keys that line up with the tab", () => {
    const result = generateAutoBacking({
      measures: [box],
      bpm: 90,
      seed: "box",
    })!;
    expect(result.tracks.map((track) => track.id)).toEqual([
      AUTO_TRACK_IDS.drums,
      AUTO_TRACK_IDS.bass,
      AUTO_TRACK_IDS.keys,
    ]);
    expect(result.tracks.every((track) => track.generated)).toBe(true);
    expectAligned(result.tracks, [box]);
    expect(result.summary.key).toEqual({
      tonic: "A",
      scale: "minorPentatonic",
    });
  });

  it("plays a short drill as a song: a pad intro once, then four sections", () => {
    const result = generateAutoBacking({
      measures: [box],
      bpm: 90,
      seed: "box",
    })!;
    // Harmony loops every four bars; the song is a 4-bar intro + 4 × 8 bars.
    expect(result.summary.bars).toBe(4);
    const [drums, , pad] = result.tracks;
    expect(drums.measures).toHaveLength(36);
    expect(drums.measures.slice(0, 4).every((m) => m.firstLoopOnly)).toBe(true);
    // The intro is the pad alone.
    const notesIn = (measures: TablatureMeasure[]) =>
      measures.reduce(
        (n, m) => n + m.beats.reduce((k, b) => k + b.notes.length, 0),
        0,
      );
    expect(notesIn(drums.measures.slice(0, 4))).toBe(0);
    expect(notesIn(pad.measures.slice(0, 4))).toBeGreaterThan(0);
    // The breakdown (third section) thins the kit out against the groove.
    const groove = notesIn(drums.measures.slice(4, 12));
    const breakdown = notesIn(drums.measures.slice(20, 28));
    expect(breakdown).toBeLessThan(groove / 2);
  });

  it("adds an arpeggio only where the exercise leaves room for one", () => {
    const slow = bar([
      [3, 2, 1],
      [2, 3, 1],
      [1, 2, 1],
      [2, 3, 1],
    ]);
    const sparse = generateAutoBacking({
      measures: [slow],
      bpm: 70,
      seed: "slow",
    })!;
    const arp = sparse.tracks.find((track) => track.trackType === "arp");
    expect(arp).toBeDefined();
    for (const note of arp!.measures.flatMap((m) =>
      m.beats.flatMap((b) => b.notes),
    )) {
      expect(note.midiNote).toBeGreaterThanOrEqual(62);
    }
    const busy = generateAutoBacking({
      measures: [box],
      bpm: 70,
      seed: "busy",
    })!;
    expect(busy.tracks.some((track) => track.trackType === "arp")).toBe(false);
  });

  it("keeps the backing as long as the tab when the run has to end with it", () => {
    const finite = generateAutoBacking({
      measures: [box],
      bpm: 90,
      repeatCount: 3,
    })!;
    expect(finite.tracks[0].measures).toHaveLength(1);
    const intro = bar(eighths([[5, 0]]), [4, 4], { firstLoopOnly: true });
    const withIntro = generateAutoBacking({ measures: [intro, box], bpm: 90 })!;
    expect(withIntro.tracks[0].measures).toHaveLength(2);
    expect(withIntro.tracks[0].measures[0].firstLoopOnly).toBe(true);
  });

  it("is the same backing every time for the same seed", () => {
    const a = generateAutoBacking({
      measures: [box, box],
      bpm: 100,
      seed: "same",
    });
    const b = generateAutoBacking({
      measures: [box, box],
      bpm: 100,
      seed: "same",
    });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("gives a chromatic drill only drums", () => {
    const result = generateAutoBacking({
      measures: [bar(sixteenths(SPIDER.slice(0, 16)))],
      bpm: 80,
    })!;
    expect(result.tracks.map((track) => track.trackType)).toEqual(["drums"]);
    expect(result.summary.kind).toBe("rhythm");
  });

  it("keeps bass on the bass and keys in the middle register", () => {
    const result = generateAutoBacking({ measures: [box, box], bpm: 90 })!;
    const bass = result.tracks.find((track) => track.trackType === "bass")!;
    for (const note of bass.measures.flatMap((m) =>
      m.beats.flatMap((beat) => beat.notes),
    )) {
      expect(note.string).toBeGreaterThanOrEqual(1);
      expect(note.string).toBeLessThanOrEqual(4);
      expect(note.fret).toBeGreaterThanOrEqual(0);
    }
    const keys = result.tracks.find((track) => track.trackType === "keys")!;
    for (const beat of keys.measures.flatMap((m) => m.beats)) {
      for (const note of beat.notes)
        expect(note.midiNote).toBeGreaterThanOrEqual(52);
      // Each voice on its own "string", so one doesn't cut another off.
      expect(new Set(beat.notes.map((note) => note.string)).size).toBe(
        beat.notes.length,
      );
    }
  });

  it("plays in the key the guitar sounds in", () => {
    const standard = generateAutoBacking({ measures: [box], bpm: 90 })!;
    const halfStepDown = generateAutoBacking({
      measures: [box],
      bpm: 90,
      tuningOffsets: [-1, -1, -1, -1, -1, -1],
    })!;
    expect(standard.summary.key?.tonic).toBe("A");
    expect(halfStepDown.summary.key?.tonic).toBe("G#");
  });

  it("drops the keyboard from metal", () => {
    const riff = bar(
      eighths([
        [6, 0],
        [6, 0],
        [6, 3],
        [6, 0],
        [6, 5],
        [6, 0],
        [6, 3],
        [6, 2],
      ]),
    );
    const result = generateAutoBacking({
      measures: [riff],
      bpm: 140,
      title: "Metal Gallop",
    })!;
    expect(result.summary.groove).toBe("metal");
    expect(result.tracks.some((track) => track.trackType === "keys")).toBe(
      false,
    );
  });

  it("follows odd and compound meters bar by bar", () => {
    const sevenEight = bar(
      Array.from({ length: 7 }, () => [6, 0, 0.5] as [number, number, number]),
      [7, 8],
    );
    const twelveEight = bar(
      Array.from({ length: 12 }, () => [5, 2, 0.5] as [number, number, number]),
      [12, 8],
    );
    const fiveSixteen = bar(
      Array.from({ length: 5 }, () => [6, 3, 0.25] as [number, number, number]),
      [5, 16],
    );
    const tab = [sevenEight, twelveEight, fiveSixteen];
    expectAligned(generateAutoBacking({ measures: tab, bpm: 70 })!.tracks, tab);
  });
});

describe("the exercise library", () => {
  const eligible = exercisesAgregat.filter(isAutoBackingEligible);

  it("has tab exercises to back", () => {
    expect(eligible.length).toBeGreaterThan(50);
  });

  it("gets a backing that stays on the tab's clock for every eligible exercise", () => {
    for (const exercise of eligible) {
      const result = generateAutoBacking({
        measures: exercise.tablature!,
        bpm: exercise.metronomeSpeed?.recommended ?? 80,
        title: exercise.title,
        description: exercise.description,
        seed: exercise.id,
      });
      expect(result, exercise.id).not.toBeNull();
      expectAligned(result!.tracks, exercise.tablature!);
    }
  });
});

describe("isAutoBackingEligible", () => {
  const base = exercisesAgregat.find(
    (exercise) => exercise.id === "pentatonic_box1_up_down",
  )!;

  it("takes a plain tab exercise", () => {
    expect(isAutoBackingEligible(base)).toBe(true);
  });

  it("leaves alone exercises that bring or forbid their own accompaniment", () => {
    expect(isAutoBackingEligible({ ...base, disableBackingTrack: true })).toBe(
      false,
    );
    expect(
      isAutoBackingEligible({
        ...base,
        backingTracks: [{ id: "x", name: "x", measures: [] }],
      }),
    ).toBe(false);
    expect(isAutoBackingEligible({ ...base, tablature: [] })).toBe(false);
    expect(
      isAutoBackingEligible({
        ...base,
        songData: { songId: "s", title: "t", artist: "a" },
      }),
    ).toBe(false);
  });
});
