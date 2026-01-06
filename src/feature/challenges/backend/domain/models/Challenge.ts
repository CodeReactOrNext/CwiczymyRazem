import type { CategoryKeys } from "../../../components/Charts/ActivityChart";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { GuitarSkillId } from "feature/skills/skills.types";

export type ChallengeIntensity = "low" | "medium" | "high" | "extreme";

export type LocalizedString = string;

export interface ChallengeExercise extends Exercise {
  rewardSkillId?: GuitarSkillId;
}

export interface Challenge extends Omit<ExercisePlan, 'userId' | 'image' | 'exercises'> {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  requiredLevel: number;
  requiredSkillId: GuitarSkillId;
  category: CategoryKeys;
  unlockDescription: string;
  streakDays: number;
  rewardDescription: string;
  rewardSkillId?: GuitarSkillId;
  rewardLevel?: number;
  intensity: ChallengeIntensity;
  shortGoal: string;
  accentColor: string;
  image?: any;
  dependsOn?: string;
  exercises: ChallengeExercise[];
}

export interface ActiveChallenge {
  challengeId: string;
  startDate: string;
  lastCompletedDate: string | null;
  currentDay: number;
  totalDays: number;
}
