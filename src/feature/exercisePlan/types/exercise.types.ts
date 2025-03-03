import type { GuitarSkillId } from "feature/skills/skills.types";
import type { StaticImageData } from "next/image";


export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type ExerciseCategory = "technique" | "theory" | "creativity" | "hearing";

export interface LocalizedContent {
  pl: string;
  en: string;
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
  };
  relatedSkills: GuitarSkillId[];
  image?: StaticImageData;
}

export interface ExercisePlan {
  id: string;
  title: string | LocalizedContent;
  difficulty: DifficultyLevel;
  updatedAt: Date;
  description: string | LocalizedContent;
  category: ExerciseCategory;
  exercises: Exercise[];
  totalDuration: number;
  createdAt: Date;
  userId: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  bestSpeed: number;
  lastSpeed: number;
  timeSpent: number;
  lastPracticed: Date;
  notes: string;
  rating: number;
  difficultyLevel: number; // 1-10 scale
  masteryProgress: number; // 0-100%
  nextMilestone: {
    type: 'speed' | 'accuracy' | 'duration';
    target: number;
    current: number;
  };
} 