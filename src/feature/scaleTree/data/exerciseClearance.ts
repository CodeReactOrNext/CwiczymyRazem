import type {
  BpmProgressMap,
  RequiredExercise,
} from "../types/scaleTree.types";

/**
 * Whether a required exercise counts as passed, and what tempos it has on
 * record.
 *
 * Pure, and deliberately kept out of `services/scaleTree.service`: that module
 * opens the Firebase *client* SDK at import time, so anything importing it from
 * an API route would boot a browser SDK on the server. The claim routes have to
 * re-check clearance for themselves — a client cannot be trusted to say which
 * nodes it has finished — which is what pulled these two functions out here.
 */

/**
 * Every tempo on record for this exercise, gathered across the ids it has been
 * filed under. A shape that was renamed keeps the runs a player already logged.
 */
export function collectBpms(
  req: RequiredExercise,
  progress: BpmProgressMap,
): number[] {
  return [req.exerciseId, ...(req.legacyExerciseIds ?? [])].flatMap(
    (id) => progress.get(id) ?? [],
  );
}

/**
 * The bar is the exercise's current target BPM, or the lower one it had before
 * the tempo bump — players who already cleared a node under the old rules keep
 * it cleared.
 */
export function isExerciseCleared(
  req: RequiredExercise,
  bpms: number[],
): boolean {
  const threshold =
    req.legacyRequiredBpm != null
      ? Math.min(req.requiredBpm, req.legacyRequiredBpm)
      : req.requiredBpm;
  return bpms.some((b) => b >= threshold);
}
