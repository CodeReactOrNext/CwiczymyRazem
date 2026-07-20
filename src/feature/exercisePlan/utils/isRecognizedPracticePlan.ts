import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";

/**
 * Whether `planId` belongs to an actual, deliberately-selected Practice Plan
 * (a default plan or an auto-generated one) rather than an ad-hoc single-exercise
 * session (Skill Dashboard, Exercise Library, scale drills, quick GP-tab
 * sessions, ...), which reuse the `ExercisePlan` shape but were never picked
 * from "My Plans" / "Browse Plans".
 */
export const isRecognizedPracticePlanId = (planId: string): boolean =>
  planId.startsWith("auto") || defaultPlans.some((p) => p.id === planId);

/**
 * Whether a finished session represents a real Practice Plan and should count
 * toward the "Complete a Practice Plan" daily quest. A session with more than
 * one exercise is always a real plan; a single-exercise session only counts if
 * it matches a recognized (default or auto-generated) plan id — see #731.
 */
export const isRecognizedPracticePlan = (
  plan: Pick<ExercisePlan, "id" | "exercises">
): boolean => plan.exercises.length > 1 || isRecognizedPracticePlanId(plan.id);
