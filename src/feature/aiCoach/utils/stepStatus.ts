import type { RoadmapStep } from "../types/roadmap.types";
import type { YouTubeLessonResult } from "../types/youtubeLesson.types";

export type StepStatus = "not-started" | "in-progress" | "done";

/** Status from logged sessions — what the map, the progress bar and the finish card read. */
export const getStepStatus = (step: RoadmapStep): StepStatus => {
  if (step.sessionsCompleted >= step.sessionsRequired) return "done";
  if (step.sessionsCompleted > 0) return "in-progress";
  return "not-started";
};

export interface ResourceProgress {
  completed: number;
  total: number;
}

/**
 * How many of the step's checkable resources (the exercise plus the lessons on
 * screen) are ticked off. Only lessons actually in the list count, so an id left
 * over from a lesson that was later removed cannot push `completed` past `total`.
 */
export const getResourceProgress = (
  step: RoadmapStep,
  lessons: YouTubeLessonResult[],
): ResourceProgress => {
  const hasExercise = !!step.suggestedExerciseId && !step.noExercise;
  const completedIds = new Set(step.completedLessonIds ?? []);
  const watched = lessons.filter((lesson) =>
    completedIds.has(lesson.videoId),
  ).length;
  return {
    total: (hasExercise ? 1 : 0) + lessons.length,
    completed: (hasExercise && step.exerciseCompleted ? 1 : 0) + watched,
  };
};

/**
 * Status derived from the resources, so ticking things off is what moves a step
 * through its lifecycle. Null when the step has nothing to tick.
 */
export const getResourceStatus = (
  step: RoadmapStep,
  lessons: YouTubeLessonResult[],
): StepStatus | null => {
  const { completed, total } = getResourceProgress(step, lessons);
  if (total === 0) return null;
  if (completed === 0) return "not-started";
  if (completed >= total) return "done";
  return "in-progress";
};

/** The sessions count that encodes a status — "done" is the step's full requirement. */
export const sessionsForStatus = (
  step: RoadmapStep,
  status: StepStatus,
): number => {
  if (status === "done") return step.sessionsRequired;
  if (status === "in-progress") return 1;
  return 0;
};

/**
 * Re-derives the step's sessions from its ticked resources: ticking anything
 * makes it "in progress", ticking everything makes it "done". A step with nothing
 * to tick is returned untouched — its status is set by hand instead.
 */
export const withResourceStatus = (
  step: RoadmapStep,
  lessons: YouTubeLessonResult[],
): RoadmapStep => {
  const status = getResourceStatus(step, lessons);
  if (status === null) return step;
  return { ...step, sessionsCompleted: sessionsForStatus(step, status) };
};
