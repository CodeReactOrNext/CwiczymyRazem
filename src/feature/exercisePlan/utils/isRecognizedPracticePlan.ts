import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";

/**
 * `AutoPlanGenerator` (see `feature/practice/views/AutoPlanGenerator`) is the
 * only place that mints auto-plan ids, always as `"auto-" + Date.now()`. Match
 * that exact shape instead of a loose `startsWith("auto")` prefix, otherwise
 * any id/query param merely starting with "auto" (typed manually, or crafted
 * via the `?planId=` query the report page trusts) would be misrecognized.
 */
const AUTO_PLAN_ID_PATTERN = /^auto-\d+$/;

/** Whether `planId` matches the exact id shape `AutoPlanGenerator` mints — see #735. */
export const isAutoPlanId = (planId: string): boolean => AUTO_PLAN_ID_PATTERN.test(planId);

/**
 * Whether `planId` belongs to an actual, deliberately-selected Practice Plan
 * (a default plan or an auto-generated one) rather than an ad-hoc single-exercise
 * session (Skill Dashboard, Exercise Library, scale drills, quick GP-tab
 * sessions, ...), which reuse the `ExercisePlan` shape but were never picked
 * from "My Plans" / "Browse Plans".
 */
export const isRecognizedPracticePlanId = (planId: string): boolean =>
  isAutoPlanId(planId) || defaultPlans.some((p) => p.id === planId);

/**
 * Whether a finished session represents a real Practice Plan and should count
 * toward the "Complete a Practice Plan" daily quest. A session with more than
 * one exercise is always a real plan; a single-exercise session only counts if
 * it matches a recognized (default or auto-generated) plan id — see #731.
 */
export const isRecognizedPracticePlan = (
  plan: Pick<ExercisePlan, "id" | "exercises">
): boolean => plan.exercises.length > 1 || isRecognizedPracticePlanId(plan.id);
