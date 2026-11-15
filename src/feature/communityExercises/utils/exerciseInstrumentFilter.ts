import type { CommunityExercise } from "feature/communityExercises/types";
import { findTuningPreset } from "utils/audio/tunings";

export const INSTRUMENT_FILTERS = ["all", "guitar", "seven", "bass"] as const;
export type InstrumentFilter = (typeof INSTRUMENT_FILTERS)[number];

/** Which instrument tab an exercise belongs to: bass, seven-string guitar, or the usual six-string. */
export const getExerciseInstrumentKind = (
  exercise: Pick<CommunityExercise, "instrument" | "tuningId">,
): Exclude<InstrumentFilter, "all"> => {
  if (exercise.instrument === "bass") return "bass";
  return findTuningPreset(exercise.tuningId)?.stringCount === 7 ? "seven" : "guitar";
};

export const matchesInstrumentFilter = (
  exercise: Pick<CommunityExercise, "instrument" | "tuningId">,
  filter: InstrumentFilter,
): boolean => filter === "all" || getExerciseInstrumentKind(exercise) === filter;
