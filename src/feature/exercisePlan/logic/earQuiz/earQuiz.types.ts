/** Shared ids for the five listening quizzes (chord quality, progression,
 *  detune, scale/mode, interval). Kept in their own module so `exercise.types` can type an
 *  exercise's `earQuizConfig` without importing the quiz logic — and the logic
 *  can stay free of any dependency on the exercise model. */

export type EarQuizMode =
  | "chordType"
  | "progression"
  | "detune"
  | "scaleMode"
  | "interval";

export type ChordQualityId =
  | "major"
  | "minor"
  | "dom7"
  | "maj7"
  | "min7"
  | "dim"
  | "sus4"
  | "sus2";

export type ScaleModeId =
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  | "harmonicMinor";

export type IntervalId =
  | "m2"
  | "M2"
  | "m3"
  | "M3"
  | "P4"
  | "TT"
  | "P5"
  | "m6"
  | "M6"
  | "m7"
  | "M7"
  | "P8";

/** How the two notes of an interval are sounded. */
export type IntervalDirection = "ascending" | "descending" | "harmonic";

/** Roman-numeral degrees of a major key — the tiles the player builds with. */
export type DegreeId = "I" | "ii" | "iii" | "IV" | "V" | "vi" | "vii°";

export interface ChordTypeQuizConfig {
  mode: "chordType";
  /** Which qualities are in play — also the answer buttons the player gets. */
  qualities: ChordQualityId[];
}

export interface ProgressionQuizConfig {
  mode: "progression";
  /** Ids from PROGRESSIONS; a random one is drawn per round. */
  progressions: string[];
  /** Tiles offered in the tray. Must contain every degree the progressions use. */
  degreePool: DegreeId[];
}

export interface DetuneQuizConfig {
  mode: "detune";
  /** How close (in cents) counts as in tune. */
  toleranceCents: number;
  /** The random starting error is drawn from this window, either direction. */
  minOffsetCents: number;
  maxOffsetCents: number;
}

export interface ScaleModeQuizConfig {
  mode: "scaleMode";
  /** Which modes are in play — also the answer buttons the player gets. */
  scales: ScaleModeId[];
}

export interface IntervalQuizConfig {
  mode: "interval";
  /** Which intervals are in play — also the answer buttons the player gets. */
  intervals: IntervalId[];
  /** Ways a round may sound its two notes; one is drawn per round. */
  directions: IntervalDirection[];
}

export type EarQuizConfig =
  | ChordTypeQuizConfig
  | ProgressionQuizConfig
  | DetuneQuizConfig
  | ScaleModeQuizConfig
  | IntervalQuizConfig;
