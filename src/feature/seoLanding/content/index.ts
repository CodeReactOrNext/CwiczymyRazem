import type { SeoLandingConfig } from "../types/seoLanding.types";
import { beginnerGuitarExercisesConfig } from "./beginnerGuitarExercises";
import { dailyPracticePlanConfig } from "./dailyPracticePlan";
import { guitarPracticeJournalConfig } from "./guitarPracticeJournal";
import { guitarScaleRoutineConfig } from "./guitarScaleRoutine";
import { guitarSpeedHandSyncConfig } from "./guitarSpeedHandSync";
import { intermediateRoutineConfig } from "./intermediateRoutine";

/** All keyword-targeted landing pages, one config per root-level URL. */
export const seoLandingConfigs: SeoLandingConfig[] = [
  guitarPracticeJournalConfig,
  beginnerGuitarExercisesConfig,
  guitarSpeedHandSyncConfig,
  guitarScaleRoutineConfig,
  intermediateRoutineConfig,
  dailyPracticePlanConfig,
];

export {
  beginnerGuitarExercisesConfig,
  dailyPracticePlanConfig,
  guitarPracticeJournalConfig,
  guitarScaleRoutineConfig,
  guitarSpeedHandSyncConfig,
  intermediateRoutineConfig,
};
