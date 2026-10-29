import { parseChordSymbol } from "feature/autoBacking/harmonize";
import type { ChordQuality, PitchClass } from "feature/autoBacking/theory";
import { chordTonesOf, pcName, pcOf, scaleById, usesFlats } from "feature/autoBacking/theory";
import type { Translate } from "lib/i18n/translate";

import type { ChangesMode, ChangesVariation } from "../types/boss.types";

/** What a chord tone is to its chord. */
export type ToneRole = "root" | "third" | "fifth" | "seventh";

/** What a played note was against the chord under it. */
export type NoteRole = ToneRole | "passing" | "outside";

/** The seven notes of each mode's scale — what its sevenths are stacked from. */
const MODE_SCALE: Readonly<Record<Exclude<ChangesMode, "blues">, readonly number[]>> = {
  ionian: scaleById("major").intervals,
  aeolian: scaleById("minor").intervals,
  dorian: scaleById("dorian").intervals,
  mixolydian: scaleById("mixolydian").intervals,
  harmonicMinor: scaleById("harmonicMinor").intervals,
};

/**
 * Notes that belong over a mode's chords without being any of them — a
 * passing tone, not a wrong one. The blues takes the mixolydian and the minor
 * pentatonic's blue notes both; harmonic minor its natural seventh too.
 */
const KEY_NOTES: Readonly<Record<ChangesMode, readonly number[]>> = {
  ionian: MODE_SCALE.ionian,
  aeolian: MODE_SCALE.aeolian,
  dorian: MODE_SCALE.dorian,
  mixolydian: MODE_SCALE.mixolydian,
  harmonicMinor: [0, 2, 3, 5, 7, 8, 10, 11],
  blues: [0, 2, 3, 4, 5, 6, 7, 9, 10],
};

/** The seventh a scale stacks on its degree `offset`, or null where the chord name wouldn't read (mMaj7, m7b5). */
const SEVENTH_BY_INTERVALS: Readonly<Record<string, ChordQuality>> = {
  "4,7,11": "maj7",
  "4,7,10": "7",
  "3,7,10": "min7",
};

export const seventhOf = (scale: readonly number[], offset: number): ChordQuality | null => {
  const at = scale.indexOf(offset);
  if (at < 0 || scale.length !== 7) return null;
  const above = (steps: number) => (scale[(at + steps) % 7] - offset + 12) % 12;
  return SEVENTH_BY_INTERVALS[[above(2), above(4), above(6)].join()] ?? null;
};

/** The seventh a mode's own scale stacks on its degree `offset` — none in the blues, or where the name wouldn't read. */
export const modeSeventh = (mode: ChangesMode, offset: number): ChordQuality | null =>
  mode === "blues" ? null : seventhOf(MODE_SCALE[mode], offset);

const tonesCache = new Map<string, readonly PitchClass[]>();

/** The pitch classes a chord name spells, root first; none for a name that doesn't parse. */
export const chordTones = (name: string): readonly PitchClass[] => {
  let tones = tonesCache.get(name);
  if (!tones) {
    const chord = parseChordSymbol(name);
    tones = chord ? chordTonesOf(chord) : [];
    tonesCache.set(name, tones);
  }
  return tones;
};

/** The root of a chord name, or null. */
export const chordRoot = (name: string): PitchClass | null => parseChordSymbol(name)?.root ?? null;

/** A chord with a minor third wears the tragedy; the rest the comedy. */
export const chordMood = (name: string): "major" | "minor" => {
  const root = chordRoot(name);
  return root !== null && chordTones(name).includes((root + 3) % 12) ? "minor" : "major";
};

const ROLE_BY_INTERVAL: Readonly<Record<number, ToneRole>> = {
  0: "root",
  3: "third",
  4: "third",
  6: "fifth",
  7: "fifth",
  10: "seventh",
  11: "seventh",
};

/** What pitch class `pc` is to the chord, or null when it isn't one of its tones. */
export const toneRole = (name: string, pc: PitchClass): ToneRole | null => {
  const root = chordRoot(name);
  if (root === null || !chordTones(name).includes(pc)) return null;
  return ROLE_BY_INTERVAL[(pc - root + 12) % 12] ?? null;
};

/** The tones that say what a chord is — its third and seventh. */
export const isGuideTone = (role: NoteRole) => role === "third" || role === "seventh";

const DEGREE_LABELS: Readonly<Record<number, string>> = {
  0: "R",
  3: "b3",
  4: "3",
  6: "b5",
  7: "5",
  10: "b7",
  11: "7",
};

/** A chord tone as players name it against the root: R, b3, 3, 5, b7… */
export const degreeLabel = (name: string, pc: PitchClass) => {
  const root = chordRoot(name);
  return root === null ? "" : (DEGREE_LABELS[(pc - root + 12) % 12] ?? "");
};

const keyNotes = ({ tonic, mode }: ChangesVariation["key"]) =>
  new Set<PitchClass>(KEY_NOTES[mode].map((interval) => (tonic + interval) % 12));

/** Every tone of the chord is one of the key's own notes. */
export const inKey = (chord: string, key: ChangesVariation["key"]) => {
  const notes = keyNotes(key);
  return chordTones(chord).every((tone) => notes.has(tone));
};

/**
 * The notes to play over a chord between its strong beats: the key's own,
 * each tone of the chord from outside them standing in for the note it
 * alters — over E7 in C major G# for G, over B♭ the B goes. A root from
 * outside the key is a lowered degree (B♭ for B), and so the chord's other
 * tones are counted from it. The blues has all its notes already and only
 * adds.
 */
export const chordScale = (chord: string, key: ChangesVariation["key"]): ReadonlySet<PitchClass> => {
  const { tonic, mode } = key;
  const notes = keyNotes(key);
  const tones = chordTones(chord);
  const root = chordRoot(chord);
  if (root === null || tones.every((tone) => notes.has(tone))) return notes;
  const scale = mode === "blues" ? null : MODE_SCALE[mode];
  const degree = (root - tonic + 12) % 12;
  const rootStep = scale ? (scale.includes(degree) ? scale.indexOf(degree) : scale.indexOf((degree + 1) % 12)) : -1;
  tones.forEach((tone, k) => {
    if (notes.has(tone)) return;
    if (scale && rootStep >= 0) {
      // Root, third, fifth, seventh: every other step of the scale up from the root.
      const altered = (tonic + scale[(rootStep + 2 * k) % 7]) % 12;
      if (!tones.includes(altered)) notes.delete(altered);
    }
    notes.add(tone);
  });
  return notes;
};

/**
 * A note's name the way the key spells it — or, given the chord it is played
 * over, the way the chord does: B♭ over a B♭ borrowed into C major.
 */
export const noteName = (pc: PitchClass, key: ChangesVariation["key"], chord?: string) => {
  const accidental = chord?.[1];
  return pcName(pc, accidental === "b" ? true : accidental === "#" ? false : usesFlats(key.tonic, key.mode));
};

/** A key as the fight names it — "A minor", "D dorian" — the mode in the reader's language. */
export const keyLabel = (key: ChangesVariation["key"], t: Translate) =>
  `${noteName(key.tonic, key)} ${t(`key_mode.${key.mode}`)}`;

/** The MIDI note of a frequency, nearest semitone. */
export const midiOf = (hz: number) => Math.round(69 + 12 * Math.log2(hz / 440));

/** The pitch class of a frequency, nearest semitone. */
export const pitchClassOf = (hz: number): PitchClass => pcOf(midiOf(hz));
