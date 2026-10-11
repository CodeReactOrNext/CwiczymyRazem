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
  const minutes =
    catalogMinutesById.get(exercise.id) ??
    (exercise.songData ? DEFAULT_SONG_EXERCISE_MINUTES : exercise.timeInMinutes);
  // A play-along runs as long as its video, which may outlast the listed time.
  const seconds = Math.max((minutes || 0) * 60, videoDurationSeconds ?? 0);
  if (seconds <= 0) return null;
  const limitMs = seconds * 1000;
  return limitMs + Math.max(limitMs * RUN_TIME_TOLERANCE_RATIO, RUN_TIME_MIN_TOLERANCE_MS);
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
