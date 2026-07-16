import type { DifficultyLevel, ExerciseCategory, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import type { GuitarSkillId } from "feature/skills/skills.types";
import type { Timestamp } from "firebase/firestore";

export interface CommunityExercise {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  difficulty: DifficultyLevel;
  relatedSkills: GuitarSkillId[];
  metronomeSpeed: { min: number; max: number; recommended: number } | null;
  timeInMinutes: number;
  instructions: string[];
  tips: string[];
  tablature: TablatureMeasure[];
  authorId: string;
  authorUsername: string;
  createdAt: Timestamp;
  averageRating: number;
  ratingCount: number;
  isPublic: boolean;
  /** How many times a user other than the author has started this exercise. */
  playCount: number;
  /** How many users have sent the author a "thanks" for this exercise. */
  thanksCount: number;
}

export interface CommunityExerciseRating {
  rating: number; // 1-5
  createdAt: Timestamp;
}

export interface CommunityExerciseThanks {
  createdAt: Timestamp;
}

export interface CommunityExerciseCompletion {
  createdAt: Timestamp;
}

/** Fame awarded to the author when someone thanks their exercise. */
export const THANKS_FAME_REWARD = 5;

/** Fame awarded to the author the first time a new user completes their exercise. */
export const COMPLETION_FAME_REWARD = 1;

export interface CreateCommunityExerciseInput {
  title: string;
  description: string;
  category: ExerciseCategory;
  difficulty: DifficultyLevel;
  relatedSkills: GuitarSkillId[];
  metronomeSpeed: { min: number; max: number; recommended: number } | null;
  timeInMinutes: number;
  instructions: string[];
  tips: string[];
  tablature: TablatureMeasure[];
  isPublic: boolean;
}
