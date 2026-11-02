import { exercisesAgregat } from "../data/exercisesAgregat";
import type { Exercise } from "../types/exercise.types";
import { DEFAULT_SONG_EXERCISE_MINUTES } from "./songToExercise";

/**
 * Slack on top of an exercise's own time before a run stops counting as an
 * attempt at it: a share of the time, but never less than a fixed floor, so the
 * shortest drills still forgive a slow start or a held last note.
 */
export const RUN_TIME_TOLERANCE_RATIO = 0.1;
export const RUN_TIME_MIN_TOLERANCE_MS = 15_000;

const catalogMinutesById = new Map(exercisesAgregat.map((exercise) => [exercise.id, exercise.timeInMinutes]));

/** One attempt's own length in ms, before any slack; null without a fixed time. */
const getExerciseLengthMs = (
  exercise: Pick<Exercise, "id" | "timeInMinutes" | "songData">,
  videoDurationSeconds?: number | null
): number | null => {
  const minutes =
    catalogMinutesById.get(exercise.id) ??
    (exercise.songData ? DEFAULT_SONG_EXERCISE_MINUTES : exercise.timeInMinutes);
  // A play-along runs as long as its video, which may outlast the listed time.
  const seconds = Math.max((minutes || 0) * 60, videoDurationSeconds ?? 0);
  return seconds > 0 ? seconds * 1000 : null;
};

const runTimeToleranceMs = (lengthMs: number) =>
  Math.max(lengthMs * RUN_TIME_TOLERANCE_RATIO, RUN_TIME_MIN_TOLERANCE_MS);

/**
 * How long one attempt at the exercise lasts, in ms — what makes scores on its
 * leaderboard comparable. A plan may give a catalogue exercise any slot it likes
 * (20 minutes of a 90-second drill), so a catalogue exercise is held to its own
 * definition, never to the session's copy. A song's board is held to the default
 * song slot for the same reason. Anything else (custom, community) only has the
 * session's time to go by. Null when there is no fixed time at all.
 */
export const getExerciseTimeLimitMs = (
  exercise: Pick<Exercise, "id" | "timeInMinutes" | "songData">,
  videoDurationSeconds?: number | null
): number | null => {
  const lengthMs = getExerciseLengthMs(exercise, videoDurationSeconds);
  return lengthMs === null ? null : lengthMs + runTimeToleranceMs(lengthMs);
};

/**
 * Whether a run lasted a whole attempt at the exercise, give or take the same
 * slack — what a run outside goal mode needs before a goal will judge it. A
 * longer run passes: playing on past the time makes it no easier.
 */
export const isRunFullLength = (
  exercise: Pick<Exercise, "id" | "timeInMinutes" | "songData">,
  runMs: number,
  videoDurationSeconds?: number | null
): boolean => {
  const lengthMs = getExerciseLengthMs(exercise, videoDurationSeconds);
  return lengthMs === null || runMs >= lengthMs - runTimeToleranceMs(lengthMs);
};

/**
 * Whether a run fits inside one attempt at the exercise. A longer run kept
 * scoring past it, so its score is not comparable with anyone else's and stays
 * off the leaderboards — it still counts as the player's own practice.
 */
export const isRunWithinExerciseTime = (
  exercise: Pick<Exercise, "id" | "timeInMinutes" | "songData">,
  runMs: number,
  videoDurationSeconds?: number | null
): boolean => {
  const limitMs = getExerciseTimeLimitMs(exercise, videoDurationSeconds);
  return limitMs === null || runMs <= limitMs;
};
