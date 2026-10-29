/** Beats of swell a rage gets at the least before it comes in. */
const MIN_LEAD_BEATS = 2;

/**
 * When a rage called at `now` comes in: on the downbeat of a bar (4/4, the
 * boss tabs' metre), the first one at least two beats off, so the swell into
 * it has room. `start` is the audio time of the run's first beat; before it
 * (the count-in) the bars count from there as well.
 */
export const rageEntryTime = (now: number, start: number, bpm: number, beatsPerBar = 4) => {
  const beat = 60 / Math.max(1, bpm);
  const bar = beat * beatsPerBar;
  const bars = Math.ceil((now + MIN_LEAD_BEATS * beat - start) / bar);
  return start + Math.max(0, bars) * bar;
};
