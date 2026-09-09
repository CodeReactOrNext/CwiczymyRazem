import type { AmpParams } from "types/nativeAudio";

/** Params that don't count as "editing the preset" — master level is room
 *  volume, not tone, and gets nudged every session. */
const NOT_TONE: ReadonlySet<keyof AmpParams> = new Set(["level"]);

/**
 * True when the live params have drifted from the preset they were loaded
 * from (any tone-relevant knob/toggle differs). Only the preset's own keys are
 * compared: a preset saved before a param existed leaves that param untouched
 * on load, so it can't be a user edit.
 */
export const isPresetModified = (
  current: AmpParams,
  preset: AmpParams,
): boolean =>
  (Object.keys(preset) as (keyof AmpParams)[]).some(
    (key) => !NOT_TONE.has(key) && current[key] !== preset[key],
  );
