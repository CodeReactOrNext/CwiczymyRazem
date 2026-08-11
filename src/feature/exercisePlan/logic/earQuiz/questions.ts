import { buildChordMidi, sortChordQualities } from "./chordQualities";
import type {
  ChordQualityId,
  ChordTypeQuizConfig,
  DegreeId,
  DetuneQuizConfig,
  EarQuizConfig,
  ProgressionQuizConfig,
  ScaleModeId,
  ScaleModeQuizConfig,
} from "./earQuiz.types";
import type { ProgressionChord } from "./progressions";
import { buildProgressionChords, findProgression, midiToNoteName, PROGRESSIONS, sortDegrees } from "./progressions";
import { buildDroneMidi, buildScaleMidi, sortScaleModes } from "./scaleModes";

export type Rng = () => number;

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length) % items.length];

/** Draws from `items`, never returning `exclude` — unless it is the only option. */
const pickFresh = <T>(items: readonly T[], exclude: T | undefined, rng: Rng): T => {
  const fresh = items.filter((item) => item !== exclude);
  return fresh.length > 0 ? pick(fresh, rng) : items[0];
};

const randomInt = (min: number, max: number, rng: Rng): number => min + Math.floor(rng() * (max - min + 1));

// Roots are drawn from a middle register: high enough that a stacked chord stays
// clear on laptop speakers, low enough that the top voice never gets shrill.
const CHORD_ROOT_RANGE = { min: 48, max: 59 } as const; // C3 – B3
const KEY_ROOT_RANGE = { min: 50, max: 59 } as const; // D3 – B3 (the bass note sits an octave under)
const SCALE_ROOT_RANGE = { min: 55, max: 64 } as const; // G3 – E4

export interface ChordTypeQuestion {
  kind: "chordType";
  rootMidi: number;
  rootName: string;
  quality: ChordQualityId;
  /** The chord as it will be sounded, low to high. */
  midis: number[];
  options: ChordQualityId[];
}

export interface ProgressionQuestion {
  kind: "progression";
  progressionId: string;
  keyRootMidi: number;
  /** Key the round is in, e.g. "G major". */
  keyName: string;
  degrees: DegreeId[];
  chords: ProgressionChord[];
  /** Tonic chord, for the "hear the key" reference button. */
  tonicMidis: number[];
  tiles: DegreeId[];
  heardIn: string;
}

export interface DetuneQuestion {
  kind: "detune";
  referenceMidi: number;
  referenceName: string;
  /** How far out of tune the second note starts, in cents (can be negative). */
  offsetCents: number;
  toleranceCents: number;
}

export interface ScaleModeQuestion {
  kind: "scaleMode";
  rootMidi: number;
  rootName: string;
  scale: ScaleModeId;
  /** The scale run, ascending. */
  midis: number[];
  /** Root + 5th held under the run so the tonic is unmistakable. */
  droneMidis: number[];
  options: ScaleModeId[];
}

export type EarQuizQuestion =
  | ChordTypeQuestion
  | ProgressionQuestion
  | DetuneQuestion
  | ScaleModeQuestion;

export const generateChordTypeQuestion = (
  config: ChordTypeQuizConfig,
  previous?: ChordTypeQuestion | null,
  rng: Rng = Math.random,
): ChordTypeQuestion => {
  const quality = pickFresh(config.qualities, previous?.quality, rng);
  const rootMidi = randomInt(CHORD_ROOT_RANGE.min, CHORD_ROOT_RANGE.max, rng);
  return {
    kind: "chordType",
    rootMidi,
    rootName: midiToNoteName(rootMidi),
    quality,
    midis: buildChordMidi(rootMidi, quality),
    options: sortChordQualities(config.qualities),
  };
};

export const generateProgressionQuestion = (
  config: ProgressionQuizConfig,
  previous?: ProgressionQuestion | null,
  rng: Rng = Math.random,
): ProgressionQuestion => {
  const pool = config.progressions
    .map(findProgression)
    .filter((p): p is NonNullable<typeof p> => !!p);
  const available = pool.length > 0 ? pool : PROGRESSIONS;
  const progression = pickFresh(available, available.find((p) => p.id === previous?.progressionId), rng);

  const keyRootMidi = randomInt(KEY_ROOT_RANGE.min, KEY_ROOT_RANGE.max, rng);
  const chords = buildProgressionChords(keyRootMidi, progression.degrees);

  return {
    kind: "progression",
    progressionId: progression.id,
    keyRootMidi,
    keyName: `${midiToNoteName(keyRootMidi)} major`,
    degrees: progression.degrees,
    chords,
    tonicMidis: buildProgressionChords(keyRootMidi, ["I"])[0].midis,
    tiles: sortDegrees(config.degreePool),
    heardIn: progression.heardIn,
  };
};

// Guitar-register reference pitches: the open strings the ear already knows,
// plus the two most common tuning checks around them.
const DETUNE_REFERENCE_MIDI = [50, 52, 55, 57, 59, 62]; // D3 E3 G3 A3 B3 D4

export const generateDetuneQuestion = (
  config: DetuneQuizConfig,
  previous?: DetuneQuestion | null,
  rng: Rng = Math.random,
): DetuneQuestion => {
  const referenceMidi = pickFresh(DETUNE_REFERENCE_MIDI, previous?.referenceMidi, rng);
  const magnitude = randomInt(config.minOffsetCents, config.maxOffsetCents, rng);
  const sign = rng() < 0.5 ? -1 : 1;
  return {
    kind: "detune",
    referenceMidi,
    referenceName: midiToNoteName(referenceMidi),
    offsetCents: magnitude * sign,
    toleranceCents: config.toleranceCents,
  };
};

export const generateScaleModeQuestion = (
  config: ScaleModeQuizConfig,
  previous?: ScaleModeQuestion | null,
  rng: Rng = Math.random,
): ScaleModeQuestion => {
  const scale = pickFresh(config.scales, previous?.scale, rng);
  const rootMidi = randomInt(SCALE_ROOT_RANGE.min, SCALE_ROOT_RANGE.max, rng);
  return {
    kind: "scaleMode",
    rootMidi,
    rootName: midiToNoteName(rootMidi),
    scale,
    midis: buildScaleMidi(rootMidi, scale),
    droneMidis: buildDroneMidi(rootMidi),
    options: sortScaleModes(config.scales),
  };
};

/** Rolls the next round for whichever quiz the exercise is configured as. */
export const generateEarQuizQuestion = (
  config: EarQuizConfig,
  previous?: EarQuizQuestion | null,
  rng: Rng = Math.random,
): EarQuizQuestion => {
  const sameKind = previous && previous.kind === config.mode ? previous : null;
  if (config.mode === "chordType") return generateChordTypeQuestion(config, sameKind as ChordTypeQuestion | null, rng);
  if (config.mode === "progression") return generateProgressionQuestion(config, sameKind as ProgressionQuestion | null, rng);
  if (config.mode === "detune") return generateDetuneQuestion(config, sameKind as DetuneQuestion | null, rng);
  return generateScaleModeQuestion(config, sameKind as ScaleModeQuestion | null, rng);
};

// ── Answer checking ──────────────────────────────────────────────────────────

/** Cents the player is still out by after moving the slider. */
export const remainingDetuneCents = (question: DetuneQuestion, sliderCents: number): number =>
  question.offsetCents + sliderCents;

export const isDetuneSolved = (question: DetuneQuestion, sliderCents: number): boolean =>
  Math.abs(remainingDetuneCents(question, sliderCents)) <= question.toleranceCents;

/**
 * How fast the two notes beat against each other at a given error — the thing
 * the player is actually listening for, shown as feedback after an answer.
 * Two pitches `cents` apart beat at the difference of their frequencies.
 */
export const beatsPerSecond = (referenceFrequency: number, cents: number): number =>
  Math.abs(referenceFrequency * (Math.pow(2, cents / 1200) - 1));

export const centsToRatio = (cents: number): number => Math.pow(2, cents / 1200);

/** Per-slot verdicts for a built progression answer. */
export const checkProgressionAnswer = (
  question: ProgressionQuestion,
  answer: (DegreeId | null)[],
): boolean[] => question.degrees.map((degree, i) => answer[i] === degree);
