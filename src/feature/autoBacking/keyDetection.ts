import { noteFit } from "./fit";
import type { TabContent } from "./noteEvents";
import type { Chord, PitchClass, ScaleDef, ScaleId } from "./theory";
import { chordOfDegree, scaleById, SCALES, vocabularyFor } from "./theory";

/**
 * What kind of accompaniment the tab can carry:
 * - `tonal`  — the notes sit in a key, so a band can play chords under them;
 * - `drone`  — the notes circle one root without saying major or minor (open
 *              strings, a palm-muted pedal, a metal riff full of chromatic
 *              passing notes): bass and power chords on that root;
 * - `rhythm` — chromatic drills and unpitched strumming: any chord would
 *              clash with half the notes, so only the drums play.
 */
export type HarmonyKind = "tonal" | "drone" | "rhythm";

export interface KeyEstimate {
  tonic: PitchClass;
  scale: ScaleDef;
  /** Share of the tab's weight that falls inside the scale. */
  coverage: number;
  /** Whether the notes themselves say major or minor (a third is present). */
  thirdKnown: boolean;
}

export interface RankedKey {
  tonic: PitchClass;
  scale: ScaleDef;
  coverage: number;
  score: number;
}

export interface KeyAnalysis {
  kind: HarmonyKind;
  key: KeyEstimate | null;
  /** Normalised weight per pitch class. */
  histogram: number[];
  distinctPitchClasses: number;
  /** The strongest candidates, best first — for tests and debugging. */
  ranked?: RankedKey[];
}

export interface KeyHint {
  rootNote?: string;
  scaleType?: string;
}

/** A key named in the exercise's own words — "A minor pentatonic pull-offs". */
export interface TextKey {
  tonic: PitchClass;
  scale: ScaleDef;
}

const HINT_SCALES: Record<string, ScaleId> = {
  major: "major",
  ionian: "major",
  minor: "minor",
  aeolian: "minor",
  minor_pentatonic: "minorPentatonic",
  major_pentatonic: "majorPentatonic",
  dorian: "dorian",
  phrygian: "phrygian",
  lydian: "lydian",
  mixolydian: "mixolydian",
};
const NOTE_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const TEXT_SCALES: [RegExp, ScaleId][] = [
  [/^minor pentatonic/i, "minorPentatonic"],
  [/^major pentatonic/i, "majorPentatonic"],
  [/^minor blues|^blues/i, "blues"],
  [/^harmonic minor/i, "harmonicMinor"],
  [/^(natural )?minor|^aeolian/i, "minor"],
  [/^major|^ionian/i, "major"],
  [/^dorian/i, "dorian"],
  [/^mixolydian/i, "mixolydian"],
  [/^phrygian/i, "phrygian"],
  [/^lydian/i, "lydian"],
];

/**
 * The first key the text names. Only a capital note letter counts — "a major
 * step forward" is English, not A major — and the caller still checks the
 * notes agree before believing it.
 */
export function keyFromText(...texts: (string | undefined)[]): TextKey | null {
  for (const text of texts) {
    if (!text) continue;
    const pattern =
      /\b([A-G])([#b\u266F\u266D]?)\s+(minor pentatonic|major pentatonic|minor blues|blues|harmonic minor|natural minor|minor|major|aeolian|ionian|dorian|mixolydian|phrygian|lydian)\b/g;
    for (const match of text.matchAll(pattern)) {
      const tonic =
        NOTE_INDEX[
          match[1] +
            (match[2] === "\u266F"
              ? "#"
              : match[2] === "\u266D"
                ? "b"
                : match[2])
        ];
      const scaleId = TEXT_SCALES.find(([test]) => test.test(match[3]))?.[1];
      if (tonic !== undefined && scaleId)
        return { tonic, scale: scaleById(scaleId) };
    }
  }
  return null;
}

const PRESENT = 0.03;

/** The note that makes a mode that mode — and how much of the tab must be it.
 *  The blues note is often a quick passing one, so it needs less. */
const CHARACTERISTIC: Partial<
  Record<ScaleId, { degree: number; share: number }>
> = {
  dorian: { degree: 9, share: 0.05 },
  mixolydian: { degree: 10, share: 0.05 },
  phrygian: { degree: 1, share: 0.05 },
  lydian: { degree: 6, share: 0.05 },
  harmonicMinor: { degree: 11, share: 0.05 },
  blues: { degree: 6, share: 0.02 },
};

function keyFromHint(
  hint: KeyHint | undefined,
): { tonic: number; scale: ScaleDef } | null {
  if (!hint?.rootNote || !hint.scaleType) return null;
  const tonic = NOTE_INDEX[hint.rootNote];
  const scaleId = HINT_SCALES[hint.scaleType];
  if (tonic === undefined || !scaleId) return null;
  return { tonic, scale: scaleById(scaleId) };
}

/**
 * How strongly each pitch class claims to be "home": its share of the notes,
 * how often it lands on a downbeat, and whether the phrase starts on it, ends
 * on it, or has it as its lowest note — the cues a listener uses too.
 */
function tonicEvidence(content: TabContent, histogram: number[]): number[] {
  const { notes } = content;
  const evidence = histogram.map((share) => 0.35 * share);
  if (notes.length === 0) return evidence;

  const downbeats = new Array(12).fill(0);
  let downbeatTotal = 0;
  for (const note of notes) {
    if (note.posInBar < 1e-6) {
      downbeats[note.pc] += note.weight;
      downbeatTotal += note.weight;
    }
  }
  if (downbeatTotal > 0)
    downbeats.forEach((w, pc) => {
      evidence[pc] += 0.2 * (w / downbeatTotal);
    });

  const lowestAt = (start: number) =>
    notes
      .filter((n) => Math.abs(n.start - start) < 1e-6)
      .reduce((low, n) => (n.pitch < low.pitch ? n : low));
  evidence[lowestAt(notes[0].start).pc] += 0.15;
  evidence[lowestAt(notes[notes.length - 1].start).pc] += 0.1;
  const lowest = notes.reduce((low, n) => (n.pitch < low.pitch ? n : low));
  evidence[lowest.pc] += 0.2;
  return evidence;
}

export function detectKey(
  content: TabContent,
  hint?: KeyHint,
  textKey?: TextKey | null,
): KeyAnalysis {
  const histogram = new Array(12).fill(0);
  for (const note of content.notes) histogram[note.pc] += note.weight;
  const total = histogram.reduce((sum, w) => sum + w, 0);
  if (total <= 0)
    return { kind: "rhythm", key: null, histogram, distinctPitchClasses: 0 };
  for (let pc = 0; pc < 12; pc++) histogram[pc] /= total;

  const distinct = histogram.filter((share) => share >= PRESENT).length;
  const evidence = tonicEvidence(content, histogram);
  const inside = (tonic: number, scale: ScaleDef) =>
    scale.intervals.reduce(
      (sum, interval) => sum + histogram[(tonic + interval) % 12],
      0,
    );
  const thirdKnownFor = (tonic: number) =>
    histogram[(tonic + 3) % 12] >= PRESENT ||
    histogram[(tonic + 4) % 12] >= PRESENT;

  const hinted = keyFromHint(hint);
  if (hinted) {
    const coverage = inside(hinted.tonic, hinted.scale);
    return {
      kind: "tonal",
      key: { ...hinted, coverage, thirdKnown: true },
      histogram,
      distinctPitchClasses: distinct,
    };
  }

  // A key is only believable if its home chord sounds right under the tune —
  // the first note of a run can be a fifth or a ninth as easily as the tonic.
  const tonicFit = (tonic: number, scale: ScaleDef) => {
    const home = chordOfDegree(tonic, vocabularyFor(scale.chordScale)[0]);
    const chord: Chord = !thirdKnownFor(tonic)
      ? { root: tonic, quality: "5" }
      : scale.chordScale === "blues" && histogram[(tonic + 4) % 12] < PRESENT
        ? { root: tonic, quality: "min7" }
        : home;
    const keyPcs = new Set(
      scale.intervals.map((interval) => (tonic + interval) % 12),
    );
    return histogram.reduce(
      (sum, share, pc) =>
        sum + share * noteFit(pc, chord, keyPcs, scale.chordScale),
      0,
    );
  };

  const ranked: RankedKey[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const scale of SCALES) {
      // A mode is only worth naming when its own colour note is really there.
      const colour = CHARACTERISTIC[scale.id];
      if (colour && histogram[(tonic + colour.degree) % 12] < colour.share)
        continue;
      const coverage = inside(tonic, scale);
      // Parsimony: a scale whose degrees the tab never plays is a weaker claim
      // than a smaller one that holds every note just as well.
      const missing = scale.intervals.filter(
        (interval) => histogram[(tonic + interval) % 12] < 0.015,
      ).length;
      // A scale that names a third the tab contradicts (minor scale, major third
      // played — or the reverse) is wrong however much else it covers.
      const third = scale.intervals.includes(3)
        ? 3
        : scale.intervals.includes(4)
          ? 4
          : null;
      const otherThird = third === 3 ? 4 : 3;
      const contradiction =
        third !== null && scale.id !== "blues"
          ? histogram[(tonic + otherThird) % 12]
          : 0;
      const score =
        coverage -
        0.02 * missing -
        contradiction +
        0.6 * evidence[tonic] +
        0.6 * tonicFit(tonic, scale) +
        0.03 * scale.prior;
      ranked.push({ tonic, scale, coverage, score });
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  // The exercise saying which key it is in beats any guess, as long as the
  // notes really are in it. Naming major or minor also settles the third.
  const named =
    textKey && inside(textKey.tonic, textKey.scale) >= 0.9 ? textKey : null;
  const { tonic, scale, coverage } = named
    ? { ...named, coverage: inside(named.tonic, named.scale) }
    : ranked[0];
  const key: KeyEstimate = {
    tonic,
    scale,
    coverage,
    thirdKnown: !!named || thirdKnownFor(tonic),
  };
  const pedal =
    histogram[tonic] >= 0.25 && evidence[tonic] === Math.max(...evidence);

  let kind: HarmonyKind;
  if (distinct >= 10 || coverage < 0.8) kind = pedal ? "drone" : "rhythm";
  else if (coverage < 0.9) kind = pedal ? "drone" : "rhythm";
  else if (distinct <= 2) kind = "drone";
  else kind = "tonal";

  return {
    kind,
    key: kind === "rhythm" ? null : key,
    histogram,
    distinctPitchClasses: distinct,
    ranked: ranked.slice(0, 5),
  };
}
