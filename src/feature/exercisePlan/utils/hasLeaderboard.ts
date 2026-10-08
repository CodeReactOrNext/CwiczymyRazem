import type { Exercise } from "../types/exercise.types";

const CONFIGURABLE_EXERCISE_IDS = new Set([
  "scale_practice_configurable",
  "chord_practice_configurable",
]);

/**
 * Configurable scale/chord practice has no leaderboard. Every pick in the setup
 * dialog generates its own exercise (own id, own tab), so scores would scatter
 * across one board per scale/chord combination while the entry exercise's board
 * stays empty forever — players only ever saw "No scores yet". Covers both the
 * entry exercise and anything the generators produced from it.
 */
export const hasLeaderboard = (
  exercise: Pick<Exercise, "id" | "_generatorConfig">
): boolean =>
  !CONFIGURABLE_EXERCISE_IDS.has(exercise.id) && !exercise._generatorConfig;
