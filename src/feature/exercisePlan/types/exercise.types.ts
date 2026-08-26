import type { EarQuizConfig } from "feature/exercisePlan/logic/earQuiz/earQuiz.types";
import type { GuitarSkillId } from "feature/skills/skills.types";
import type { StaticImageData } from "next/image";


export type DifficultyLevel = "beginner" | "easy" | "medium" | "hard";
export type ExerciseCategory = "technique" | "theory" | "creativity" | "hearing" | "mixed";

export type LocalizedContent = string;

export interface BendPoint {
  /** Relative position in the note: 0.0 = note start, 1.0 = note end */
  position: number;
  /** Pitch shift in cents (100 = 1 semitone, 200 = 1 whole step) */
  cents: number;
}

export interface TablatureNote {
  string: number; // 1-6 (1 is high E)
  fret: number;
  isAccented?: boolean;
  isHammerOn?: boolean;
  isPullOff?: boolean;
  isBend?: boolean;
  /** Full bend automation curve — preferred over bendSemitones when present */
  bendCurve?: BendPoint[];
  bendSemitones?: number; // 1 = half step, 2 = whole step (kept for display badge)
  isPreBend?: boolean;
  isRelease?: boolean;
  isVibrato?: boolean;
  isTap?: boolean;
  dynamics?: number; // 0.0 (pp) to 1.0 (ff) — expected volume level
  // Real sounding MIDI pitch. Drums: GM note (35=kick, 38=snare, …). Vocals: notated pitch.
  // Guitar/bass: open-string tuning + fret, so alternate tunings (Drop C/D, 7-string, capo)
  // score against the actual pitch instead of assuming standard tuning.
  midiNote?: number;
  // Extended techniques
  isDead?: boolean;       // muted/dead note — shown as X, percussive thud sound
  isGhost?: boolean;      // ghost note — softer, shown semi-transparent
  isPalmMute?: boolean;   // palm mute — heavy muting, very short decay
  isLetRing?: boolean;    // let ring — sustained beyond beat duration
  isStaccato?: boolean;   // staccato — very short, detached
  harmonicType?: number;  // 0=None, 1=Natural, 2=Artificial, 3=Tapped, 4=Pinch, 5=Semi
  slideIn?: number;       // 0=None, 1=IntoFromBelow, 2=IntoFromAbove
  slideOut?: number;      // 0=None, 1=Shift, 2=Legato, 3=SlideTo
}

/** Picking direction marked above the tab: "down" = ⊓ (downstroke), "up" = ⋁ (upstroke). */
export type PickStroke = "down" | "up";

export interface TablatureBeat {
  notes: TablatureNote[];
  duration: number; // 1 = quarter note, 0.5 = eighth note
  chordName?: string;
  tuplet?: number; // e.g. 3 = triplet, 5 = quintuplet
  /** Picking direction for the whole beat — a chord is struck one way, not per note.
   *  Rendered above the staff in both the flat tab and the standard notation
   *  (alphaTex `{sd}` / `{su}`). Omitted = no marking. */
  pickStroke?: PickStroke;
}

export interface TablatureMeasure {
  beats: TablatureBeat[];
  timeSignature: [number, number]; // e.g. [4, 4]
  /** If true, this measure is played only on the first loop — skipped on all subsequent repeats */
  firstLoopOnly?: boolean;
  /** If true, this measure is played only on the last loop — skipped on all preceding repeats */
  lastLoopOnly?: boolean;
  /** Tempo ratio relative to score.tempo (e.g. 0.869 = 146/168). Present only when the
   *  tempo changes at this measure. The cursor uses it to compute effective BPM so that
   *  playback speed-scaling (bpm / originalBpm) stays in sync with AlphaTabPlayer. */
  tempoChange?: number;
}

export interface ImprovPrompt {
  text: string;
  category: 'notes' | 'rhythm' | 'dynamics' | 'phrasing' | 'position' | 'technique' | 'behavior' | 'style' | 'form' | 'harmony' | 'melody';
}

export interface SequenceRepeatRiddleConfig {
  mode: 'sequenceRepeat';
  difficulty: 'easy' | 'medium' | 'hard';
  noteCount: number;
  range?: { minFret: number; maxFret: number; strings: number[] };
}

export interface ImprovPromptRiddleConfig {
  mode: 'improvPrompt';
  difficulty: 'easy' | 'medium' | 'hard';
  promptIntervalSeconds: number;
  prompts: ImprovPrompt[];
  simultaneousPrompts: number;
}

type ExerciseRiddleConfig = SequenceRepeatRiddleConfig | ImprovPromptRiddleConfig;

// ─── Strumming Pattern Types ─────────────────────────────────────────────────

type StrumDirection = 'down' | 'up' | 'miss';

export interface StrumBeat {
  /** Which direction to strum, or 'miss' for silence/gap */
  direction: StrumDirection;
  /** Muted / chuck strum — shown with an X */
  muted?: boolean;
  /** Accented — louder emphasis */
  accented?: boolean;
}

/**
 * One repeating strum pattern (e.g. one bar of 4/4 with 8th-note subdivisions).
 * `strums` length must equal `timeSignature[0] * subdivisions`.
 */
export interface StrumPattern {
  name?: string;
  timeSignature: [number, number];
  /** Subdivisions per beat: 2 = 8th notes, 4 = 16th notes */
  subdivisions: number;
  strums: StrumBeat[];
  /** Optional chord label displayed above this pattern (single chord) */
  chord?: string;
  /** Optional chord progression — one chord name per loop/bar, cycles automatically */
  chords?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────

export interface BackingTrack {
  id: string;
  name: string;
  measures: TablatureMeasure[];
  trackType?: 'guitar' | 'bass' | 'drums' | 'vocals';
  pan?: number; // -1.0 (left) to 1.0 (right)
}

export interface Exercise {
  id: string;
  premium?: boolean;
  /** ISO date (YYYY-MM-DD) the exercise was added to the library. Used to show a
   *  "New" badge and surface recent exercises at the top of the browse table.
   *  See feature/exercisePlan/utils/isExerciseNew. */
  addedAt?: string;
  title: LocalizedContent;
  description: LocalizedContent;
  difficulty: DifficultyLevel;
  category: ExerciseCategory;
  timeInMinutes: number;
  instructions: LocalizedContent[];
  tips: LocalizedContent[];
  whyItMatters?: string;
  metronomeSpeed: {
    min: number;
    max: number;
    recommended: number;
  } | null;
  relatedSkills: GuitarSkillId[];
  image?: StaticImageData;
  videoUrl?: string | null;
  imageUrl?: string | null;
  spotifyId?: string;
  youtubeVideoId?: string;
  isPlayalong?: boolean;
  links?: {
    label: string;
    url: string;
  }[];
  tablature?: TablatureMeasure[];
  backingTracks?: BackingTrack[];
  gpFileUrl?: string;
  hideTablatureNotes?: boolean;
  customGoal?: string;
  customGoalDescription?: string;
  /** For exercises whose customGoal is randomized: picks a fresh target. Called
   *  once when the exercise is entered or restarted, so the goal stays stable
   *  during a session (e.g. across pauses). See randomNoteHunt. */
  rerollCustomGoal?: () => void;
  /** Marks a rotating note-hunt: the target note is re-rolled every
   *  `rotateSeconds` (via rerollCustomGoal) while the session is playing, with a
   *  visible countdown. `mode` selects the variant:
   *   - "octaves" (default): find the note across the whole neck.
   *   - "region": also rotates a fretboard window (customGoalRegion) + renders the neck.
   *   - "interval": customGoal is the (hidden) answer; show customGoalPrompt instead.
   *   - "chord": customGoal is a chord name; track its tones via useChordHunt.
   *   - "click": no mic — the player clicks the target note's position(s) directly
   *     on a fretboard diagram (customGoalRegion + customGoalStrings scope the
   *     valid cells). See useClickHunt / ClickHuntPanel.
   *   - "intervalClick": the click drill in two steps — customGoalPrompt holds the
   *     root + interval, customGoal the (hidden) note the interval lands on. The
   *     player clicks every root position first, then every target position. See
   *     useIntervalClickHunt / IntervalClickPanel.
   *   - "accumulate": like "octaves", but progress accumulates ACROSS rotations
   *     instead of resetting per-target — the exam accuracy is (distinct notes
   *     completed so far) / 12, for "hit every chromatic note before the clock
   *     runs out" exams. See the String Hunt / Whole Neck Hunt exercises.
   *  See randomNoteHunt / fretboardRegionHunt / intervalHunt / buildTheChord. */
  noteHuntConfig?: { rotateSeconds: number; mode?: "octaves" | "region" | "interval" | "chord" | "click" | "accumulate" | "intervalClick" };
  /** Restricts which strings (1-6, 1 = high e) are in play. Omitted = all 6.
   *  Combined with customGoalRegion's fret window to compute the exact set of
   *  valid (string, fret) positions — the clickable targets in "click" mode, and
   *  in the mic-driven modes the octaves that count as a hit (one string + a
   *  12-fret window = exactly one octave per note, which is how "play it on the
   *  G string" gets enforced through a pitch detector that can't hear strings). */
  customGoalStrings?: number[];
  /** Rotating hunts: returns a fresh target each call. A plain function (not a
   *  getter) so it survives object spreads/clones — the rotation hook holds the
   *  result in React state. See randomNoteHunt / intervalHunt / buildTheChord. */
  rollHuntTarget?: () => {
    goal: string;
    prompt?: { title: string; subtitle?: string };
    region?: { startFret: number; endFret: number };
  };
  /** For region-mode note hunts: the fret window the target must be found in.
   *  Re-rolled alongside customGoal. */
  customGoalRegion?: { startFret: number; endFret: number };
  /** Prompt to show on the goal card when the answer must stay hidden (interval
   *  mode): e.g. { title: "A", subtitle: "Perfect 5th ↑" }. The real target stays
   *  in customGoal for detection. Re-rolled alongside customGoal. */
  customGoalPrompt?: { title: string; subtitle?: string };
  riddleConfig?: ExerciseRiddleConfig;
  /** Turns the exercise into one of the click-to-answer listening quizzes
   *  (chord quality, progression, tuning by ear, scale/mode). The panel plays
   *  the question and grades the answer itself — no mic, no tablature.
   *  See EarQuizPanel / feature/exercisePlan/logic/earQuiz. */
  earQuizConfig?: EarQuizConfig;
  strummingPatterns?: StrumPattern[];
  _generatorConfig?: any;
  /** Audio file played as backing in exam mode. sourceBpm must match the file's recorded tempo. */
  examBacking?: { url: string; sourceBpm: number };
  /** Overrides the derived "no guitar needed" answer for exercises the shape of
   *  the config can't reveal — e.g. the metronome gap test, which is answered
   *  with the spacebar. See feature/exercisePlan/utils/isNoGuitarExercise. */
  noGuitarNeeded?: boolean;
  disableMic?: boolean;
  disableBackingTrack?: boolean;
  disableTuner?: boolean;
  isHiddenFromLibrary?: boolean;
  requiresBackingTrack?: boolean;
  /** Overrides the generic YouTube search phrases in BackingTrackPicker with
   *  phrasing tailored to this exercise (e.g. "Single Chord Backing Track"
   *  instead of just "Guitar Backing Track"). Only used when requiresBackingTrack
   *  is set. Picked randomly, never repeating the previous pick — same rotation
   *  logic as the default phrase list. */
  backingTrackSearchQueries?: string[];
  additionalText?: string;
  isHiddenFromLanding?: boolean;
}

export interface ExercisePlan {
  id: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
  difficulty: DifficultyLevel;
  description: string;
  category: ExerciseCategory | 'mixed';
  exercises: Exercise[];
  userId: string;
  image: StaticImageData | null;
  premium?: boolean;
  author?: {
    name: string;
    avatar: StaticImageData;
  };
  isPublic?: boolean;
  authorUsername?: string;
  /** Author's avatar URL, stored when a user publishes their plan to the community. */
  authorAvatar?: string;
  /** Optional appearance overrides chosen in the create/edit wizard. Resolved to
   *  Tailwind classes / icon component via feature/exercisePlan/data/planAppearance.
   *  When absent, PlanCard falls back to the category-derived style. */
  icon?: string;
  color?: string;
  /** Set when this plan is a synthetic wrapper around a single song (e.g. GP-file/tab
   *  practice from `/songs/practice/[songId]`), so the session report is logged and
   *  scored as a song practice instead of a generic exercise. */
  song?: {
    id: string;
    title: string;
    artist: string;
  };
}

/** Which high score a run competes against — one per scored exercise kind. */
export type ExerciseScoreType = "mic" | "click" | "earTraining";

/** A scored run of one exercise, collected so the session summary can place it
 *  on that exercise's leaderboard. */
export interface ScoredRun {
  exerciseId: string;
  exerciseTitle: string;
  score: number;
  scoreType: ExerciseScoreType;
  /** The player's record on this exercise before the session touched it; 0 on a first run. */
  previousBest: number;
  /** Tempo the run was played at; absent on exercises without a metronome. */
  bpm?: number;
}
