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
 * How long the metronome's count-in will run, in milliseconds.
 *
 * Used to hold the exercise timer frozen for exactly that long, so the count-in
 * doesn't eat practice time.
 */
export const getCountInDurationMs = (beatsPerBar: number, effectiveBpm: number): number => {
  if (!Number.isFinite(effectiveBpm) || effectiveBpm <= 0) return 0;
  return (getCountInBeats(beatsPerBar, effectiveBpm) * 60_000) / effectiveBpm;
};
