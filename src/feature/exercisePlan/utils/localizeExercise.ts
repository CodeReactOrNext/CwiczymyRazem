import type { Translate } from "lib/i18n/translate";

import type { Exercise, ExercisePlan } from "../types/exercise.types";

/**
 * The words of a catalogue exercise or plan in the player's language.
 *
 * The catalogue keeps its English inline (exercises are code, with tablature and
 * generators next to the text), and the translations live in the
 * `exercise_content` namespace keyed by the exercise or plan id. Anything with
 * no translation — a user's own exercise, a string added after the last
 * translation pass — keeps the English it was written in.
 */
const NS = "exercise_content";

const lookup = (t: Translate, key: string, fallback: string): string => {
  const full = `${NS}:${key}`;
  const hit = t(full);
  return hit === full ? fallback : hit;
};

const lookupList = (
  t: Translate,
  key: string,
  english: string[] | undefined,
): string[] | undefined =>
  english?.map((line, index) => lookup(t, `${key}.${index}`, line));

/** The text fields only, so cards that hold a trimmed-down exercise work too. */
type ExerciseText = Pick<Exercise, "id" | "title" | "description"> &
  Partial<
    Pick<
      Exercise,
      | "whyItMatters"
      | "instructions"
      | "tips"
      | "customGoal"
      | "customGoalDescription"
      | "additionalText"
    >
  >;

export function localizeExercise<T extends ExerciseText>(
  exercise: T,
  t: Translate,
): T {
  const key = `ex.${exercise.id}`;
  return {
    ...exercise,
    title: lookup(t, `${key}.title`, exercise.title),
    description: lookup(t, `${key}.description`, exercise.description),
    whyItMatters: exercise.whyItMatters
      ? lookup(t, `${key}.whyItMatters`, exercise.whyItMatters)
      : exercise.whyItMatters,
    ...(exercise.instructions
      ? { instructions: lookupList(t, `${key}.instructions`, exercise.instructions) }
      : {}),
    ...(exercise.tips
      ? { tips: lookupList(t, `${key}.tips`, exercise.tips) }
      : {}),
    customGoal: exercise.customGoal
      ? lookup(t, `${key}.customGoal`, exercise.customGoal)
      : exercise.customGoal,
    customGoalDescription: exercise.customGoalDescription
      ? lookup(t, `${key}.customGoalDescription`, exercise.customGoalDescription)
      : exercise.customGoalDescription,
    additionalText: exercise.additionalText
      ? lookup(t, `${key}.additionalText`, exercise.additionalText)
      : exercise.additionalText,
  };
}

export function localizePlan(plan: ExercisePlan, t: Translate): ExercisePlan {
  const key = `plan.${plan.id}`;
  return {
    ...plan,
    title: lookup(t, `${key}.title`, plan.title),
    description: lookup(t, `${key}.description`, plan.description),
    exercises: plan.exercises.map((exercise) => localizeExercise(exercise, t)),
  };
}
