import type { GuitarSkillId } from "feature/skills/skills.types";
import type { StaticImageData } from "next/image";


export type DifficultyLevel = "easy" | "medium" | "hard";
export type ExerciseCategory = "technique" | "theory" | "creativity" | "hearing" | "mixed";

export type LocalizedContent = string;

export interface TablatureNote {
  string: number; // 1-6 (1 is high E)
  fret: number;
  isAccented?: boolean;
  isHammerOn?: boolean;
  isPullOff?: boolean;
  isBend?: boolean;
  bendSemitones?: number; // 1 = half step, 2 = whole step, 3 = step-and-a-half
  isPreBend?: boolean;
  isRelease?: boolean;
  isVibrato?: boolean;
  isTap?: boolean;
  dynamics?: number; // 0.0 (pp) to 1.0 (ff) — expected volume level
}

export interface TablatureBeat {
  notes: TablatureNote[];
  duration: number; // 1 = quarter note, 0.5 = eighth note
  chordName?: string;
}

export interface TablatureMeasure {
  beats: TablatureBeat[];
  timeSignature: [number, number]; // e.g. [4, 4]
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
  hideTablatureNotes?: boolean;
  customGoal?: string;
  customGoalDescription?: string;
  riddleConfig?: ExerciseRiddleConfig;
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
