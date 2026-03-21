import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";

export const getDailyExerciseRecommendation = (isPremium = false): ExercisePlan | null => {
  const pool = isPremium ? defaultPlans : defaultPlans.filter((p) => !p.premium);
  if (!pool || pool.length === 0) return null;

  // Generate a deterministic index based on the current date
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  // Simple hash function for the date string
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % pool.length;
  return pool[index];
};
