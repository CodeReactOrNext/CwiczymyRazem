import type { BpmProgressData } from "feature/exercisePlan/services/bpmProgressService";

/**
 * Whether the player has anything on record for an exercise — the one place the
 * skill-tree checkmarks, the skill sheet and the browse table all ask.
 *
 * Every way an exercise can be recorded has to be listed here, or the exercises
 * recorded the missing way stay unticked no matter how often they are played:
 * click hunts save a `clickHighScore` and nothing else, scale-tree runs save a
 * `recordBpm`, and the open exercises (improv prompts, play-alongs, ear quizzes,
 * the mic-less phrasing drills) score nothing at all — they are only ever marked
 * by `completedAt`.
 */
export const hasExerciseProgress = (
  progress: Partial<BpmProgressData> | null | undefined
): boolean => {
  if (!progress) return false;
  return (
    (progress.completedBpms?.length ?? 0) > 0 ||
    (progress.micHighScore ?? 0) > 0 ||
    (progress.earTrainingHighScore ?? 0) > 0 ||
    (progress.clickHighScore ?? 0) > 0 ||
    (progress.recordBpm ?? 0) > 0 ||
    !!progress.completedAt
  );
};
