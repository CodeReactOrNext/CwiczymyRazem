import { useTranslation } from "hooks/useTranslation";
import { useCallback, useMemo } from "react";

import type { Exercise, ExercisePlan } from "../types/exercise.types";
import { localizeExercise, localizePlan } from "../utils/localizeExercise";

/**
 * Catalogue exercises and plans in the player's language.
 *
 * English is the language the catalogue is written in, so it passes everything
 * through untouched — same objects, no copies, no namespace to fetch.
 */
export function useLocalizeExercise() {
  const { t, i18n } = useTranslation("exercise_content");
  const isEnglish = i18n.language === "en";

  return useCallback(
    <T extends Parameters<typeof localizeExercise>[0]>(exercise: T): T =>
      isEnglish ? exercise : localizeExercise(exercise, t),
    [isEnglish, t],
  );
}

export function useLocalizePlan() {
  const { t, i18n } = useTranslation("exercise_content");
  const isEnglish = i18n.language === "en";

  return useCallback(
    (plan: ExercisePlan): ExercisePlan =>
      isEnglish ? plan : localizePlan(plan, t),
    [isEnglish, t],
  );
}

/** A plan localized once and kept stable between renders. */
export function useLocalizedPlan(plan: ExercisePlan): ExercisePlan {
  const localize = useLocalizePlan();
  return useMemo(() => localize(plan), [localize, plan]);
}

/** A list of exercises localized once and kept stable between renders. */
export function useLocalizedExercises(exercises: Exercise[]): Exercise[] {
  const localize = useLocalizeExercise();
  return useMemo(() => exercises.map(localize), [localize, exercises]);
}
