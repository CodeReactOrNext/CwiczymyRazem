import type { CommunityExercise } from "feature/communityExercises/types";

/**
 * Whether an exercise already has everything the publish form insists on, so
 * it can go public in one click from My Exercises. Exercises saved from the
 * plan creator often don't (no description, no steps) — those are sent to the
 * form instead, where the checklist shows what's missing.
 */
export const isReadyToPublish = (
  exercise: Pick<CommunityExercise, "title" | "description" | "instructions">,
): boolean =>
  !!exercise.title?.trim() &&
  !!exercise.description?.trim() &&
  (exercise.instructions ?? []).some((step) => step.trim().length > 0);
