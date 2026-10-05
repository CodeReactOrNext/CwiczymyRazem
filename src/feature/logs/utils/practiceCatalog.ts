import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { LEGACY_EXERCISE_TITLES } from "feature/exercisePlan/data/legacyExerciseTitles";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";

export const EXERCISES_BY_ID: ReadonlyMap<string, Exercise> = new Map(
  exercisesAgregat.map((exercise) => [exercise.id, exercise]),
);

/**
 * The exercise a title refers to, or `null` when the catalog no longer knows it. Old logs store
 * the title text as it was at log time and names get renamed (#786), so the legacy-title → id map
 * keeps historical rows linking.
 */
export const findExerciseByTitle = (title: string): Exercise | null =>
  exercisesAgregat.find((ex) => ex.title === title) ??
  exercisesAgregat.find((ex) => ex.id === LEGACY_EXERCISE_TITLES[title]) ??
  null;
