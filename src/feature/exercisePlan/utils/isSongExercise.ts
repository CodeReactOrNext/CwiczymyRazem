import type { Exercise } from "../types/exercise.types";

/** True when the plan item is a song from the library rather than a technical
 *  exercise — see `songToExercise`. */
export const isSongExercise = (exercise: Pick<Exercise, "songData">): boolean =>
  !!exercise.songData;
