import { NOTES } from "utils/audio/noteUtils";

/**
 * The intervals the click drills can ask for. Deliberately ascending and inside
 * one octave: the drills answer with pitch classes (a note is a note wherever it
 * sits on the neck), so a unison/octave would ask for the root all over again.
 */
export interface IntervalDefinition {
  id: string;
  /** Full name, as the prompt reads it out: "Perfect 5th". */
  name: string;
  /** Scale-degree shorthand for the compact badge: "5", "♭3". */
  degree: string;
  semitones: number;
}

export const INTERVALS: readonly IntervalDefinition[] = [
  { id: "m2", name: "Minor 2nd", degree: "♭2", semitones: 1 },
  { id: "M2", name: "Major 2nd", degree: "2", semitones: 2 },
  { id: "m3", name: "Minor 3rd", degree: "♭3", semitones: 3 },
  { id: "M3", name: "Major 3rd", degree: "3", semitones: 4 },
  { id: "P4", name: "Perfect 4th", degree: "4", semitones: 5 },
  { id: "TT", name: "Tritone", degree: "♭5", semitones: 6 },
  { id: "P5", name: "Perfect 5th", degree: "5", semitones: 7 },
  { id: "m6", name: "Minor 6th", degree: "♭6", semitones: 8 },
  { id: "M6", name: "Major 6th", degree: "6", semitones: 9 },
  { id: "m7", name: "Minor 7th", degree: "♭7", semitones: 10 },
  { id: "M7", name: "Major 7th", degree: "7", semitones: 11 },
] as const;

/** Look intervals up by id, for exercises that only want a subset. */
export function intervalsByIds(ids: readonly string[]): IntervalDefinition[] {
  return ids
    .map((id) => INTERVALS.find((i) => i.id === id))
    .filter((i): i is IntervalDefinition => !!i);
}

/** The interval `semitones` above a root — undefined for a unison/octave. */
export function intervalBySemitones(semitones: number): IntervalDefinition | undefined {
  return INTERVALS.find((i) => i.semitones === (((semitones % 12) + 12) % 12));
}

/** Note name `semitones` above `root`, wrapped into one octave. Empty for an unknown root. */
export function noteAtInterval(root: string, semitones: number): string {
  const rootPitchClass = NOTES.indexOf(root);
  if (rootPitchClass < 0) return "";
  return NOTES[(rootPitchClass + ((semitones % 12) + 12) % 12) % 12];
}

/**
 * Ascending distance from `root` to `target` in semitones (0–11). -1 when either
 * name is unknown — the drill treats that as "no interval to show".
 */
export function semitonesBetween(root: string, target: string): number {
  const rootPitchClass = NOTES.indexOf(root);
  const targetPitchClass = NOTES.indexOf(target);
  if (rootPitchClass < 0 || targetPitchClass < 0) return -1;
  return ((targetPitchClass - rootPitchClass) % 12 + 12) % 12;
}
