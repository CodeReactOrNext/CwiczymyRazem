import type { GuitarSkillId } from "feature/skills/skills.types";
import type { StaticImageData } from "next/image";


export type DifficultyLevel = "easy" | "medium" | "hard";
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
  midiNote?: number; // GM MIDI note number — for drums (35=kick, 38=snare, 42=hi-hat, etc.)
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

export interface TablatureBeat {
  notes: TablatureNote[];
  duration: number; // 1 = quarter note, 0.5 = eighth note
  chordName?: string;
  tuplet?: number; // e.g. 3 = triplet, 5 = quintuplet
}

export interface TablatureMeasure {
  beats: TablatureBeat[];
  timeSignature: [number, number]; // e.g. [4, 4]
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

export type ExerciseRiddleConfig = SequenceRepeatRiddleConfig | ImprovPromptRiddleConfig;

// ─── Strumming Pattern Types ─────────────────────────────────────────────────

export type StrumDirection = 'down' | 'up' | 'miss';

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
  title: LocalizedContent;
  description: LocalizedContent;
  difficulty: DifficultyLevel;
  category: ExerciseCategory;
  timeInMinutes: number;
  instructions: LocalizedContent[];
  tips: LocalizedContent[];
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
  riddleConfig?: ExerciseRiddleConfig;
  strummingPatterns?: StrumPattern[];
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
  author?: {
    name: string;
    avatar: StaticImageData;
  };
}
