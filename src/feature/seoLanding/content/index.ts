import type { SeoLandingConfig } from "../types/seoLanding.types";
import { beginnerGuitarExercisesConfig } from "./beginnerGuitarExercises";
import { dailyPracticePlanConfig } from "./dailyPracticePlan";
import { guitarScaleRoutineConfig } from "./guitarScaleRoutine";
import { guitarSpeedHandSyncConfig } from "./guitarSpeedHandSync";
import { intermediateRoutineConfig } from "./intermediateRoutine";

/** All keyword-targeted landing pages, one config per root-level URL. */
export const seoLandingConfigs: SeoLandingConfig[] = [
  beginnerGuitarExercisesConfig,
  guitarSpeedHandSyncConfig,
  guitarScaleRoutineConfig,
  intermediateRoutineConfig,
  dailyPracticePlanConfig,
];

export {
  beginnerGuitarExercisesConfig,
  dailyPracticePlanConfig,
  guitarScaleRoutineConfig,
  guitarSpeedHandSyncConfig,
  intermediateRoutineConfig,
};
