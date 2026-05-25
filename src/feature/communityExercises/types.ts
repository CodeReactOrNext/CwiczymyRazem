import type { Timestamp } from "firebase/firestore";
import type { DifficultyLevel, ExerciseCategory, TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import type { GuitarSkillId } from "feature/skills/skills.types";

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
}

export interface CommunityExerciseRating {
  rating: number; // 1-5
  createdAt: Timestamp;
}

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
