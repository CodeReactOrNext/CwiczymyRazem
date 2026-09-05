/**
 * Above this (already speed-multiplied) tempo one bar of count-in gets too short to
 * be useful — at 160 bpm a 4/4 count-in lasts 1.5s, which is barely enough to hear
 * the pulse, let alone get the hands ready. From here up we count in two bars.
 */
export const DOUBLE_COUNT_IN_BPM = 120;

/**
 * The count-in is always one plain bar of four quarter notes, whatever meter the
 * exercise itself is in.
 *
 * It used to be the exercise's own meter, so that it "previewed" what was coming.
 * That reads well for 3/4 and turns absurd everywhere else: a drill alternating
 * 12/8 and 4/4 counted itself in for twenty clicks, and any grid with rests in it
 * counted in with gaps. Four beats is what a player expects before a take, and it
 * says the one thing a count-in is for — where the tempo is.
 */
export const COUNT_IN_BEATS = 4;

/**
 * How many quarter-note beats the count-in runs for: one bar, doubled to two once
 * the effective tempo reaches `DOUBLE_COUNT_IN_BPM` so a fast count-in never gets
 * uncomfortably short.
 */
export const getCountInBeats = (effectiveBpm: number): number => {
  if (!Number.isFinite(effectiveBpm) || effectiveBpm <= 0) return COUNT_IN_BEATS;
  return effectiveBpm >= DOUBLE_COUNT_IN_BPM ? COUNT_IN_BEATS * 2 : COUNT_IN_BEATS;
};

/**
 * How long the count-in will run, in milliseconds.
 *
 * Used to hold the exercise timer frozen for exactly that long, so the count-in
 * doesn't eat practice time.
 */
export const getCountInDurationMs = (effectiveBpm: number): number => {
  if (!Number.isFinite(effectiveBpm) || effectiveBpm <= 0) return 0;
  return (getCountInBeats(effectiveBpm) * 60_000) / effectiveBpm;
};
