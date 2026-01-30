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
}

export interface TablatureBeat {
  notes: TablatureNote[];
  duration: number; // 1 = quarter note, 0.5 = eighth note
}

export interface TablatureMeasure {
  beats: TablatureBeat[];
  timeSignature: [number, number]; // e.g. [4, 4]
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
