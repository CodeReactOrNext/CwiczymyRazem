/** Shared ids for the four listening quizzes (chord quality, progression,
 *  detune, scale/mode). Kept in their own module so `exercise.types` can type an
 *  exercise's `earQuizConfig` without importing the quiz logic — and the logic
 *  can stay free of any dependency on the exercise model. */

export type EarQuizMode = "chordType" | "progression" | "detune" | "scaleMode";

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

export type EarQuizConfig =
  | ChordTypeQuizConfig
  | ProgressionQuizConfig
  | DetuneQuizConfig
  | ScaleModeQuizConfig;
