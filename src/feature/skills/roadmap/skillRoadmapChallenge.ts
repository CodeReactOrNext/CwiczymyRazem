import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import type { DashboardExercise } from "feature/skills/components/SkillDashboard";
import { guitarSkills } from "feature/skills/data/guitarSkills";

/** The colour each difficulty is named in, shared by every roadmap surface. */
export const DIFFICULTY_HEX: Record<Exercise["difficulty"], string> = {
  beginner: "#38bdf8",
  easy: "#34d399",
  medium: "#fbbf24",
  hard: "#fb7185",
};

/**
 * One exercise as a one-item plan — the same shape the browse tab hands to the
 * practice session, so a roadmap start behaves exactly like a start from a list.
 */
export const toDashboardExercise = (exercise: Exercise): DashboardExercise => {
  const skillId = exercise.relatedSkills[0] || "general";
  const skill = guitarSkills.find((s) => s.id === skillId);
  const category =
    skill?.category ??
    (exercise.category !== "mixed" ? exercise.category : "technique");
  return {
    id: exercise.id,
    title: exercise.title,
    description: exercise.description,
    category,
    requiredSkillId: skillId,
    requiredLevel:
      exercise.difficulty === "hard"
        ? 2
        : exercise.difficulty === "medium"
          ? 1
          : 0,
    rewardDescription: "Practice complete",
    exercises: [exercise],
    unlockDescription: "",
    streakDays: 0,
    intensity: "medium",
    shortGoal: "",
    accentColor: "#ffffff",
    difficulty: exercise.difficulty,
    tablature: exercise.tablature,
  };
};
