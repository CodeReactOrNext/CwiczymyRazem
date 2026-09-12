import { useMemo } from "react";
import type { GuitarTuningPreset, TuningStringRef } from "utils/audio/tunings";
import { getTuningStrings } from "utils/audio/tunings";

import type { StringTunerResult } from "./useStringTuner";
import { useStringTuner } from "./useStringTuner";

export { TUNER_IN_TUNE_CENTS } from "./useStringTuner";

export interface LiveTunerResult extends StringTunerResult {
  /** Open-string reference pitches for the active tuning, low string (6) first. */
  strings: TuningStringRef[];
}

/**
 * The session's tuner: resolves the six open strings of the player's guitar
 * tuning, then hands them to the shared tuner engine that the standalone tuner
 * at /tools/tuner runs on too.
 */
export function useLiveTuner(
  frequencyRef: React.RefObject<number>,
  volumeRef: React.RefObject<number>,
  tuning: GuitarTuningPreset,
): LiveTunerResult {
  const strings = useMemo(() => getTuningStrings(tuning), [tuning]);
  const result = useStringTuner(frequencyRef, volumeRef, strings, tuning.id);

  return { ...result, strings };
}
