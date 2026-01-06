import type { CategoryKeys } from "components/Charts/ActivityChart";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { GuitarSkillId } from "feature/skills/skills.types";

export interface Challenge extends Omit<ExercisePlan, 'userId' | 'image' | 'exercises'> {
  requiredLevel: number;
  requiredSkillId: GuitarSkillId;
  category: CategoryKeys;
  unlockDescription: string;

  // Streak properties
  streakDays: number;
  rewardDescription: string;
  rewardSkillId?: GuitarSkillId;
  rewardLevel?: number;
  intensity: "low" | "medium" | "high" | "extreme";

  // Display metadata
  shortGoal: string;
  accentColor: string;
  image?: any;
  dependsOn?: string;
  exercises: (Exercise & { rewardSkillId?: GuitarSkillId })[];
}
