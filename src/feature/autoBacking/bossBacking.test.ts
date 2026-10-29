import { buildChangesTablature } from "feature/bosses/utils/changesTab";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { describe, expect, it } from "vitest";

import {
  bossEnergyFloor,
  bossIntensity,
  CHANGES_ENERGY_FLOOR,
  generateBossBacking,
} from "./bossBacking";
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

  it("writes the kit in layers the player's run unlocks, its floor rising with the fight", () => {
    expect([1, 2, 3, 4, 5, 9].map(bossIntensity)).toEqual([1, 1, 2, 2, 3, 3]);
    expect([1, 4, 5, 9].map(bossEnergyFloor)).toEqual([1, 1, 2, 2]);
    const notes = generateBossBacking(
      drill,
      90,
      { phase: 1 },
      {},
    )!.tracks[0].measures.flatMap((m) => m.beats.flatMap((b) => b.notes));
    const kicks = (upTo: number) =>
      notes.filter(
        (n) =>
          n.midiNote === 36 && (n.layer ?? 0) >= 0 && (n.layer ?? 0) <= upTo,
      ).length;
    // On the beat at the floor, then eighths, then the double kick.
    expect(kicks(1)).toBeGreaterThan(0);
    expect(kicks(3)).toBeGreaterThan(kicks(1) * 1.5);
    expect(kicks(4)).toBeGreaterThan(kicks(3));
    // Every drum note says which layer it is in; the heartbeat waits for danger.
    expect(notes.every((n) => n.layer !== undefined)).toBe(true);
    expect(notes.some((n) => n.layer === -1)).toBe(true);
  });

  it("keeps a root on every beat of the bass whatever the energy", () => {
    const bass = generateBossBacking(drill, 90, { phase: 1 }, {})!.tracks[1]
      .measures;
    for (const measure of bass) {
      let pos = 0;
      for (const beat of measure.beats) {
        if (Math.abs(pos - Math.round(pos)) < 1e-6 && beat.notes.length) {
          expect(beat.notes[0].layer).toBe(0);
        }
        pos += beat.duration;
      }
    }
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

/** A changeling pass: C F G a bar each, then twice through in a rush, two beats a chord. */
const PASS: { chord: string; root: number; beats: number }[] = [
  { chord: "C", root: 0, beats: 4 },
  { chord: "F", root: 5, beats: 4 },
  { chord: "G", root: 7, beats: 4 },
  ...[0, 1].flatMap(() => [
    { chord: "C", root: 0, beats: 2 },
    { chord: "F", root: 5, beats: 2 },
    { chord: "G", root: 7, beats: 2 },
  ]),
];
/** Where each chord of the pass starts, in beats. */
const PASS_STARTS = PASS.map((_, i) =>
  PASS.slice(0, i).reduce((at, unit) => at + unit.beats, 0),
);
const PASS_BEATS = PASS_STARTS[PASS.length - 1] + PASS[PASS.length - 1].beats;
const TONES: Record<number, number[]> = {
  0: [0, 4, 7],
  5: [5, 9, 0],
  7: [7, 11, 2],
};
/** The pass as the changeling writes it: bars of rests, each chord named. */
const pass = buildChangesTablature({
  units: PASS.map(({ chord, beats }) => ({ chord, beats, quake: beats < 4 })),
});
const unitAt = (at: number) =>
  PASS[PASS_STARTS.findLastIndex((start) => start <= at + 1e-6)];

/** Every note of a track over one pass, with its beat and pitch. */
const passNotes = (measures: TablatureMeasure[]) => {
  const out: {
    at: number;
    pitch: number;
    layer: number | undefined;
    midiNote?: number;
  }[] = [];
  let at = 0;
  for (const measure of measures.slice(0, pass.length)) {
    for (const beat of measure.beats) {
      for (const note of beat.notes) {
        const pitch = note.midiNote ?? BASS_OPEN[note.string - 1] + note.fret;
        out.push({ at, pitch, layer: note.layer, midiNote: note.midiNote });
      }
      at += beat.duration;
    }
  }
  return out;
};
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe("the changes score — a band to solo over", () => {
  const score = generateBossBacking(
    pass,
    90,
    { phase: 4, score: "changes" },
    {},
  )!;
  const [drums, bass, , line] = score.tracks.map((track) =>
    passNotes(track.measures),
  );
  const groove = (note: { layer: number | undefined }) =>
    (note.layer ?? 0) <= CHANGES_ENERGY_FLOOR;

  it("keeps the kick on 1 and 3 and the backbeat on 2 and 4, whatever the run", () => {
    const kicks = drums
      .filter((n) => n.midiNote === 36 && groove(n))
      .map((n) => n.at);
    const snares = drums
      .filter((n) => n.midiNote === 38 && groove(n))
      .map((n) => n.at);
    expect(kicks).toEqual(
      Array.from({ length: PASS_BEATS / 2 }, (_, i) => i * 2),
    );
    expect(snares).toEqual(
      Array.from({ length: PASS_BEATS / 2 }, (_, i) => i * 2 + 1),
    );
    // No double kick: past the groove, one push a bar on the and of 2.
    expect(
      drums
        .filter((n) => n.midiNote === 36 && !groove(n))
        .every((n) => near(n.at % 4, 1.5)),
    ).toBe(true);
  });

  it("crashes where the progression comes round and fills into it, nowhere else", () => {
    const crashes = drums.filter((n) => n.midiNote === 49).map((n) => n.at);
    // C F G, C F G, C F G: the pass's top, the first rush and the second.
    expect(crashes).toEqual([0, 12, 18]);
    const toms = drums.filter((n) => n.midiNote === 45 || n.midiNote === 41);
    // Into beat 12 and round into the next pass's top; none before the mid-bar C at 18.
    expect(
      toms.every((n) => (n.at > 11 && n.at < 12) || n.at > PASS_BEATS - 1),
    ).toBe(true);
    expect(toms.every((n) => !groove(n))).toBe(true);
  });

  it("drives the bass in eighths on the root, a half step into each next one", () => {
    expect(bass.map((n) => n.at)).toEqual(
      Array.from({ length: PASS_BEATS * 2 }, (_, i) => i / 2),
    );
    expect(bass.every(groove)).toBe(true);
    PASS.forEach((unit, i) => {
      const start = PASS_STARTS[i];
      expect(
        bass.find((n) => near(n.at, start))!.pitch % 12,
        `root at ${start}`,
      ).toBe(unit.root);
      const next = PASS[(i + 1) % PASS.length];
      const lead = bass.find((n) => near(n.at, start + unit.beats - 0.5))!;
      expect(
        Math.abs(((lead.pitch - next.root + 18) % 12) - 6),
        `into ${next.chord}`,
      ).toBe(1);
    });
  });

  it("plays a tone of the chord on 1 and 3 — the beats the solo's are due on — at every energy", () => {
    for (let at = 0; at < PASS_BEATS; at += 2) {
      const tone = line.find((n) => near(n.at, at));
      expect(tone, `beat ${at}`).toBeDefined();
      expect(tone!.layer).toBe(0);
      expect(TONES[unitAt(at).root]).toContain(tone!.pitch % 12);
    }
    // 2 and 4 answer only as the run builds, still inside the chord.
    for (const answer of line.filter((n) => !near(n.at % 2, 0))) {
      expect(groove(answer)).toBe(false);
      expect(TONES[unitAt(answer.at).root]).toContain(answer.pitch % 12);
    }
  });

  it("moves the line a step at most across a change, or holds a shared tone", () => {
    const strong = line.filter((n) => near(n.at % 2, 0));
    PASS_STARTS.slice(1).forEach((start) => {
      const i = strong.findIndex((n) => near(n.at, start));
      expect(
        Math.abs(strong[i].pitch - strong[i - 1].pitch),
        `into beat ${start}`,
      ).toBeLessThanOrEqual(2);
    });
  });

  it("stays the battle score for a drill without chord names", () => {
    expect(
      generateBossBacking(drill, 90, { phase: 1, score: "changes" }, {})!
        .summary.source,
    ).toBe("progression");
  });
});

describe("the battle score over a diminished chord", () => {
  it("gives the strings its flat fifth, not a perfect one", () => {
    const dim = buildChangesTablature({
      units: [
        { chord: "Bdim", beats: 4, quake: false },
        { chord: "C", beats: 4, quake: false },
      ],
    });
    const strings = passNotes(
      generateBossBacking(dim, 80, { phase: 1 }, {})!.tracks[3].measures,
    );
    expect(strings.some((n) => n.at < 4)).toBe(true);
    for (const note of strings.filter((n) => n.at < 4))
      expect([11, 2, 5]).toContain(note.pitch % 12);
  });
});
