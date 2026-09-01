import { type GridUnit, stepsPerBeat } from "./accentPattern";

/**
 * Above this (already speed-multiplied) tempo one bar of count-in gets too short to
 * be useful — at 160 bpm a 4/4 count-in lasts 1.5s, which is barely enough to hear
 * the pulse, let alone get the hands ready. From here up we count in two bars.
 */
export const DOUBLE_COUNT_IN_BPM = 120;

/**
 * How many beats the count-in runs for.
 *
 * One plain quarter-note per beat of the current meter (`Math.max(1, accentPattern.length)`,
 * see `startMetronome`) — doubled to two full bars once the effective tempo reaches
 * `DOUBLE_COUNT_IN_BPM`, so a fast count-in never gets uncomfortably short. Doubling by
 * whole bars (rather than adding a fixed number of beats) keeps the accent pattern intact,
 * so the count-in still previews the meter the exercise will play in.
 */
export const getCountInBeats = (beatsPerBar: number, effectiveBpm: number): number => {
  const beats = Math.max(1, beatsPerBar);
  if (!Number.isFinite(effectiveBpm) || effectiveBpm <= 0) return beats;
  return effectiveBpm >= DOUBLE_COUNT_IN_BPM ? beats * 2 : beats;
};

/**
 * How many grid entries the count-in ticks for.
 *
 * The doubling rule has to be judged on how long the bar actually *lasts*, which is
 * its length in beats — not on how fast the entries tick. An eighth grid ticks at
 * twice the beat rate, so feeding the entry rate to `getCountInBeats` would push a
 * perfectly slow 7/8 at quarter=60 over DOUBLE_COUNT_IN_BPM and count it in for two
 * bars, eight seconds, for no reason.
 */
export const getCountInSteps = (
  entriesPerBar: number,
  effectiveBpm: number,
  gridUnit: GridUnit = 4,
): number => {
  const perBeat = stepsPerBeat(gridUnit);
  return getCountInBeats(entriesPerBar / perBeat, effectiveBpm) * perBeat;
};

/**
 * How long the metronome's count-in will run, in milliseconds.
 *
 * Used to hold the exercise timer frozen for exactly that long, so the count-in
 * doesn't eat practice time.
 */
export const getCountInDurationMs = (
  entriesPerBar: number,
  effectiveBpm: number,
  gridUnit: GridUnit = 4,
): number => {
  if (!Number.isFinite(effectiveBpm) || effectiveBpm <= 0) return 0;
  const steps = getCountInSteps(entriesPerBar, effectiveBpm, gridUnit);
  return (steps * 60_000) / (effectiveBpm * stepsPerBeat(gridUnit));
};
