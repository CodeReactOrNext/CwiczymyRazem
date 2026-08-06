/**
 * How long the metronome's count-in will run, in milliseconds.
 *
 * Both metronome implementations count in one plain quarter-note per beat of the
 * current meter (`Math.max(1, accentPattern.length)` beats, see `startMetronome`),
 * at the effective — i.e. already speed-multiplied — tempo.
 *
 * Used to hold the exercise timer frozen for exactly that long, so the count-in
 * doesn't eat practice time.
 */
export const getCountInDurationMs = (beatsPerBar: number, effectiveBpm: number): number => {
  if (!Number.isFinite(effectiveBpm) || effectiveBpm <= 0) return 0;
  return (Math.max(1, beatsPerBar) * 60_000) / effectiveBpm;
};
